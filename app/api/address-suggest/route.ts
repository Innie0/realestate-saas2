import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { fetchMapboxAddressSuggestions } from '@/lib/mapbox-address-suggest';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (q.length < 3) {
      return NextResponse.json({ success: true, data: [] });
    }

    const suggestions = await fetchMapboxAddressSuggestions(q, 6);

    return NextResponse.json({ success: true, data: suggestions });
  } catch (err) {
    console.error('GET /api/address-suggest:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
