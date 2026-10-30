'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasAppAccess } from '@/lib/subscription';

/**
 * Who's looking at a public page — so buttons don't ask someone who already
 * signed up to sign up again.
 * - 'visitor': not signed in
 * - 'needs_plan': signed in, no trial or plan yet
 * - 'member': signed in with access
 */
export type MarketingAccountState = 'visitor' | 'needs_plan' | 'member';

export function useMarketingAccount(): MarketingAccountState {
  const [state, setState] = useState<MarketingAccountState>('visitor');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setState(hasAppAccess(data?.subscription_status, session.user.email) ? 'member' : 'needs_plan');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Where the main "Start free trial" button should go, and what it should say. */
export function marketingCta(state: MarketingAccountState): { href: string; label: string } {
  if (state === 'member') return { href: '/dashboard', label: 'Go to dashboard' };
  if (state === 'needs_plan') return { href: '/pricing#plans', label: 'Start free trial' };
  return { href: '/auth/signup', label: 'Start free trial' };
}
