// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies APIResponse, {
        status: 401,
      });
    }

    const { error } = await supabase
      .from('ad_ai_insights')
      .update({ dismissed: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true } satisfies APIResponse);
      }
      throw error;
    }

    return NextResponse.json({ success: true } satisfies APIResponse);
  } catch (error: any) {
    console.error('Dismiss insight error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dismiss' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
