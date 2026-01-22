// Account page - User account settings and profile
// Allows users to update their profile information

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { User, Mail, Lock, X } from 'lucide-react';
import { getCurrentUser, updateUserProfile, supabase } from '@/lib/supabase';

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
    <div>
      {/* Page header */}
      <Header 
        title="Account Settings" 
        subtitle="Manage your account information and preferences"
      />

      {/* Page content */}
      <div className="p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Profile information */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">Profile Information</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Profile picture */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-black flex items-center justify-center text-white text-2xl font-medium">
                    {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                </div>
              </div>

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

          {/* Password section */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">Password</h2>
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
              <Mail className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">Email Preferences</h2>
            </div>

            <div className="space-y-4">
              {/* Email notification toggles */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" defaultChecked />
                <div>
                  <p className="font-medium text-white">Product Updates</p>
                  <p className="text-sm text-gray-600">Get notified about new features and updates</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" defaultChecked />
                <div>
                  <p className="font-medium text-white">Tips & Resources</p>
                  <p className="text-sm text-gray-600">Receive helpful tips for creating better listings</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                <div>
                  <p className="font-medium text-white">Marketing Emails</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-xl border border-white/10 max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
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

