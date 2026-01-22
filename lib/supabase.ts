// Supabase client configuration
// This file sets up the connection to our Supabase backend

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Create a Supabase client for use in browser/client components
 * This automatically syncs with cookies via the middleware
 */
export const supabase = createClientComponentClient<Database>();

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @param fullName - User's full name (optional)
 * @returns User data or error
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  console.log('[Auth] Attempting sign up...');
  console.log('[Auth] Using supabase client:', typeof supabase);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error('[Auth] Sign up error:', error.message);
    return { user: null, error };
  }

  console.log('[Auth] Sign up successful!', {
    user: data.user?.id,
    hasSession: !!data.session,
    hasAccessToken: !!data.session?.access_token,
  });

  // Check session immediately and after a delay
  const checkSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const lsKeys = Object.keys(localStorage);
    console.log('[Auth] Post-signup check:', {
      hasSessionNow: !!sessionData.session,
      localStorageKeys: lsKeys.filter(k => k.includes('supabase') || k.includes('sb-')),
      allLSKeys: lsKeys,
    });
  };
  
  setTimeout(checkSession, 200);

  return { user: data.user, error: null };
}

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns User data or error
 */
export async function signInWithEmail(email: string, password: string) {
  console.log('[Auth] Attempting sign in...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[Auth] Sign in error:', error.message);
    return { user: null, error };
  }

  console.log('[Auth] Sign in successful!', {
    user: data.user?.id,
    hasSession: !!data.session,
    hasAccessToken: !!data.session?.access_token,
  });

  // Check session immediately and after a delay
  const checkSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const lsKeys = Object.keys(localStorage);
    console.log('[Auth] Post-signin check:', {
      hasSessionNow: !!sessionData.session,
      localStorageKeys: lsKeys.filter(k => k.includes('supabase') || k.includes('sb-')),
      allLSKeys: lsKeys,
    });
  };
  
  setTimeout(checkSession, 200);

  return { user: data.user, error: null };
}

/**
 * Sign in with Google OAuth
 * Redirects the user to Google's login page
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error('Google sign in error:', error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error.message);
    return { error };
  }

  return { error: null };
}

/**
 * Get the current user session
 * @returns Current user or null if not logged in
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Get user error:', error.message);
    return { user: null, error };
  }

  return { user, error: null };
}

/**
 * Get the current user's profile from the users table
 * @returns User profile data with full_name, email, etc.
 */
export async function getUserProfile() {
  const { user } = await getCurrentUser();
  
  if (!user) {
    return { profile: null, error: { message: 'Not authenticated' } };
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Get profile error:', error.message);
    return { profile: null, error };
  }

  return { profile, error: null };
}

/**
 * Update the current user's profile
 * @param updates - Object with fields to update (full_name, avatar_url, etc.)
 * @returns Updated profile or error
 */
export async function updateUserProfile(updates: { full_name?: string; avatar_url?: string }) {
  const { user } = await getCurrentUser();
  
  if (!user) {
    return { profile: null, error: { message: 'Not authenticated' } };
  }

  // Update auth user metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: updates
  });

  if (authError) {
    console.error('Update auth error:', authError.message);
    return { profile: null, error: authError };
  }

  // Update users table
  const { data: profile, error: dbError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (dbError) {
    console.error('Update profile error:', dbError.message);
    return { profile: null, error: dbError };
  }

  return { profile, error: null };
}

