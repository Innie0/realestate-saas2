// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getAllUsage, getPlanName } from '@/lib/usage';
import { hasAppAccess } from '@/lib/subscription';

export async function GET(request: NextRequest) {
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

    const plan = getPlanName(userData?.subscription_plan, userData?.subscription_status);
    const usage = await getAllUsage(supabase, user.id);
    const hasAccess = hasAppAccess(userData?.subscription_status, user.email);

    return NextResponse.json({
      success: true,
      data: usage,
      plan,
      subscription_status: userData?.subscription_status ?? null,
      hasAccess,
    });
  } catch (error: any) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get usage' },
      { status: 500 }
    );
  }
}
