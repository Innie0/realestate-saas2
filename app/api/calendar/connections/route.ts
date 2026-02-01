// @ts-nocheck
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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const response: APIResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Extract user ID to help TypeScript type checking
    const userId = user.id;

    // Get user's calendar connections
    const { data: connections, error: connectionsError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId);

    if (connectionsError) {
      throw connectionsError;
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






