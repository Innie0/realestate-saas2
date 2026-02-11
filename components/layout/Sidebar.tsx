// Sidebar component - Main navigation sidebar for the dashboard
// Displays navigation links and user information
// Mobile-responsive with hamburger menu
// Collapsible mode for more screen space

'use client'; // This component uses client-side features

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Calendar, User, LogOut, Users, FileText, Sparkles, FileSignature, Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
    name: 'Contracts',
    href: '/dashboard/contracts',
    icon: FileSignature,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed sidebar state

  // Persist collapsed state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

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
    <>
      {/* Mobile Header with Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center flex-1">
          <Image
            src="/logo.png"
            alt="Realestic"
            width={160}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: fixed left, Mobile: slide-in overlay */}
      <div 
        className={clsx(
          'fixed top-0 h-screen flex flex-col bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white z-50',
          // Desktop: always visible and relative positioning
          'lg:translate-x-0 lg:relative',
          // Width based on collapsed state
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          // Mobile always full width sidebar
          'w-64',
          // Mobile: hidden by default, slide in when menu open
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-in-out'
        }}
      >
        {/* Logo / Brand section at the top - hidden on mobile (shown in header) */}
        <div className="hidden lg:flex h-20 items-center justify-center border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black overflow-hidden">
          <div className={clsx(
            'transition-all duration-400',
            isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute'
          )}>
            {isCollapsed && (
              <Image
                src="/favicon.png"
                alt="Realestic"
                width={32}
                height={32}
                priority
                className="h-8 w-8"
              />
            )}
          </div>
          <div className={clsx(
            'transition-all duration-400',
            !isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute'
          )}>
            {!isCollapsed && (
              <Image
                src="/logo.png"
                alt="Realestic"
                width={240}
                height={72}
                priority
                className="h-14 w-auto"
              />
            )}
          </div>
        </div>

        {/* Mobile: Add top padding to account for fixed header */}
        <div className="lg:hidden h-16" />

        {/* Navigation links */}
        <nav className={clsx(
          'flex-1 space-y-1 py-4 overflow-y-auto overflow-x-hidden',
          isCollapsed ? 'px-2' : 'px-3'
        )}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={clsx(
                  'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3',
                  active
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white font-semibold shadow-lg border border-purple-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className={clsx(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-purple-500 transition-all duration-300',
                    isCollapsed ? 'h-6' : 'h-8'
                  )} />
                )}
                
                <Icon className={clsx(
                  'flex-shrink-0 transition-all duration-200',
                  isCollapsed ? 'h-5 w-5' : 'h-5 w-5',
                  active ? 'text-purple-400' : 'text-gray-400 group-hover:text-white group-hover:scale-110'
                )} />
                
                <span className={clsx(
                  'transition-all duration-400 whitespace-nowrap',
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                )}>
                  {item.name}
                </span>

                {/* Tooltip bubble for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none transition-all duration-200 z-50 border border-gray-700">
                    {item.name}
                    {/* Arrow pointing to icon */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-800" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle button - desktop only */}
        <div className="hidden lg:block border-t border-gray-800 p-3">
          <button
            onClick={toggleCollapsed}
            className={clsx(
              'flex w-full items-center rounded-lg py-2 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-white/5 hover:text-white',
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
            ) : (
              <>
                <ChevronsLeft className="h-5 w-5 transition-transform duration-200" />
                <span className="transition-all duration-400">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Sign out button at the bottom */}
        <div className="border-t border-gray-800 p-3 pb-safe">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={clsx(
              'flex w-full items-center rounded-lg text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation active:bg-gray-800',
              isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'
            )}
          >
            {isSigningOut ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent flex-shrink-0"></div>
                {!isCollapsed && <span>Signing out...</span>}
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-200 hover:scale-110" />
                {!isCollapsed && <span>Sign Out</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
