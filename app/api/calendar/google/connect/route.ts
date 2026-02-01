// @ts-nocheck
// Google Calendar connection route
// Initiates Google OAuth flow

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-calendar';
import { APIResponse } from '@/types';

/**
 * POST handler - Start Google Calendar OAuth flow
 * Returns authorization URL for user to visit
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verify user is authenticated
    // const userId = await getUserIdFromSession(request);

    // Generate OAuth URL
    const authUrl = getGoogleAuthUrl();

    const response: APIResponse = {
      success: true,
      data: { authUrl },
      message: 'Please visit the authorization URL to connect Google Calendar',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Google Calendar connection error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to initiate Google Calendar connection',
    };
    return NextResponse.json(response, { status: 500 });
  }
}


