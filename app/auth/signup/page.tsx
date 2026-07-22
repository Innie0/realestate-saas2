'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthPageShell from '@/components/branding/AuthPageShell';
import AuthFormCard, { AuthDivider, AuthGoogleButton } from '@/components/branding/AuthFormCard';
import AuthAlert from '@/components/marketing/AuthAlert';
import AuthPageMotion, { AuthFormMotion, AuthTrialBadge } from '@/components/marketing/AuthPageMotion';
import AuthSubmitButton from '@/components/marketing/AuthSubmitButton';
import MarketingInput from '@/components/marketing/MarketingInput';
import { signUpWithEmail, signInWithGoogle, supabase } from '@/lib/supabase';
import { PRO_MONTHLY_PRICE_ID, STARTER_MONTHLY_PRICE_ID } from '@/lib/pricing';

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: STARTER_MONTHLY_PRICE_ID,
  pro: PRO_MONTHLY_PRICE_ID,
};

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan')?.toLowerCase() || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  React.useEffect(() => {
    document.title = 'Sign Up - Oikaro';
  }, []);

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setCheckingAuth(false);
        return;
      }

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
          // Fall through
        }
      }

      setCheckingAuth(false);
    });
  }, [router, planParam]);

  if (checkingAuth) {
    return <AuthPageShell />;
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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

    const { user, session, error: signUpError } = await signUpWithEmail(email, password, fullName);

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (user && session) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        setError('Session not established. Please try signing in manually.');
        setIsLoading(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

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
          // Fall through
        }
      }

      window.location.href = '/pricing';
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    const { error: googleError } = await signInWithGoogle(planParam || undefined);

    if (googleError) {
      setError(googleError.message);
    }
  };

  return (
    <AuthPageShell>
      <AuthPageMotion>
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <AuthTrialBadge />
          </div>
          <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-mkt-secondary sm:text-base">
            Set up your account, then start your 7-day free trial — no charge until the trial ends.
          </p>
        </div>

        <AuthFormCard>
          <AuthFormMotion>
            {error ? <AuthAlert>{error}</AuthAlert> : null}

            <AuthGoogleButton onClick={handleGoogleSignUp} label="Continue with Google" />
            <AuthDivider label="or sign up with email" />

            <form onSubmit={handleEmailSignUp} className="flex flex-col gap-4">
              <div data-auth-part>
                <MarketingInput
                  label="Full name"
                  type="text"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div data-auth-part>
                <MarketingInput
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div data-auth-part>
                <MarketingInput
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  helperText="Must be at least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div data-auth-part>
                <MarketingInput
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div data-auth-part className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mkt-checkbox"
                />
                <label
                  htmlFor="terms-agreement"
                  className="cursor-pointer text-sm leading-relaxed text-mkt-secondary"
                >
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-mkt-foreground underline-offset-2 transition-opacity hover:opacity-70 hover:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-mkt-foreground underline-offset-2 transition-opacity hover:opacity-70 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div data-auth-part>
                <AuthSubmitButton
                  isLoading={isLoading}
                  loadingLabel="Creating account..."
                  disabled={!agreedToTerms}
                >
                  Create account
                </AuthSubmitButton>
              </div>
            </form>

            <p
              data-auth-part
              className="mt-6 text-center text-sm text-mkt-secondary"
            >
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-mkt-foreground transition-opacity hover:opacity-70"
              >
                Sign in
              </Link>
            </p>
          </AuthFormMotion>
        </AuthFormCard>
      </AuthPageMotion>
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
