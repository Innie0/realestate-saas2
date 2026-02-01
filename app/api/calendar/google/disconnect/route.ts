// Google Calendar disconnect route
// Disconnect Google Calendar integration

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

/**
 * POST handler - Disconnect Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const response: APIResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Delete Google Calendar connection
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google');

    if (error) {
      throw error;
    }

    const response: APIResponse = {
      success: true,
      message: 'Google Calendar disconnected successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Google disconnect error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to disconnect Google Calendar',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
