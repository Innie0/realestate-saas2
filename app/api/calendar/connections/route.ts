// Calendar connections API route
// Get user's calendar connections

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

/**
 * GET handler - Get user's calendar connections
 */
export async function GET(request: NextRequest) {
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

    // Get user's calendar connections
    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select('id, provider, email, is_active, created_at')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    const response: APIResponse = {
      success: true,
      data: connections || [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Get connections error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to get calendar connections',
    };
    return NextResponse.json(response, { status: 500 });
  }
}






