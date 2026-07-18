// Sign up page - User registration page
// Allows new users to create an account with email/password or Google

'use client'; // This page uses client-side features

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuthPageShell from '@/components/branding/AuthPageShell';
import { signUpWithEmail, signInWithGoogle, supabase } from '@/lib/supabase';
import { PRO_MONTHLY_PRICE_ID, STARTER_MONTHLY_PRICE_ID } from '@/lib/pricing';

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: STARTER_MONTHLY_PRICE_ID,
  pro: PRO_MONTHLY_PRICE_ID,
};

/**
 * Sign up page component
 * Provides email/password registration and Google OAuth options
 */
function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan')?.toLowerCase() || '';
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Hide form until we confirm the visitor is not already logged in
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Set page title
  React.useEffect(() => {
    document.title = 'Sign Up - Oikaro';
  }, []);

  // Redirect already-authenticated users
  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        // Not logged in — show the form
        setCheckingAuth(false);
        return;
      }

      // Check if they already have an active subscription
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', session.user.id)
        .single();

      const hasActive =
        userData?.subscription_status === 'active' ||
        userData?.subscription_status === 'trialing';

      if (hasActive) {
        router.replace('/dashboard');
        return;
      }

      // Logged in, no subscription, plan selected → go straight to Stripe
      const priceId = PLAN_PRICE_IDS[planParam];
      if (priceId) {
        try {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ priceId, mode: 'subscription' }),
          });
          const checkoutData = await res.json();
          if (res.ok && checkoutData.url) {
            window.location.href = checkoutData.url;
            return;
          }
        } catch {
          // Fall through — show the form
        }
      }

      // No active plan and no plan param — show the form, don't auto-redirect
      setCheckingAuth(false);
    });
  }, [router, planParam]);

  if (checkingAuth) {
    return <AuthPageShell />;
  }

  /**
   * Handle email/password registration
   */
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      setIsLoading(false);
      return;
    }

    // Call Supabase sign up function
    const { user, session, error: signUpError } = await signUpWithEmail(email, password, fullName);

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    // Show success message
    if (user && session) {
      console.log('[Signup Page] Signup complete, verifying session...');
      
      // Verify session is actually established
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('[Signup Page] Session verification:', {
        hasSession: !!currentSession,
        hasAccessToken: !!currentSession?.access_token,
        userId: currentSession?.user?.id,
      });
      
      if (!currentSession) {
        setError('Session not established. Please try signing in manually.');
        setIsLoading(false);
        return;
      }
      
      // Wait for session to fully sync
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If a plan was pre-selected, go straight to Stripe checkout
      const priceId = PLAN_PRICE_IDS[planParam];
      if (priceId) {
        console.log('[Signup Page] Plan selected, creating Stripe checkout for', planParam);
        try {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ priceId, mode: 'subscription' }),
          });
          const checkoutData = await res.json();
          if (res.ok && checkoutData.url) {
            window.location.href = checkoutData.url;
            return;
          }
        } catch {
          // Fall through to pricing page if checkout creation fails
        }
      }

      console.log('[Signup Page] Redirecting to pricing with full reload...');
      window.location.href = '/pricing';
    }
  };

  /**
   * Handle Google OAuth sign up
   */
  const handleGoogleSignUp = async () => {
    setError('');
    const { error: googleError } = await signInWithGoogle(planParam || undefined);

    if (googleError) {
      setError(googleError.message);
    }
    // Google OAuth will redirect automatically
  };

  return (
    <AuthPageShell>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-700">Create your account, then start your 7-day free trial</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          {/* Error message */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google sign up button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-700">or sign up with email</span>
            </div>
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              helperText="Must be at least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {/* Terms checkbox */}
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms-agreement"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
              />
              <label htmlFor="terms-agreement" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-gray-900 hover:text-gray-900 underline underline-offset-2 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-gray-900 hover:text-gray-900 underline underline-offset-2 transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!agreedToTerms || isLoading}
              className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-gray-700">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gray-900 hover:text-gray-900 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
    </AuthPageShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthPageShell />}>
      <SignUpForm />
    </Suspense>
  );
}

