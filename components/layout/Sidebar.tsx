'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Calendar, User, LogOut, Users, FileText,
  Menu, X, ChevronsLeft, ChevronsRight, Search, Inbox, Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { signOut } from '@/lib/supabase';
import { prefetchDashboardRoute } from '@/lib/dashboard-prefetch';
import { useToast } from '@/components/providers/ToastProvider';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Work',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
      { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Clients', href: '/dashboard/clients', icon: Users },
      { name: 'Leads', href: '/dashboard/leads', icon: Inbox },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Property Research', href: '/dashboard/property-research', icon: Search },
      { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
      { name: 'AI Assistant', href: '/dashboard/tasks', icon: Sparkles },
    ],
  },
];

function NavLink({
  item,
  active,
  isCollapsed,
  onNavigate,
  onPrefetch,
}: {
  item: NavItem;
  active: boolean;
  isCollapsed: boolean;
  onNavigate: () => void;
  onPrefetch: (href: string) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={() => onPrefetch(item.href)}
      onFocus={() => onPrefetch(item.href)}
      title={isCollapsed ? item.name : undefined}
      className={clsx(
        'group relative flex items-center rounded-md text-[13px] font-medium transition-colors duration-150',
        isCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-[7px]',
        active ? 'text-brand-700' : 'text-gray-600 hover:text-gray-900'
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-md bg-brand-50"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      {!active && (
        <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 group-hover:bg-gray-100/70 transition-opacity" />
      )}
      <Icon
        className={clsx(
          'relative z-10 h-[16px] w-[16px] flex-shrink-0',
          active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
        )}
        strokeWidth={1.75}
      />
      <span
        className={clsx(
          'relative z-10 transition-all duration-300 whitespace-nowrap',
          isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
        )}
      >
        {item.name}
      </span>
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none transition-all duration-150 z-50">
          {item.name}
        </div>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Failed to sign out. Please try again.');
        setIsSigningOut(false);
        return;
      }
      router.push('/auth/login');
    } catch {
      toast.error('Failed to sign out. Please try again.');
      setIsSigningOut(false);
    }
  };

  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center flex-1 min-h-0 overflow-visible">
          <Image
            src="/logo-sidebar.png"
            alt="Realestic"
            width={480}
            height={144}
            priority
            className="h-9 w-auto max-w-[200px] object-contain scale-[1.8] origin-left"
          />
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={closeMobile} />
      )}

      <div
        className={clsx(
          'fixed top-0 h-screen flex flex-col bg-gray-50 z-50 border-r border-gray-200/80',
          'lg:translate-x-0 lg:relative',
          isCollapsed ? 'lg:w-[56px]' : 'lg:w-[212px]',
          'w-60',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ transition: 'width 0.2s ease, transform 0.2s ease' }}
      >
        <div className="hidden lg:flex h-14 shrink-0 items-center border-b border-gray-200/80 overflow-visible px-3">
          {isCollapsed ? (
            <Image
              src="/logo-collapsed.png"
              alt="Realestic"
              width={128}
              height={128}
              priority
              className="h-7 w-7 object-contain mx-auto"
            />
          ) : (
            <Image
              src="/logo-sidebar.png"
              alt="Realestic"
              width={640}
              height={192}
              priority
              className="h-7 w-auto max-w-[150px] object-contain object-left"
            />
          )}
        </div>

        <div className="lg:hidden h-16 shrink-0" />

        <nav
          className={clsx(
            'flex-1 overflow-y-auto overflow-x-hidden py-3',
            isCollapsed ? 'px-2' : 'px-2.5'
          )}
        >
          {navGroups.map((group) => (
            <div key={group.label} className={clsx('mb-4 last:mb-2', isCollapsed && 'mb-3')}>
              {!isCollapsed && (
                <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-px">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    isCollapsed={isCollapsed}
                    onNavigate={closeMobile}
                    onPrefetch={(href) => prefetchDashboardRoute(href, router)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200/80 p-2 space-y-px">
          <Link
            href="/dashboard/account"
            onClick={closeMobile}
            title={isCollapsed ? 'Account' : undefined}
            className={clsx(
              'relative flex items-center rounded-md text-[13px] font-medium transition-colors',
              isCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-[7px]',
              pathname.startsWith('/dashboard/account')
                ? 'text-brand-700'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {pathname.startsWith('/dashboard/account') && (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-md bg-brand-50"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <User className="relative z-10 h-[16px] w-[16px] flex-shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span className="relative z-10">Account</span>}
          </Link>
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            disabled={isSigningOut}
            title={isCollapsed ? 'Sign out' : undefined}
            className={clsx(
              'flex w-full items-center rounded-md text-[13px] font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50',
              isCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-[7px]'
            )}
          >
            <LogOut className="h-[16px] w-[16px] flex-shrink-0" strokeWidth={1.75} />
            {!isCollapsed && <span>Sign out</span>}
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={clsx(
              'hidden lg:flex w-full items-center rounded-md py-[7px] text-[13px] text-gray-400 hover:bg-gray-100/70 hover:text-gray-700 transition-colors',
              isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-2.5'
            )}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showSignOutModal}
        onClose={() => !isSigningOut && setShowSignOutModal(false)}
        title="Sign out?"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          You&apos;ll need to sign in again to access your dashboard.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowSignOutModal(false)} disabled={isSigningOut}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isSigningOut}
            onClick={() => {
              setShowSignOutModal(false);
              handleSignOut();
            }}
          >
            Sign out
          </Button>
        </div>
      </Modal>
    </>
  );
}
