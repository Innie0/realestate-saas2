// Public booking API.
//
// GET  /api/booking/[agentId]  -> agent info + open slots for the next N days
// POST /api/booking/[agentId]  -> confirm a slot, creating a calendar event
//                                  + a lead in the agent's CRM
//
// Unauthenticated by design (this is the API behind the public /book/<agentId>
// link an agent shares), so it uses the Supabase service role and validates
// everything carefully — mirrors app/api/leads/route.ts.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasLeadCaptureAccess } from '@/lib/subscription';
import { checkUsageLimit, incrementUsage } from '@/lib/usage';
import { syncCalendarEventToGoogle } from '@/lib/google-calendar';
import { sendEmail } from '@/lib/resend';
import {
  computeAvailableSlots,
  isSlotAvailable,
  type BookingAvailabilitySettings,
} from '@/lib/booking-availability';
import { formatDateLabel, formatTimeInZone } from '@/lib/timezone';
import { SITE_FONT_STACK } from '@/lib/site-config';
import { SUPPORT_FROM } from '@/lib/support-email';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractUuid(agentId: string): string | null {
  const parts = agentId.split('--');
  const candidate = parts[parts.length - 1];
  return UUID_REGEX.test(candidate) ? candidate : null;
}

async function getBookableAgent(agentIdParam: string) {
  const uuid = extractUuid(agentIdParam);
  if (!uuid) return null;

  const supabase = createAdminClient();
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(uuid);
  if (authError || !authData?.user) return null;
  const user = authData.user;

  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')
    .eq('id', uuid)
    .single();

  const isPaid = hasLeadCaptureAccess(
    userData?.subscription_status,
    userData?.subscription_plan,
    user.email,
  );

  const { data: settings } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('user_id', uuid)
    .single();

  return {
    id: uuid,
    name: (user.user_metadata?.full_name as string | undefined) || 'your agent',
    email: user.email ?? '',
    isPaid,
    settings: (settings || null) as BookingAvailabilitySettings | null,
  };
}

