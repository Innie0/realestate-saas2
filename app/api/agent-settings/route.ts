// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { clampDay, sanitizeFollowupBody, sanitizeFollowupSubject } from '@/lib/followup-emails';

const FOLLOWUP_TEMPLATE_FIELDS = [
  'followup_email_1_day', 'followup_email_2_day', 'followup_email_3_day',
  'followup_email_1_subject', 'followup_email_1_body',
  'followup_email_2_subject', 'followup_email_2_body',
  'followup_email_3_subject', 'followup_email_3_body',
] as const;

const FOLLOWUP_DAY_DEFAULTS: Record<string, number> = {
  followup_email_1_day: 0,
  followup_email_2_day: 2,
  followup_email_3_day: 5,
};

function sanitizeFollowupUpdates(body: Record<string, unknown>): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  for (const key of FOLLOWUP_TEMPLATE_FIELDS) {
    if (!(key in body)) continue;

    if (key.endsWith('_day')) {
      updates[key] = clampDay(body[key], FOLLOWUP_DAY_DEFAULTS[key] ?? 0);
      continue;
    }

    if (key.endsWith('_subject')) {
      updates[key] = sanitizeFollowupSubject(body[key]);
      continue;
    }

    if (key.endsWith('_body')) {
      updates[key] = sanitizeFollowupBody(body[key]);
    }
  }

  const day1 = updates.followup_email_1_day ?? FOLLOWUP_DAY_DEFAULTS.followup_email_1_day;
  const day2Raw = updates.followup_email_2_day ?? FOLLOWUP_DAY_DEFAULTS.followup_email_2_day;
  const day3Raw = updates.followup_email_3_day ?? FOLLOWUP_DAY_DEFAULTS.followup_email_3_day;
  const day2 = Math.max(day2Raw, day1);
  const day3 = Math.max(day3Raw, day2);

  if ('followup_email_2_day' in updates || 'followup_email_1_day' in updates) {
    updates.followup_email_2_day = day2;
  }
  if ('followup_email_3_day' in updates || 'followup_email_2_day' in updates || 'followup_email_1_day' in updates) {
    updates.followup_email_3_day = day3;
  }

  return updates;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('agent_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (err) {
    console.error('GET /api/agent-settings error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const allowedFields = [
      'auto_followup_enabled', 'sms_alerts_enabled', 'sms_phone',
      'profile_enabled', 'profile_headline', 'profile_bio',
      'profile_photo_url', 'profile_specialties', 'profile_areas',
      'profile_phone', 'profile_email',
      ...FOLLOWUP_TEMPLATE_FIELDS,
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    Object.assign(updates, sanitizeFollowupUpdates(updates));

    const { data: existing } = await supabase
      .from('agent_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let data;
    if (existing) {
      const { data: updated, error } = await supabase
        .from('agent_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      data = updated;
    } else {
      const { data: created, error } = await supabase
        .from('agent_settings')
        .insert({ user_id: user.id, ...updates })
        .select()
        .single();
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      data = created;
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('PUT /api/agent-settings error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
