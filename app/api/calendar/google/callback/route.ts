// @ts-nocheck
// Google Calendar OAuth callback route
// Handles the OAuth callback and exchanges code for tokens

import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode, getGoogleCalendarEvents, getGoogleUserInfo } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase-server';
import { syncGoogleCalendarIntoOikaro } from '@/lib/calendar-sync';

/**
 * GET handler - Handle Google OAuth callback
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
        new URL('/dashboard/calendar?error=google_auth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=missing_code', request.url)
      );
    }

    // Exchange code for tokens
    const result = await exchangeGoogleCode(code);

    if (!result.success) {
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=token_exchange_failed', request.url)
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error in callback:', authError);
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=not_authenticated', request.url)
      );
    }

    console.log('✅ User authenticated:', user.id);
    
    // Check if tokens exist
    if (!result.tokens) {
      console.error('❌ No tokens received from Google');
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=no_tokens', request.url)
      );
    }
    
    console.log('✅ Got Google tokens:', {
      hasAccessToken: !!result.tokens.access_token,
      hasRefreshToken: !!result.tokens.refresh_token,
      expiryDate: result.tokens.expiry_date
    });

    // Get user's actual Google account email from Google API
    const userInfoResult = await getGoogleUserInfo(result.tokens.access_token);
    
    if (!userInfoResult.success || !userInfoResult.email) {
      console.error('❌ Failed to get Google user info');
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=failed_to_get_email', request.url)
      );
    }

    const googleEmail = userInfoResult.email;
    console.log('✅ Got Google email:', googleEmail);

    // Save or update calendar connection in database
    const { error: upsertError } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: user.id,
        provider: 'google',
        email: googleEmail,
        access_token: result.tokens.access_token,
        refresh_token: result.tokens.refresh_token,
        token_expiry: result.tokens.expiry_date ? new Date(result.tokens.expiry_date).toISOString() : new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider'
      });

    if (upsertError) {
      console.error('❌ Failed to save calendar connection:', upsertError);
      return NextResponse.redirect(
        new URL('/dashboard/calendar?error=save_failed', request.url)
      );
    }

    console.log('✅ Calendar connection saved to database');

    // Import existing events from Google Calendar
    try {
      const { data: connection } = await supabase
        .from('calendar_connections')
        .select('id, access_token, refresh_token, token_expiry')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();
      if (connection) {
        const synced = await syncGoogleCalendarIntoOikaro(supabase, user.id, connection);
        if (synced.error) console.error('Initial Google Calendar sync failed:', synced.error);
      }
    } catch (syncError) {
      console.error('❌ Initial sync failed:', syncError);
      // Don't fail the whole flow if sync fails
    }

    // Redirect back to calendar page with success message
    return NextResponse.redirect(
      new URL('/dashboard/calendar?success=google_connected', request.url)
    );
  } catch (error: any) {
    console.error('Google Calendar callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/calendar?error=callback_failed', request.url)
    );
  }
}