async function getBusyEvents(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const { data } = await supabase
    .from('calendar_events')
    .select('start_time, end_time')
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .lte('start_time', horizon.toISOString());
  return data || [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId } = await params;
    const agent = await getBookableAgent(agentId);

    if (!agent || !agent.isPaid) {
      return NextResponse.json({ success: false, error: 'This booking link is not available.' }, { status: 404 });
    }
    if (!agent.settings?.booking_enabled) {
      return NextResponse.json({ success: false, error: 'This agent isn\'t accepting bookings right now.' }, { status: 404 });
    }

    const supabase = createAdminClient();
    const busyEvents = await getBusyEvents(supabase, agent.id);
    const availability = computeAvailableSlots(agent.settings, busyEvents);

    return NextResponse.json({
      success: true,
      agentName: agent.name,
      durationMinutes: agent.settings.booking_duration_minutes || 30,
      timezone: agent.settings.booking_timezone || 'America/New_York',
      location: agent.settings.booking_location || null,
      availability,
    });
  } catch (error) {
    console.error('Error in GET /api/booking/[agentId]:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId } = await params;
    const agent = await getBookableAgent(agentId);

    if (!agent || !agent.isPaid || !agent.settings?.booking_enabled) {
      return NextResponse.json({ success: false, error: 'This booking link is not available.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, message, startTime } = body;

    const cleanName = typeof name === 'string' ? name.trim().slice(0, 120) : '';
    const cleanEmail = typeof email === 'string' ? email.trim().slice(0, 200) : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim().slice(0, 40) : '';
    const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 1000) : '';

    if (!cleanName) {
      return NextResponse.json({ success: false, error: 'Please enter your name.' }, { status: 400 });
    }
    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ success: false, error: 'Please provide an email or phone number.' }, { status: 400 });
    }
    if (typeof startTime !== 'string' || Number.isNaN(new Date(startTime).getTime())) {
      return NextResponse.json({ success: false, error: 'Please pick a valid time.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const busyEvents = await getBusyEvents(supabase, agent.id);

    if (!isSlotAvailable(startTime, agent.settings, busyEvents)) {
      return NextResponse.json(
        { success: false, error: 'That time was just taken. Please pick another slot.' },
        { status: 409 },
      );
    }

    const usage = await checkUsageLimit(supabase, agent.id, 'calendar_events');
    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: 'This agent has reached their booking limit. Please contact them directly.' },
        { status: 403 },
      );
    }

    const durationMinutes = agent.settings.booking_duration_minutes || 30;
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const timezone = agent.settings.booking_timezone || 'America/New_York';

    // --- Create the lead ---------------------------------------------------
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: agent.id,
        name: cleanName,
        email: cleanEmail || null,
        phone: cleanPhone || null,
        status: 'active',
        source: 'booking_link',
        in_crm: false,
        message: cleanMessage || null,
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating booking lead:', clientError);
      return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    // --- Create the calendar event -----------------------------------------
    const title = `Showing with ${cleanName}`;
    const description = [
      `Booked via your booking link.`,
      cleanEmail ? `Email: ${cleanEmail}` : null,
      cleanPhone ? `Phone: ${cleanPhone}` : null,
      cleanMessage ? `Message: ${cleanMessage}` : null,
    ].filter(Boolean).join('\n');

    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        user_id: agent.id,
        title,
        description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location: agent.settings.booking_location || null,
        event_type: 'showing',
        attendees: cleanEmail ? [cleanEmail] : null,
        client_id: client.id,
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating booking event:', eventError);
      return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    await incrementUsage(supabase, agent.id, 'calendar_events');

    // --- Note + immediate in-app notification for the agent ----------------
    await supabase.from('client_notes').insert({
      client_id: client.id,
      user_id: agent.id,
      note: `Booked a showing for ${formatDateLabel(startDate.toISOString().slice(0, 10))} at ${formatTimeInZone(startDate.toISOString(), timezone)} via your booking link.${cleanMessage ? `\nMessage: ${cleanMessage}` : ''}`,
    });

    await supabase.from('reminders').insert({
      client_id: client.id,
      user_id: agent.id,
      title: `New showing booked: ${cleanName} — ${formatDateLabel(startDate.toISOString().slice(0, 10))} at ${formatTimeInZone(startDate.toISOString(), timezone)}`,
      description: [
        cleanEmail ? `Email: ${cleanEmail}` : null,
        cleanPhone ? `Phone: ${cleanPhone}` : null,
        cleanMessage ? `Message: "${cleanMessage}"` : null,
      ].filter(Boolean).join('\n') || null,
      reminder_date: new Date().toISOString(),
      is_completed: false,
    });

    // --- Sync to Google Calendar (best-effort) ------------------------------
    await syncCalendarEventToGoogle(supabase, agent.id, {
      id: event.id,
      title,
      description,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      location: agent.settings.booking_location || null,
      attendees: cleanEmail ? [cleanEmail] : null,
    });

    // --- Confirmation email to the lead (best-effort) -----------------------
    if (cleanEmail) {
      try {
        const dateLabel = formatDateLabel(startDate.toISOString().slice(0, 10));
        const timeLabel = formatTimeInZone(startDate.toISOString(), timezone);
        await sendEmail({
          from: SUPPORT_FROM,
          to: cleanEmail,
          subject: `Showing confirmed with ${agent.name} — ${dateLabel} at ${timeLabel}`,
          html: `
            <div style="font-family:${SITE_FONT_STACK};max-width:480px;margin:0 auto;">
              <h2 style="color:#111827;">You're all set, ${cleanName.split(' ')[0]}!</h2>
              <p style="color:#374151;font-size:15px;line-height:1.6;">
                Your showing with <strong>${agent.name}</strong> is confirmed for:
              </p>
              <p style="font-size:16px;font-weight:600;color:#111827;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
                ${dateLabel} at ${timeLabel}
              </p>
              ${agent.settings.booking_location ? `<p style="color:#374151;font-size:15px;">Location: ${agent.settings.booking_location}</p>` : ''}
              <p style="color:#6b7280;font-size:13px;margin-top:24px;">Sent on behalf of ${agent.name} via Oikaro</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Booking confirmation email failed (non-blocking):', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your showing is confirmed!',
    });
  } catch (error) {
    console.error('Error in POST /api/booking/[agentId]:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
