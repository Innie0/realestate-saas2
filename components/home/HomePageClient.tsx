'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LandingNav from '@/components/home/LandingNav';
import LandingHeroAttio from '@/components/home/LandingHeroAttio';
import LandingShowcaseCarousel from '@/components/home/LandingShowcaseCarousel';
import LandingStackReplaceSection from '@/components/home/LandingStackReplaceSection';
import LandingTrustSection from '@/components/home/LandingTrustSection';
import LandingFAQSection from '@/components/home/LandingFAQSection';
import LandingCTABand from '@/components/home/LandingCTABand';
import LandingFooter from '@/components/home/LandingFooter';
import { supabase } from '@/lib/supabase';

export default function HomePageClient() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const isAdmin = session.user.email === 'callon786@outlook.com';
          if (isAdmin) { router.push('/dashboard'); return; }

          const { data: userData } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', session.user.id)
            .single();

          const hasActiveSubscription =
            userData?.subscription_status === 'active' ||
            userData?.subscription_status === 'trialing';

          if (hasActiveSubscription) router.push('/dashboard');
        }
      } catch {}
    };
    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="marketing-root relative z-[1] min-h-screen overflow-x-hidden bg-mkt-background text-mkt-foreground">
      <LandingNav />
      <LandingHeroAttio sectionRef={heroRef} />
      <LandingShowcaseCarousel />
      <LandingStackReplaceSection />
      <LandingTrustSection />
      <LandingFAQSection />
      <LandingCTABand />
      <LandingFooter />
    </div>
  );
}
