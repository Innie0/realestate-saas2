// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('agent_settings')
      .select('profile_enabled, profile_headline, profile_bio, profile_photo_url, profile_specialties, profile_areas, profile_phone, profile_email, profile_brokerage, profile_license, profile_website, profile_years_experience')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
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

    const body = await request.json();
    const profileFields = [
      'profile_enabled', 'profile_headline', 'profile_bio',
      'profile_photo_url', 'profile_specialties', 'profile_areas',
      'profile_phone', 'profile_email',
      'profile_brokerage', 'profile_license', 'profile_website', 'profile_years_experience',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of profileFields) {
      if (key in body) updates[key] = body[key];
    }

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
    console.error('PUT /api/agent-profile error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
