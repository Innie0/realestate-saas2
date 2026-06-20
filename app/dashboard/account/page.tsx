// Account page - User account settings and profile
// Allows users to update their profile information

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { User, Mail, Lock, X, CreditCard, Sparkles } from 'lucide-react';
import { getCurrentUser, updateUserProfile, supabase } from '@/lib/supabase';
import { getPaidPlanName, isAdminEmail, hasRealStripeSubscription } from '@/lib/subscription';
import { getPlanDisplayPrice } from '@/lib/pricing';
import Link from 'next/link';

/**
 * Account page component
 * User profile and account settings
 */
export default function AccountPage() {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [userId, setUserId] = useState<string>('');
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'request' | 'verify'>('request');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isResettingBilling, setIsResettingBilling] = useState(false);
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  // Set page title
  React.useEffect(() => {
    document.title = 'Account - Realestic';
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('upgraded=1')) {
      setShowUpgradedBanner(true);
      window.history.replaceState({}, '', '/dashboard/account');
    }
  }, []);

  // Load user data on mount
  React.useEffect(() => {
    loadUserData();
  }, []);

  /**
   * Load user data from Supabase
   */
  const loadUserData = async () => {
    try {
      const { user } = await getCurrentUser();
      
      if (user) {
        setUserId(user.id);
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
        setIsAdminAccount(isAdminEmail(user.email));

        const { data: billing } = await supabase
          .from('users')
          .select(
            'subscription_status, subscription_plan, subscription_current_period_end, stripe_subscription_id',
          )
          .eq('id', user.id)
          .single();

        if (billing) {
          setSubscriptionStatus(billing.subscription_status);
          setSubscriptionPlan(billing.subscription_plan);
          setPeriodEnd(billing.subscription_current_period_end);
          setStripeSubscriptionId(billing.stripe_subscription_id);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  /**
   * Handle profile update
   */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { profile, error } = await updateUserProfile({
        full_name: fullName
      });

      if (error) throw error;

      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request password change - sends verification code
   */
  const handleRequestPasswordChange = async () => {
    setPasswordError('');
    setIsPasswordLoading(true);

    try {
      // Generate a 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // In a real app, you would send this via email
      // For now, we'll show it in a simulated email
      console.log('Verification code:', code);
      
      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Verification code sent to ${email}!\n\nFor development: Your code is ${code}`);
      setPasswordStep('verify');
    } catch (error: any) {
      setPasswordError('Failed to send verification code. Please try again.');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  /**
   * Verify code and update password
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setIsPasswordLoading(true);

    try {
      // Validate verification code
      if (verificationCode !== generatedCode) {
        throw new Error('Invalid verification code');
      }

      // Validate password
      if (!newPassword || !confirmPassword) {
        throw new Error('Please enter both password fields');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Update password in Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Success
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      resetPasswordModal();
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  /**
   * Reset password modal state
   */
  const resetPasswordModal = () => {
    setPasswordStep('request');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setGeneratedCode('');
  };

  /**
   * Open password change modal
   */
  const openPasswordModal = () => {
    resetPasswordModal();
    setShowPasswordModal(true);
  };

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not open billing portal');
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      alert(message);
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleResetAdminBilling = async () => {
    if (!confirm('Cancel Stripe billing and restore free admin Starter access?')) return;
    setIsResettingBilling(true);
    setBillingMessage(null);
    try {
      const res = await fetch('/api/stripe/reset-admin-billing', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setBillingMessage(data.message || 'Admin access restored.');
      setSubscriptionStatus(null);
      setSubscriptionPlan(null);
      setPeriodEnd(null);
      setStripeSubscriptionId(null);
      setShowUpgradedBanner(false);
    } catch (err: unknown) {
      setBillingMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsResettingBilling(false);
    }
  };

  const hasPaidStripe = hasRealStripeSubscription(subscriptionStatus, stripeSubscriptionId);
  const adminCompAccess = isAdminAccount && !hasPaidStripe;

  const planName = adminCompAccess ? 'starter' : getPaidPlanName(subscriptionPlan);
  const planLabel = adminCompAccess
    ? 'Starter (Admin access)'
    : planName
      ? planName === 'pro'
        ? `Pro (${getPlanDisplayPrice('pro', 'monthly')}/mo)`
        : `Starter (${getPlanDisplayPrice('starter', 'monthly')}/mo)`
      : 'No active plan';
  const statusLabel = adminCompAccess
    ? 'Comp access — no billing'
    : subscriptionStatus === 'trialing'
      ? 'Free trial'
      : subscriptionStatus === 'active'
        ? 'Active'
        : subscriptionStatus === 'past_due'
          ? 'Past due'
          : subscriptionStatus === 'canceled'
            ? 'Canceled'
            : subscriptionStatus ?? '—';

  // Show loading state while fetching user data
  if (isLoadingData) {
    return (
      <div>
        <Header title="Account Settings" subtitle="Loading..." />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <Header 
        title="Account Settings" 
        subtitle="Manage your account information and preferences"
      />

      {/* Page content */}
      <div className="p-4 sm:p-6 max-w-4xl mx-auto text-gray-900">
        {showUpgradedBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">You&apos;re on Pro</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Your plan was upgraded. A prorated charge may appear on your next Stripe receipt.
              </p>
            </div>
          </div>
        )}
        <div className="space-y-6">
          {/* Profile information */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Full name input */}
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />

              {/* Email input - Read only */}
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                helperText="Email cannot be changed for security reasons"
                disabled
              />

              {/* Save button */}
              <div className="flex gap-3">
                <Button type="submit" isLoading={isLoading}>
                  Save Changes
                </Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          {/* Subscription & billing */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">Subscription & Billing</h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium border border-brand-200">
                  {planName === 'pro' && <Sparkles className="w-3.5 h-3.5" />}
                  {planLabel}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Status: <span className="font-medium text-gray-900">{statusLabel}</span>
                {periodEnd && subscriptionStatus && ['active', 'trialing'].includes(subscriptionStatus) && (
                  <span className="text-gray-500">
                    {' '}· Renews {new Date(periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </p>
            </div>

            {billingMessage && (
              <p className="text-sm text-brand-700 mb-4 rounded-xl bg-brand-50 border border-brand-200 px-3 py-2">
                {billingMessage}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {!adminCompAccess && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManageBilling}
                  isLoading={isPortalLoading}
                >
                  Manage billing in Stripe
                </Button>
              )}
              {adminCompAccess && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetAdminBilling}
                  isLoading={isResettingBilling}
                >
                  Reset Stripe billing
                </Button>
              )}
              {isAdminAccount && hasPaidStripe && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetAdminBilling}
                  isLoading={isResettingBilling}
                >
                  Restore admin access
                </Button>
              )}
              {planName === 'starter' && (
                <Link href="/dashboard/upgrade">
                  <Button type="button">Upgrade to Pro</Button>
                </Link>
              )}
              {!planName && (
                <Link href="/pricing">
                  <Button type="button">View plans</Button>
                </Link>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              {adminCompAccess
                ? 'Your admin account uses Starter plan limits with no Stripe subscription required.'
                : 'Update payment method, view invoices, or cancel your subscription through Stripe\u2019s secure portal.'}
            </p>
          </Card>

          {/* Password section */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">Password</h2>
            </div>

            <p className="text-gray-600 mb-4">
              Update your password to keep your account secure.
            </p>

            <Button variant="outline" onClick={openPasswordModal}>
              Change Password
            </Button>
          </Card>

          {/* Email preferences */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">Email Preferences</h2>
            </div>

            <div className="space-y-4">
              {/* Email notification toggles */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" defaultChecked />
                <div>
                  <p className="font-medium text-gray-900">Product Updates</p>
                  <p className="text-sm text-gray-600">Get notified about new features and updates</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" defaultChecked />
                <div>
                  <p className="font-medium text-gray-900">Tips & Resources</p>
                  <p className="text-sm text-gray-600">Receive helpful tips for creating better listings</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                <div>
                  <p className="font-medium text-gray-900">Marketing Emails</p>
                  <p className="text-sm text-gray-600">Promotional emails and special offers</p>
                </div>
              </label>
            </div>

            <div className="mt-6">
              <Button>Save Preferences</Button>
            </div>
          </Card>

          {/* Danger zone */}
          <Card>
            <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
            <p className="text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="danger">
              Delete Account
            </Button>
          </Card>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {passwordError}
              </div>
            )}

            {/* Step 1: Request verification code */}
            {passwordStep === 'request' && (
              <div>
                <p className="text-gray-600 mb-4">
                  We'll send a verification code to <strong>{email}</strong> to confirm it's you.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleRequestPasswordChange}
                    isLoading={isPasswordLoading}
                    fullWidth
                  >
                    Send Verification Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Verify code and set new password */}
            {passwordStep === 'verify' && (
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <Input
                    label="Verification Code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    maxLength={6}
                    helperText={`Code sent to ${email}`}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    helperText="Must be at least 6 characters"
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      isLoading={isPasswordLoading}
                      fullWidth
                    >
                      Change Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswordStep('request')}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

