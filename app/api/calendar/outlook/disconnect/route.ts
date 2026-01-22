// Outlook Calendar disconnect route
// Disconnect Outlook Calendar integration

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

/**
 * POST handler - Disconnect Outlook Calendar
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const response: APIResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Delete Outlook Calendar connection
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'outlook');

    if (error) {
      throw error;
    }

    const response: APIResponse = {
      success: true,
      message: 'Outlook Calendar disconnected successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Outlook disconnect error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to disconnect Outlook Calendar',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
