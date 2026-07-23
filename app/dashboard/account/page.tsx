// Account page - User account settings and profile
// Allows users to update their profile information

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import DashboardPage from '@/components/layout/DashboardPage';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PlanUsagePanel, { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';
import { AccountPageContentSkeleton } from '@/components/dashboard/page-loading';
import { User, Lock, CreditCard, Sparkles } from 'lucide-react';
import { getCurrentUser, updateUserProfile, supabase } from '@/lib/supabase';
import { getPaidPlanName, isAdminEmail, hasRealStripeSubscription } from '@/lib/subscription';
import { getPlanDisplayPrice } from '@/lib/pricing';
import { useToast } from '@/components/providers/ToastProvider';
import { useApi } from '@/lib/swr';
import Link from 'next/link';

/**
 * Account page component
 * User profile and account settings
 */
export default function AccountPage() {
  const toast = useToast();
  const { response: usageResponse, isLoading: usageLoading } = useApi('/api/usage');
  const usage = (usageResponse?.data ?? null) as Record<string, { current: number; limit: number }> | null;
  const usagePlan = (usageResponse?.plan as 'starter' | 'pro') ?? 'starter';
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isResettingBilling, setIsResettingBilling] = useState(false);
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  // Set page title
  React.useEffect(() => {
    document.title = 'Account - Oikaro';
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

  // Refresh billing after returning from Stripe portal
  React.useEffect(() => {
    const onFocus = () => {
      if (stripeSubscriptionId) {
        fetch('/api/stripe/sync-billing')
          .then((r) => r.json())
          .then((data) => {
            if (data.billing) {
              setSubscriptionStatus(data.billing.subscription_status);
              setSubscriptionPlan(data.billing.subscription_plan);
              setPeriodEnd(data.billing.subscription_current_period_end);
              setStripeSubscriptionId(data.billing.stripe_subscription_id);
              setCancelAtPeriodEnd(Boolean(data.billing.subscription_cancel_at_period_end));
            }
          })
          .catch(() => undefined);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [stripeSubscriptionId]);

  /**
   * Load user data from Supabase
   */
  const loadUserData = async () => {
    try {
      const { user } = await getCurrentUser();
      
      if (user) {
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
        setIsAdminAccount(isAdminEmail(user.email));

        const { data: billing } = await supabase
          .from('users')
          .select(
            'subscription_status, subscription_plan, subscription_current_period_end, stripe_subscription_id, subscription_cancel_at_period_end',
          )
          .eq('id', user.id)
          .single();

        if (billing) {
          setSubscriptionStatus(billing.subscription_status);
          setSubscriptionPlan(billing.subscription_plan);
          setPeriodEnd(billing.subscription_current_period_end);
          setStripeSubscriptionId(billing.stripe_subscription_id);
          setCancelAtPeriodEnd(Boolean(billing.subscription_cancel_at_period_end));
        }

        if (billing?.stripe_subscription_id) {
          try {
            const syncRes = await fetch('/api/stripe/sync-billing');
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.billing) {
                setSubscriptionStatus(syncData.billing.subscription_status);
                setSubscriptionPlan(syncData.billing.subscription_plan);
                setPeriodEnd(syncData.billing.subscription_current_period_end);
                setStripeSubscriptionId(syncData.billing.stripe_subscription_id);
                setCancelAtPeriodEnd(Boolean(syncData.billing.subscription_cancel_at_period_end));
              }
            }
          } catch {
            // Keep Supabase values if Stripe sync fails
          }
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
    setProfileError(null);

    try {
      const { error } = await updateUserProfile({
        full_name: fullName
      });

      if (error) throw error;

      toast.success('Profile updated');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Update error:', error);
      setProfileError(`Failed to update profile: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setIsPasswordSaving(true);

    try {
      if (!newPassword || !confirmPassword) {
        throw new Error('Please enter both password fields');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete account');

      await supabase.auth.signOut();
      window.location.href = '/?account-deleted=1';
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : 'Something went wrong');
      setIsDeleting(false);
    }
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
      toast.error(message);
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
      setCancelAtPeriodEnd(false);
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
    : cancelAtPeriodEnd && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
      ? 'Canceling'
      : subscriptionStatus === 'trialing'
        ? 'Free trial'
        : subscriptionStatus === 'active'
          ? 'Active'
          : subscriptionStatus === 'past_due'
            ? 'Past due'
            : subscriptionStatus === 'canceled'
              ? 'Canceled'
              : subscriptionStatus ?? '—';

  const formattedPeriodEnd = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const periodDetail =
    formattedPeriodEnd &&
    subscriptionStatus &&
    ['active', 'trialing'].includes(subscriptionStatus)
      ? cancelAtPeriodEnd
        ? ` · Access until ${formattedPeriodEnd}`
        : subscriptionStatus === 'trialing'
          ? ` · Trial ends ${formattedPeriodEnd}`
          : ` · Renews ${formattedPeriodEnd}`
      : null;

  if (isLoadingData) {
    return (
      <DashboardPage
        title="Account"
        subtitle="Manage your profile, plan, and preferences"
        size="narrow"
      >
        <AccountPageContentSkeleton />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="Account"
      subtitle="Manage your profile, plan, and preferences"
      size="narrow"
    >
        {showUpgradedBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-[10px] border border-brand-200 bg-brand-50 px-4 py-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">You&apos;re on Pro</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Your plan was upgraded. A prorated charge may appear on your next Stripe receipt.
              </p>
            </div>
          </div>
        )}
        {usage ? (
          <PlanUsagePanel usage={usage} plan={usagePlan} />
        ) : usageLoading ? (
          <PlanUsagePanelSkeleton />
        ) : null}

        <div className="space-y-5">
          {/* Profile information */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <User className="w-5 h-5 text-gray-900" />
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
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
              {profileError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {profileError}
                </p>
              )}
              <div className="flex gap-3">
                <Button type="submit" isLoading={isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Subscription & billing */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <CreditCard className="w-5 h-5 text-gray-900" />
              <h2 className="text-lg font-semibold text-gray-900">Subscription & Billing</h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-700">Plan</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium border border-brand-200">
                  {planName === 'pro' && <Sparkles className="w-3.5 h-3.5" />}
                  {planLabel}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Status: <span className="font-medium text-gray-900">{statusLabel}</span>
                {periodDetail && (
                  <span className="text-gray-700">{periodDetail}</span>
                )}
              </p>
              {cancelAtPeriodEnd && formattedPeriodEnd && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Your subscription is canceled and will not renew. You&apos;ll keep access until{' '}
                  <span className="font-medium">{formattedPeriodEnd}</span>.
                </p>
              )}
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
                  Manage billing
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
            <p className="text-xs text-gray-700 mt-4">
              {adminCompAccess
                ? 'Your admin account uses Starter plan limits with no Stripe subscription required.'
                : 'Update payment method, view invoices, or cancel your subscription from the billing portal.'}
            </p>
          </Card>

          {/* Password */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <Lock className="w-5 h-5 text-gray-900" />
              <h2 className="text-lg font-semibold text-gray-900">Password</h2>
            </div>

            <p className="text-gray-600 mb-4">
              Choose a new password while you&apos;re signed in. You&apos;ll stay logged in on this device.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              {passwordError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {passwordError}
                </p>
              )}
              <Button type="submit" isLoading={isPasswordSaving}>
                Update password
              </Button>
            </form>
          </Card>

          {/* Danger zone */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-3">Danger zone</h2>
            <p className="text-gray-600 mb-4">
              Permanently delete your account, cancel any active subscription, and remove your data. This cannot be undone.
            </p>
            <Button variant="danger" onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null); }}>
              Delete account
            </Button>
          </Card>
        </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="Delete account"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          This cancels billing and permanently deletes your account and data. Type{' '}
          <span className="font-mono font-semibold text-gray-900">DELETE</span> to confirm.
        </p>

        <Input
          label="Confirmation"
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />

        {deleteError && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {deleteError}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            isLoading={isDeleting}
            fullWidth
          >
            Delete my account
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </DashboardPage>
  );
}

