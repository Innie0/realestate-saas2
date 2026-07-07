// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  clampDay,
  clampFollowupCheckinDay,
  clampFollowupNudgeDay,
  sanitizeFollowupBody,
  sanitizeFollowupSubject,
} from '@/lib/followup-emails';
import {
  MAX_DURATION,
  MAX_NOTICE_HOURS,
  MAX_WINDOW_DAYS,
  MIN_DURATION,
  MIN_NOTICE_HOURS,
  MIN_WINDOW_DAYS,
  isValidTimeString,
} from '@/lib/booking-availability';
import { isValidTimezone } from '@/lib/timezone';

const BOOKING_SETTINGS_FIELDS = [
  'booking_enabled', 'booking_duration_minutes', 'booking_notice_hours',
  'booking_window_days', 'booking_days', 'booking_start_time',
  'booking_end_time', 'booking_timezone', 'booking_location',
] as const;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function sanitizeBookingUpdates(body: Record<string, unknown>): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if ('booking_enabled' in body) {
    updates.booking_enabled = body.booking_enabled === true;
  }
  if ('booking_duration_minutes' in body) {
    updates.booking_duration_minutes = clampInt(body.booking_duration_minutes, MIN_DURATION, MAX_DURATION, 30);
  }
  if ('booking_notice_hours' in body) {
    updates.booking_notice_hours = clampInt(body.booking_notice_hours, MIN_NOTICE_HOURS, MAX_NOTICE_HOURS, 4);
  }
  if ('booking_window_days' in body) {
    updates.booking_window_days = clampInt(body.booking_window_days, MIN_WINDOW_DAYS, MAX_WINDOW_DAYS, 14);
  }
  if ('booking_days' in body) {
    const raw = body.booking_days;
    updates.booking_days = Array.isArray(raw)
      ? Array.from(new Set(raw.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)))
      : [1, 2, 3, 4, 5];
  }
  if ('booking_start_time' in body) {
    updates.booking_start_time = isValidTimeString(body.booking_start_time) ? body.booking_start_time : '09:00';
  }
  if ('booking_end_time' in body) {
    updates.booking_end_time = isValidTimeString(body.booking_end_time) ? body.booking_end_time : '17:00';
  }
  if ('booking_timezone' in body) {
    updates.booking_timezone = typeof body.booking_timezone === 'string' && isValidTimezone(body.booking_timezone)
      ? body.booking_timezone
      : 'America/New_York';
  }
  if ('booking_location' in body) {
    updates.booking_location = typeof body.booking_location === 'string'
      ? body.booking_location.trim().slice(0, 300) || null
      : null;
  }

  return updates;
}

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
      updates[key] = body[key] === null ? null : sanitizeFollowupSubject(body[key]);
      continue;
    }

    if (key.endsWith('_body')) {
      updates[key] = body[key] === null ? null : sanitizeFollowupBody(body[key]);
    }
  }

  const day1 = updates.followup_email_1_day ?? FOLLOWUP_DAY_DEFAULTS.followup_email_1_day;
  const day2Raw = updates.followup_email_2_day ?? FOLLOWUP_DAY_DEFAULTS.followup_email_2_day;
  const day3Raw = updates.followup_email_3_day ?? FOLLOWUP_DAY_DEFAULTS.followup_email_3_day;
  const day2 = clampFollowupCheckinDay(day2Raw, FOLLOWUP_DAY_DEFAULTS.followup_email_2_day);
  const day3 = clampFollowupNudgeDay(day3Raw, day2, FOLLOWUP_DAY_DEFAULTS.followup_email_3_day);

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
      ...BOOKING_SETTINGS_FIELDS,
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    Object.assign(updates, sanitizeFollowupUpdates(updates));
    Object.assign(updates, sanitizeBookingUpdates(updates));

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
