// Sidebar component - Main navigation sidebar for the dashboard
// Displays navigation links and user information

'use client'; // This component uses client-side features

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Calendar, User, LogOut, Users, FileText, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { signOut } from '@/lib/supabase';

/**
 * Navigation items configuration
 * Each item has a name, path, and icon
 */
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderKanban,
  },
  {
    name: 'Transactions',
    href: '/dashboard/transactions',
    icon: FileText,
  },
  {
    name: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
  },
  {
    name: 'Tasks',
    href: '/dashboard/tasks',
    icon: Sparkles,
  },
  {
    name: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    name: 'Account',
    href: '/dashboard/account',
    icon: User,
  },
];

/**
 * Sidebar component
 * Main navigation sidebar that appears on the left side of the dashboard
 */
export default function Sidebar() {
  const pathname = usePathname(); // Get current path to highlight active link
  const router = useRouter(); // For redirecting after sign out
  const [isSigningOut, setIsSigningOut] = useState(false); // Loading state for sign out

  /**
   * Check if a navigation item is currently active
   * @param href - The href of the navigation item
   * @returns boolean - Whether the item is active
   */
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  /**
   * Handle user sign out
   * Signs the user out and redirects to login page
   */
  const handleSignOut = async () => {
    // Confirm before signing out
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }

    setIsSigningOut(true);

    try {
      // Call Supabase sign out function
      const { error } = await signOut();

      if (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
        setIsSigningOut(false);
        return;
      }

      // Redirect to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* Logo / Brand section at the top */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
        <Image
          src="/logo.png"
          alt="Realestic"
          width={160}
          height={48}
          priority
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold shadow-lg' // Active link styles
                  : 'text-gray-400 hover:bg-gradient-to-r hover:from-gray-900 hover:to-gray-800 hover:text-white' // Inactive link styles
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out button at the bottom */}
      <div className="border-t border-gray-900 p-3">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningOut ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

