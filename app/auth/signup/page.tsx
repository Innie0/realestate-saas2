// Sign up page - User registration page
// Allows new users to create an account with email/password or Google

'use client'; // This page uses client-side features

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import AuthPageShell from '@/components/branding/AuthPageShell';
import AuthFormCard, { AuthDivider, AuthGoogleButton } from '@/components/branding/AuthFormCard';
import { MKT } from '@/lib/marketing-design';
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
      <div className="mb-8 text-center">
        <h1
          className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl"
          style={{ color: MKT.textPrimary }}
        >
          Create your account
        </h1>
        <p className="mt-2 text-sm sm:text-base" style={{ color: MKT.textSecondary }}>
          Create your account, then start your 7-day free trial
        </p>
      </div>

      <AuthFormCard>
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <AuthGoogleButton onClick={handleGoogleSignUp} label="Continue with Google" />
        <AuthDivider label="or sign up with email" />

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

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="terms-agreement"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 bg-gray-100 text-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
            <label
              htmlFor="terms-agreement"
              className="cursor-pointer text-sm leading-relaxed"
              style={{ color: MKT.textSecondary }}
            >
              I agree to the{' '}
              <Link
                href="/terms"
                target="_blank"
                className="underline underline-offset-2 transition-opacity hover:opacity-80"
                style={{ color: MKT.textPrimary }}
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="underline underline-offset-2 transition-opacity hover:opacity-80"
                style={{ color: MKT.textPrimary }}
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={!agreedToTerms || isLoading}
            className="mkt-cta flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ borderRadius: MKT.radius.button }}
          >
            {isLoading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: MKT.textSecondary }}>
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
            style={{ color: MKT.textPrimary }}
          >
            Sign in
          </Link>
        </p>
      </AuthFormCard>
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

