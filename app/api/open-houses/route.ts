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
      .from('open_houses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('GET /api/open-houses error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { property_address, date, start_time, end_time, notes } = body;

    if (!property_address || !date || !start_time || !end_time) {
      return NextResponse.json({ success: false, error: 'Property address, date, and times are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('open_houses')
      .insert({
        user_id: user.id,
        property_address: property_address.trim(),
        date,
        start_time,
        end_time,
        notes: notes?.trim() || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('POST /api/open-houses error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
