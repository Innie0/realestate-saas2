// @ts-nocheck
// Debug endpoint to check authentication status
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Try to get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Get all cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    return NextResponse.json({
      success: true,
      debug: {
        authenticated: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
        } : null,
        authError: authError?.message || null,
        cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')),
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}










