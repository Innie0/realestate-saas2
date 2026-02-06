// Login page - User authentication page
// Allows users to sign in with email/password or Google

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-400">Sign in to your account</p>
        </div>

        {/* Login card */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email/Password form */}
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

            {/* Forgot password link */}
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Google login button */}
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Sign up link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">Don't have an account? </span>
            <Link href="/auth/signup" className="text-white hover:text-gray-300 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

