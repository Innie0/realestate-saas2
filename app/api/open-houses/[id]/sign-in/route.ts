// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendLeadAlertSMS } from '@/lib/twilio';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid link.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, working_with_agent, interested } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Please enter your name.' }, { status: 400 });
    }

    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ success: false, error: 'Please provide an email or phone number.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify the open house exists and is active
    const { data: openHouse, error: ohError } = await supabase
      .from('open_houses')
      .select('id, user_id, property_address, date, start_time, end_time, notes')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (ohError || !openHouse) {
      return NextResponse.json({ success: false, error: 'This open house is no longer active.' }, { status: 404 });
    }

    const cleanName = name.trim().slice(0, 120);
    const eventDate = new Date(openHouse.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const eventLabel = openHouse.notes?.trim()
      ? `${openHouse.notes.trim()} — ${openHouse.property_address}`
      : openHouse.property_address;
    const openHouseSummary = `${eventLabel} (${eventDate}, ${openHouse.start_time.slice(0, 5)}–${openHouse.end_time.slice(0, 5)})`;

    // Create lead
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        user_id: openHouse.user_id,
        name: cleanName,
        email: cleanEmail || null,
        phone: cleanPhone || null,
        status: 'active',
        source: 'open_house',
        in_crm: false,
        lead_type: interested === true ? 'buyer' : null,
        message: `Open house: ${openHouseSummary}`,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating open house lead:', insertError);
      return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
    }

    // Create note
    const noteParts = [
      `Open house: ${openHouseSummary}`,
      working_with_agent ? 'Already working with an agent' : 'Not currently working with an agent',
      interested ? 'Interested in this property' : null,
    ].filter(Boolean);

    await supabase.from('client_notes').insert({
      client_id: client.id,
      user_id: openHouse.user_id,
      note: noteParts.join('\n'),
    });

    // In-app reminder
    await supabase.from('reminders').insert({
      client_id: client.id,
      user_id: openHouse.user_id,
      title: `Open house visitor: ${cleanName}`,
      description: `${openHouseSummary}\n${cleanEmail ? `Email: ${cleanEmail}` : ''}${cleanPhone ? `\nPhone: ${cleanPhone}` : ''}`,
      reminder_date: new Date().toISOString(),
      is_completed: false,
    });

    // SMS alert
    try {
      const { data: settings } = await supabase
        .from('agent_settings')
        .select('sms_alerts_enabled, sms_phone')
        .eq('user_id', openHouse.user_id)
        .single();

      if (settings?.sms_alerts_enabled && settings?.sms_phone) {
        await sendLeadAlertSMS(
          settings.sms_phone,
          cleanName,
          null,
          cleanPhone || null,
          cleanEmail || null,
          `open house: ${eventLabel}`,
        );
      }
    } catch (e) {
      console.error('SMS alert for open house failed:', e);
    }

    return NextResponse.json({ success: true, message: 'Thanks for signing in!' });
  } catch (err) {
    console.error('POST /api/open-houses/[id]/sign-in error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
