// Login page - User authentication page
// Allows users to sign in with email/password or Google

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import AuthPageShell from '@/components/branding/AuthPageShell';
import AuthFormCard, { AuthDivider, AuthGoogleButton } from '@/components/branding/AuthFormCard';
import { MKT } from '@/lib/marketing-design';
import { signInWithEmail, signInWithGoogle, supabase } from '@/lib/supabase';

/**
 * Login page component
 * Provides email/password and Google OAuth login options
 */
export default function LoginPage() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Set page title
  React.useEffect(() => {
    document.title = 'Sign In - Oikaro';
  }, []);

  // Only auto-redirect users who already have an active subscription
  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setCheckingAuth(false);
        return;
      }

      const isAdmin = session.user.email === 'callon786@outlook.com';
      if (isAdmin) {
        router.replace('/dashboard');
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
      } else {
        // No active plan — show the login form, make them enter credentials
        setCheckingAuth(false);
      }
    });
  }, [router]);

  /**
   * Handle email/password login
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // Call Supabase login function
    const { user, error: loginError } = await signInWithEmail(email, password);

    if (loginError) {
      setError(loginError.message);
      setIsLoading(false);
      return;
    }

    // Check subscription status before redirecting
    if (user) {
      // Check if user is admin
      const isAdmin = user.email === 'callon786@outlook.com';
      
      console.log('[Login] User logged in:', {
        userId: user.id,
        email: user.email,
        isAdmin,
      });
      
      if (isAdmin) {
        // Admin user - go directly to dashboard
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.href = '/dashboard';
        return;
      }
      
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .single();
        
        const hasActiveSubscription = 
          userData?.subscription_status === 'active' || 
          userData?.subscription_status === 'trialing';
        
        console.log('[Login] Subscription check:', {
          userId: user.id,
          status: userData?.subscription_status,
          hasActive: hasActiveSubscription,
        });
        
        // Wait a moment for session to fully sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (hasActiveSubscription) {
          // Has subscription - go to dashboard
          window.location.href = '/dashboard';
        } else {
          // No subscription - go to pricing
          window.location.href = '/pricing';
        }
      } catch (error) {
        console.error('[Login] Error checking subscription:', error);
        // On error, redirect to pricing to be safe
        window.location.href = '/pricing';
      }
    }
  };

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = async () => {
    setError('');
    const { error: googleError } = await signInWithGoogle();

    if (googleError) {
      setError(googleError.message);
    }
    // Google OAuth will redirect automatically
  };

  if (checkingAuth) {
    return <AuthPageShell />;
  }

  return (
    <AuthPageShell>
      <div className="mb-8 text-center">
        <h1
          className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl"
          style={{ color: MKT.textPrimary }}
        >
          Welcome back
        </h1>
        <p className="mt-2 text-sm sm:text-base" style={{ color: MKT.textSecondary }}>
          Sign in to your account
        </p>
      </div>

      <AuthFormCard>
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <AuthGoogleButton onClick={handleGoogleLogin} label="Continue with Google" />
        <AuthDivider label="or sign in with email" />

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: MKT.textSecondary }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: MKT.textSecondary }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="font-medium underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
            style={{ color: MKT.textPrimary }}
          >
            Sign up
          </Link>
        </p>
      </AuthFormCard>
    </AuthPageShell>
  );
}

