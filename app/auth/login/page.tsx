'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthPageShell from '@/components/branding/AuthPageShell';
import AuthFormCard, { AuthDivider, AuthGoogleButton } from '@/components/branding/AuthFormCard';
import AuthAlert from '@/components/marketing/AuthAlert';
import AuthPageMotion, { AuthFormMotion } from '@/components/marketing/AuthPageMotion';
import AuthSubmitButton from '@/components/marketing/AuthSubmitButton';
import MarketingInput from '@/components/marketing/MarketingInput';
import { signInWithEmail, signInWithGoogle, supabase } from '@/lib/supabase';
import { hasAppAccess, isAdminEmail } from '@/lib/subscription';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  React.useEffect(() => {
    document.title = 'Sign In - Oikaro';
  }, []);

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setCheckingAuth(false);
        return;
      }

      const isAdmin = isAdminEmail(session.user.email);
      if (isAdmin) {
        router.replace('/dashboard');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', session.user.id)
        .single();

      if (hasAppAccess(userData?.subscription_status, session.user.email)) {
        router.replace('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    const { user, error: loginError } = await signInWithEmail(email, password);

    if (loginError) {
      setError(loginError.message);
      setIsLoading(false);
      return;
    }

    if (user) {
      if (isAdminEmail(user.email)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        window.location.href = '/dashboard';
        return;
      }

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .single();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        window.location.href = hasAppAccess(userData?.subscription_status, user.email)
          ? '/dashboard'
          : '/pricing';
      } catch {
        window.location.href = '/pricing';
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: googleError } = await signInWithGoogle();

    if (googleError) {
      setError(googleError.message);
    }
  };

  if (checkingAuth) {
    return <AuthPageShell />;
  }

  return (
    <AuthPageShell>
      <AuthPageMotion>
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-mkt-secondary sm:text-base">
            Sign in to your Oikaro account
          </p>
        </div>

        <AuthFormCard>
          <AuthFormMotion>
            {error ? <AuthAlert>{error}</AuthAlert> : null}

            <AuthGoogleButton onClick={handleGoogleLogin} label="Continue with Google" />
            <AuthDivider label="or sign in with email" />

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
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
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div data-auth-part className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-mkt-secondary transition-opacity hover:opacity-70"
                >
                  Forgot password?
                </Link>
              </div>

              <div data-auth-part>
                <AuthSubmitButton isLoading={isLoading} loadingLabel="Signing in...">
                  Sign in
                </AuthSubmitButton>
              </div>
            </form>

            <p
              data-auth-part
              className="mt-6 text-center text-sm text-mkt-secondary"
            >
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-mkt-foreground transition-opacity hover:opacity-70"
              >
                Start your 7-day free trial
              </Link>
            </p>
          </AuthFormMotion>
        </AuthFormCard>
      </AuthPageMotion>
    </AuthPageShell>
  );
}
