// Outlook Calendar connection route
// Initiates Microsoft OAuth flow

import { NextRequest, NextResponse } from 'next/server';
import { getOutlookAuthUrl } from '@/lib/outlook-calendar';
import { APIResponse } from '@/types';

/**
 * POST handler - Start Outlook Calendar OAuth flow
 * Returns authorization URL for user to visit
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verify user is authenticated
    // const userId = await getUserIdFromSession(request);

    // Generate OAuth URL
    const authUrl = getOutlookAuthUrl();

    const response: APIResponse = {
      success: true,
      data: { authUrl },
      message: 'Please visit the authorization URL to connect Outlook Calendar',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Outlook Calendar connection error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to initiate Outlook Calendar connection',
    };
    return NextResponse.json(response, { status: 500 });
  }
}


