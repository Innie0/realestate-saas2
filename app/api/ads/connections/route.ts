// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
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

    const { data: connections, error } = await supabase
      .from('ad_platform_connections')
      .select('id, user_id, provider, account_id, account_name, email, is_active, created_at, updated_at')
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Run ads-management.sql in Supabase to enable ad connections.',
        } satisfies APIResponse);
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: connections ?? [] } satisfies APIResponse);
  } catch (error: any) {
    console.error('Get ad connections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get ad connections' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
