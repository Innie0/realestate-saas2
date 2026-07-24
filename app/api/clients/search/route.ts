// @ts-nocheck
// GET /api/clients/search?q= — lightweight autocomplete for linking clients to transactions
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sanitizeClientSearchQuery } from '@/lib/transaction-client-link';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const q = sanitizeClientSearchQuery(request.nextUrl.searchParams.get('q') || '');
    if (q.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const emailQuery = q.includes('@') ? q.toLowerCase() : null;

    if (emailQuery) {
      const { data: emailMatches, error: emailError } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .eq('user_id', user.id)
        .eq('in_crm', true)
        .ilike('email', emailQuery)
        .limit(8);

      if (emailError) {
        console.error('Client search (email) error:', emailError);
        return NextResponse.json(
          { success: false, error: emailError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: emailMatches ?? [],
      });
    }

    const { data: matches, error } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .eq('user_id', user.id)
      .eq('in_crm', true)
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
      .order('name', { ascending: true })
      .limit(8);

    if (error) {
      console.error('Client search error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const normalized = q.toLowerCase();
    const ranked = (matches ?? []).sort((a, b) => {
      const aExact = a.name?.toLowerCase() === normalized ? 0 : 1;
      const bExact = b.name?.toLowerCase() === normalized ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return (a.name || '').localeCompare(b.name || '');
    });

    return NextResponse.json({
      success: true,
      data: ranked,
    });
  } catch (error) {
    console.error('Error in GET /api/clients/search:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
