// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getAllUsage } from '@/lib/usage';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getAllUsage(supabase, user.id);

    return NextResponse.json({ success: true, data: usage });
  } catch (error: any) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get usage' },
      { status: 500 }
    );
  }
}
