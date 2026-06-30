// @ts-nocheck
// Public lead capture API route.
//
// POST /api/leads
// Accepts an UNAUTHENTICATED submission from a public lead capture form
// (app/lead/[agentId]/page.tsx) and creates a client/lead record in the
// target agent's account using the Supabase service role (bypasses RLS).
//
// This endpoint is intentionally public, so it validates input carefully and
// confirms the target agent actually exists before writing anything.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { scheduleLeadFollowupEmails } from '@/lib/schedule-lead-followup';
import { sendLeadAlertSMS } from '@/lib/twilio';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_LEAD_TYPES = ['buyer', 'seller', 'renter', 'browsing'];

/**
 * POST /api/leads
 * Create a new lead from the public capture form.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, name, email, phone, leadType, timeline, budget, area, message, source, listingAddress, projectId } = body;

    // --- Validation -------------------------------------------------------
    if (!agentId || !UUID_REGEX.test(agentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid form link.' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Please enter your name.' },
        { status: 400 }
      );
    }

    // Require contact info (both for listing inquiries; either for general lead form)
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const leadSource =
      source === 'listing_page' ? 'listing_page' : 'lead_form';

    if (leadSource === 'listing_page') {
      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Please enter your email.' },
          { status: 400 }
        );
      }
      const phoneDigits = cleanPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid phone number.' },
          { status: 400 }
        );
      }
    } else if (!cleanEmail && !cleanPhone) {
      return NextResponse.json(
        { success: false, error: 'Please provide an email or phone number.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim().slice(0, 120);
    const cleanMessage =
      typeof message === 'string' ? message.trim().slice(0, 2000) : '';
    const cleanLeadType =
      typeof leadType === 'string' && VALID_LEAD_TYPES.includes(leadType)
        ? leadType
        : null;
    const cleanTimeline = typeof timeline === 'string' ? timeline.trim().slice(0, 50) : '';
    const cleanBudget = typeof budget === 'string' ? budget.trim().slice(0, 50) : '';
    const cleanArea = typeof area === 'string' ? area.trim().slice(0, 200) : '';
    const cleanListingAddress =
      typeof listingAddress === 'string' ? listingAddress.trim().slice(0, 300) : '';
    const cleanProjectId =
      typeof projectId === 'string' && UUID_REGEX.test(projectId) ? projectId : null;

    const supabase = createAdminClient();

    // --- Confirm the agent exists ----------------------------------------
    const { data: agent, error: agentError } = await supabase
      .from('users')
      .select('id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'This form is no longer available.' },
        { status: 404 }
      );
    }

    let linkedProjectId: string | null = null;
    if (cleanProjectId && leadSource === 'listing_page') {
      const { data: listingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('id', cleanProjectId)
        .eq('user_id', agentId)
        .eq('published', true)
        .maybeSingle();

      if (listingProject) {
        linkedProjectId = listingProject.id;
      }
    }

    // --- Create the lead --------------------------------------------------
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        user_id: agentId,
        name: cleanName,
        email: cleanEmail || null,
        phone: cleanPhone || null,
        status: 'active',
        source: leadSource,
        in_crm: false,
        lead_type: cleanLeadType,
        message: cleanMessage || null,
        project_id: linkedProjectId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating lead:', insertError);
      return NextResponse.json(
        { success: false, error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // --- Store the message as a note (shows in the CRM timeline) ----------
    const noteParts = [
      cleanListingAddress ? `Listing: ${cleanListingAddress}` : null,
      cleanLeadType ? `Interested in: ${cleanLeadType}` : null,
      cleanTimeline ? `Timeline: ${cleanTimeline}` : null,
      cleanBudget ? `Budget: ${cleanBudget}` : null,
      cleanArea ? `Area: ${cleanArea}` : null,
      cleanMessage ? `Message: ${cleanMessage}` : null,
    ].filter(Boolean);

    if (noteParts.length > 0) {
      await supabase.from('client_notes').insert({
        client_id: client.id,
        user_id: agentId,
        note: `New lead from ${leadSource === 'listing_page' ? 'listing page' : 'website form'}.\n${noteParts.join('\n')}`,
      });
    }

    // --- Create an in-app reminder so the agent is notified immediately ----
    // Setting reminder_date to now ensures it appears in the notifications
    // panel with the "Today" badge the moment the agent opens their dashboard.
    const leadTypeLabel = cleanLeadType
      ? ` (${cleanLeadType.charAt(0).toUpperCase() + cleanLeadType.slice(1)})`
      : '';

    await supabase.from('reminders').insert({
      client_id: client.id,
      user_id: agentId,
      title: `New lead: ${cleanName}${leadTypeLabel} — ${leadSource === 'listing_page' ? 'listing inquiry' : 'submitted your lead form'}`,
      description: [
        cleanEmail ? `Email: ${cleanEmail}` : null,
        cleanPhone ? `Phone: ${cleanPhone}` : null,
        cleanTimeline ? `Timeline: ${cleanTimeline}` : null,
        cleanBudget ? `Budget: ${cleanBudget}` : null,
        cleanArea ? `Area: ${cleanArea}` : null,
        cleanMessage ? `Message: "${cleanMessage}"` : null,
      ]
        .filter(Boolean)
        .join('\n') || null,
      reminder_date: new Date().toISOString(),
      is_completed: false,
    });

    // --- Auto follow-up emails + SMS alerts --------------------------------
    // Fire-and-forget: don't let failures here break the lead submission.
    try {
      const { data: settings } = await supabase
        .from('agent_settings')
        .select(`
          auto_followup_enabled, sms_alerts_enabled, sms_phone, profile_email,
          followup_email_1_day, followup_email_2_day, followup_email_3_day,
          followup_email_1_subject, followup_email_1_body,
          followup_email_2_subject, followup_email_2_body,
          followup_email_3_subject, followup_email_3_body
        `)
        .eq('user_id', agentId)
        .single();

      // Schedule follow-up emails if enabled and lead has an email
      if (settings?.auto_followup_enabled && cleanEmail) {
        await scheduleLeadFollowupEmails({
          supabase,
          clientId: client.id,
          agentId,
          leadName: cleanName,
          leadEmail: cleanEmail,
          leadType: cleanLeadType,
          area: cleanArea,
          settings,
        });
      }

      // Send SMS alert to agent if enabled
      if (settings?.sms_alerts_enabled && settings?.sms_phone) {
        try {
          await sendLeadAlertSMS(
            settings.sms_phone,
            cleanName,
            cleanLeadType,
            cleanPhone || null,
            cleanEmail || null,
          );
        } catch (smsErr) {
          console.error('SMS alert failed:', smsErr);
        }
      }
    } catch (notifErr) {
      console.error('Notification setup failed (non-blocking):', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Thanks! Your details were sent successfully.',
    });
  } catch (error) {
    console.error('Error in POST /api/leads:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
