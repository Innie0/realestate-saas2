'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Calendar, LogOut, Users, FileText,
  Menu, X, ChevronsLeft, ChevronsRight, Search, Inbox, Sparkles, ChevronDown, Megaphone,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';
import { signOut, getCurrentUser } from '@/lib/supabase';
import { prefetchDashboardRoute } from '@/lib/dashboard-prefetch';
import { useToast } from '@/components/providers/ToastProvider';
import { useDashboardTheme } from '@/components/providers/DashboardThemeProvider';
import ThemePillToggle from '@/components/ui/ThemePillToggle';
import { useCommandPalette } from '@/components/search/CommandPalette';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useApi } from '@/lib/swr';
import { SITE_NAME } from '@/lib/site-config';

interface RecentClient {
  id: string;
  name: string;
  created_at: string;
}

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
      { name: 'Ads', href: '/dashboard/ads', icon: Megaphone },
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
  count,
}: {
  item: NavItem;
  active: boolean;
  isCollapsed: boolean;
  onNavigate: () => void;
  onPrefetch: (href: string) => void;
  count?: number;
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
        'group relative flex items-center rounded-lg text-[13px] font-medium transition-colors duration-100',
        isCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-[7px]',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <Icon
        className={clsx(
          'relative z-10 h-[14px] w-[14px] flex-shrink-0',
          active ? 'text-inherit' : 'text-muted-foreground group-hover:text-foreground',
        )}
        strokeWidth={1.8}
      />
      <span
        className={clsx(
          'relative z-10 flex-1 transition-all duration-300 whitespace-nowrap',
          isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
        )}
      >
        {item.name}
      </span>
      {!isCollapsed && !!count && count > 0 && (
        <span
          className={clsx(
            'relative z-10 rounded-full px-[6px] py-[1px] font-mono text-[10px] font-semibold',
            active
              ? 'bg-background/20 text-background'
              : 'bg-foreground text-background',
          )}
        >
          {count}
        </span>
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none transition-all duration-150 z-50 shadow-md">
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
  const { open: openCommandPalette } = useCommandPalette();
  const { preference, setPreference } = useDashboardTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const [userMenuPosition, setUserMenuPosition] = useState<{
    left: number;
    width: number;
    bottom: number;
  } | null>(null);

  const { data: inboxLeadsData } = useApi<RecentClient[]>('/api/clients?status=all&view=inbox');
  const inboxLeadCount = Array.isArray(inboxLeadsData) ? inboxLeadsData.length : 0;

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          setUserName(user.user_metadata?.full_name || 'User');
          setUserEmail(user.email || '');
        }
      } catch {
        // non-critical — footer just shows a fallback
      }
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  useLayoutEffect(() => {
    if (!isUserMenuOpen || isCollapsed) {
      setUserMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = userMenuTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setUserMenuPosition({
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top + 8,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isUserMenuOpen, isCollapsed]);

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
  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-[var(--canvas)] px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 min-h-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-foreground text-[11px] font-bold text-background">
            {SITE_NAME.charAt(0)}
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-foreground">{SITE_NAME}</span>
        </Link>
        <button
          type="button"
          onClick={() => openCommandPalette()}
          className="rounded-lg p-2 transition-colors hover:bg-muted lg:hidden"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg p-2 transition-colors hover:bg-muted"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={closeMobile} />
      )}

      <div
        className={clsx(
          'fixed top-0 h-screen flex flex-col bg-[var(--sidebar)] z-50 border-r border-border',
          'lg:translate-x-0 lg:relative',
          isCollapsed ? 'lg:w-[56px]' : 'lg:w-[216px]',
          'w-60',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ transition: 'width 0.2s ease, transform 0.2s ease' }}
      >
        <div className="hidden lg:flex h-[52px] shrink-0 items-center gap-2 border-b border-border overflow-visible px-4">
          {isCollapsed ? (
            <Image
              src="/logo-collapsed.png"
              alt={SITE_NAME}
              width={128}
              height={128}
              priority
              className="h-7 w-7 object-contain mx-auto"
            />
          ) : (
            <>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-foreground text-[11px] font-bold text-background">
                {SITE_NAME.charAt(0)}
              </span>
              <span className="text-[13px] font-semibold tracking-tight text-foreground">{SITE_NAME}</span>
            </>
          )}
        </div>

        <div className="lg:hidden h-16 shrink-0" />

        {!isCollapsed && (
          <div className="hidden lg:block px-2.5 pt-2.5">
            <button
              type="button"
              onClick={() => openCommandPalette()}
              className="flex w-full items-center gap-2 rounded-[7px] border border-border bg-[var(--surface)] px-2.5 py-[6px] text-[12.5px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/40"
            >
              <Search className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-left">Search</span>
              <span className="rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </span>
            </button>
          </div>
        )}

        <nav
          className={clsx(
            'flex-1 overflow-y-auto overflow-x-hidden py-3.5',
            isCollapsed ? 'px-2' : 'px-2.5'
          )}
        >
          {navGroups.map((group) => (
            <div key={group.label} className={clsx('mb-[18px] last:mb-2', isCollapsed && 'mb-3')}>
              {!isCollapsed && (
                <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
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
                    count={item.href === '/dashboard/leads' ? inboxLeadCount : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative z-20 shrink-0 border-t border-border p-2.5" ref={userMenuRef}>
          {isUserMenuOpen && !isCollapsed && userMenuPosition ? (
            <div
              className="fixed z-[200] overflow-hidden rounded-xl border border-border bg-card py-2 shadow-overlay ring-1 ring-black/[0.04]"
              style={{
                left: userMenuPosition.left,
                width: userMenuPosition.width,
                bottom: userMenuPosition.bottom,
              }}
            >
              <div className="border-b border-border px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {userName || 'Your account'}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
              </div>

              <div className="px-2 py-1">
                <ThemePillToggle value={preference} onChange={setPreference} compact className="px-1 py-2" />
              </div>

              <div className="border-t border-border px-1 py-1">
                <Link
                  href="/dashboard/account"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    closeMobile();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <Settings className="h-[14px] w-[14px]" strokeWidth={1.8} />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setShowSignOutModal(true);
                  }}
                  disabled={isSigningOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <LogOut className="h-[14px] w-[14px]" strokeWidth={1.8} />
                  Log out
                </button>
              </div>

              <div className="hidden border-t border-border px-1 py-1 lg:block">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    toggleCollapsed();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <ChevronsLeft className="h-[14px] w-[14px]" strokeWidth={1.8} />
                  Collapse sidebar
                </button>
              </div>
            </div>
          ) : null}
          <button
            ref={userMenuTriggerRef}
            type="button"
            onClick={() => (isCollapsed ? toggleCollapsed() : setIsUserMenuOpen((v) => !v))}
            className={clsx(
              'flex w-full items-center rounded-[7px] transition-colors hover:bg-muted/60',
              isCollapsed ? 'justify-center py-2' : 'gap-[9px] px-1.5 py-1.5',
              isUserMenuOpen && !isCollapsed && 'bg-muted/60',
            )}
          >
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
              {initials}
            </span>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[12px] font-medium leading-tight text-foreground">
                    {userName || 'Your account'}
                  </p>
                  <p className="truncate text-[10.5px] leading-tight text-muted-foreground">{userEmail}</p>
                </div>
                <ChevronDown className="h-[13px] w-[13px] shrink-0 text-muted-foreground" strokeWidth={2} />
              </>
            )}
          </button>
          {isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="mt-1 hidden w-full items-center justify-center rounded-md py-[7px] text-muted-foreground hover:bg-muted/60 hover:text-foreground lg:flex"
              title="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showSignOutModal}
        onClose={() => !isSigningOut && setShowSignOutModal(false)}
        title="Sign out?"
        size="sm"
      >
        <p className="mb-6 text-sm text-muted-foreground">
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
