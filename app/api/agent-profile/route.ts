// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { hasProLeadToolsAccess } from '@/lib/subscription';

const CORE_PROFILE_FIELDS = [
  'profile_enabled',
  'profile_headline',
  'profile_bio',
  'profile_photo_url',
  'profile_specialties',
  'profile_areas',
  'profile_phone',
  'profile_email',
];

const EXTENDED_PROFILE_FIELDS = [
  'profile_brokerage',
  'profile_license',
  'profile_website',
  'profile_years_experience',
];

function pickProfileUpdates(body: Record<string, unknown>, fields: string[]) {
  const updates: Record<string, unknown> = {};
  for (const key of fields) {
    if (key in body) updates[key] = body[key];
  }
  return updates;
}

function isMissingColumnError(message?: string) {
  if (!message) return false;
  return /column .* does not exist/i.test(message) || /Could not find the .* column/i.test(message);
}

async function upsertAgentSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  updates: Record<string, unknown>,
) {
  const { data: existing } = await supabase
    .from('agent_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return supabase
      .from('agent_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
  }

  return supabase
    .from('agent_settings')
    .insert({ user_id: userId, ...updates })
    .select()
    .single();
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
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const fullName = user.user_metadata?.full_name || '';
    const nameSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const profileUrl = nameSlug ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/agent/${nameSlug}--${user.id}` : '';

    return NextResponse.json({
      success: true,
      data: data || null,
      profileUrl,
      fullName,
    });
  } catch (err) {
    console.error('GET /api/agent-profile error:', err);
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

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    if (!hasProLeadToolsAccess(userData?.subscription_status, userData?.subscription_plan, user.email)) {
      return NextResponse.json(
        { success: false, error: 'Agent profiles are available on the Pro plan. Upgrade to publish your profile.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const coreUpdates = pickProfileUpdates(body, CORE_PROFILE_FIELDS);
    const extendedUpdates = pickProfileUpdates(body, EXTENDED_PROFILE_FIELDS);

    if (Object.keys(coreUpdates).length === 0 && Object.keys(extendedUpdates).length === 0) {
      return NextResponse.json({ success: false, error: 'No profile fields to update.' }, { status: 400 });
    }

    // Always save core fields first (includes profile_enabled toggle).
    let { data, error } = await upsertAgentSettings(supabase, user.id, coreUpdates);

    if (error) {
      console.error('PUT /api/agent-profile core save error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Extended fields are optional until agent-profile-enhancements.sql is applied.
    if (Object.keys(extendedUpdates).length > 0) {
      const extendedResult = await upsertAgentSettings(supabase, user.id, extendedUpdates);
      if (extendedResult.error) {
        if (isMissingColumnError(extendedResult.error.message)) {
          console.warn('Extended profile columns missing; core profile saved without them.');
        } else {
          console.error('PUT /api/agent-profile extended save error:', extendedResult.error);
          return NextResponse.json({
            success: true,
            data,
            warning: 'Profile saved, but some optional fields could not be saved.',
          });
        }
      } else if (extendedResult.data) {
        data = extendedResult.data;
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('PUT /api/agent-profile error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
