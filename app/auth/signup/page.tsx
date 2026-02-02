// Sign up page - User registration page
// Allows new users to create an account with email/password or Google

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signUpWithEmail, signInWithGoogle, supabase } from '@/lib/supabase';

/**
 * Sign up page component
 * Provides email/password registration and Google OAuth options
 */
export default function SignUpPage() {
  const router = useRouter();
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      
      // Use window.location instead of router.push to ensure full page reload
      // This forces the middleware to sync cookies properly
      console.log('[Signup Page] Redirecting to pricing with full reload...');
      window.location.href = '/pricing';
    }
  };

  /**
   * Handle Google OAuth sign up
   */
  const handleGoogleSignUp = async () => {
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Create Your Account</h1>
          <p className="mt-2 text-gray-400">Start creating amazing property listings today</p>
        </div>

        {/* Sign up card */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google sign up button - placed first for prominence */}
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleGoogleSignUp}
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
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">Or sign up with email</span>
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

            {/* Terms and Privacy Agreement Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="terms-agreement"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-white focus:ring-offset-0 focus:ring-offset-gray-900 cursor-pointer"
              />
              <label htmlFor="terms-agreement" className="text-sm text-gray-300 cursor-pointer">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-white hover:text-gray-200 underline transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-white hover:text-gray-200 underline transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={!agreedToTerms || isLoading}
            >
              Create Account
            </Button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">Already have an account? </span>
            <Link href="/auth/login" className="text-white hover:text-gray-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

