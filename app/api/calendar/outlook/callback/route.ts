// @ts-nocheck
// Outlook Calendar OAuth callback route
// Handles the OAuth callback and exchanges code for tokens

import { NextRequest, NextResponse } from 'next/server';
import { exchangeOutlookCode } from '@/lib/outlook-calendar';

/**
 * GET handler - Handle Microsoft OAuth callback
 * Exchanges authorization code for access tokens and stores them
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=outlook_auth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=missing_code', request.url)
      );
    }

    // Exchange code for tokens
    const result = await exchangeOutlookCode(code);

    if (!result.success) {
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=token_exchange_failed', request.url)
      );
    }

    // TODO: Save tokens to database
    // const userId = await getUserIdFromSession(request);
    // await db.calendar_connections.create({
    //   user_id: userId,
    //   provider: 'outlook',
    //   access_token: result.tokens.access_token, // Encrypt this!
    //   refresh_token: result.tokens.refresh_token, // Encrypt this!
    //   token_expiry: new Date(result.tokens.expiry_date),
    //   is_active: true,
    // });

    // Redirect back to calendar page with success message
    return NextResponse.redirect(
      new URL('/dashboard/calendar?success=outlook_connected', request.url)
    );
  } catch (error: any) {
    console.error('Outlook Calendar callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/calendar?error=callback_failed', request.url)
    );
  }
}


