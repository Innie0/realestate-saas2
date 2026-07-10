// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';
import type { AdPlatform } from '@/lib/ads/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    if (provider !== 'google' && provider !== 'meta') {
      return NextResponse.json({ success: false, error: 'Invalid provider' } satisfies APIResponse, {
        status: 400,
      });
    }

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
      .from('ad_platform_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider as AdPlatform);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${provider === 'google' ? 'Google' : 'Meta'} Ads disconnected`,
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('Ad disconnect error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect' } satisfies APIResponse,
      { status: 500 }
    );
  }
}
