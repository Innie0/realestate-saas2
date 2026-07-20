'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CinematicHeroSection from '@/components/home/CinematicHeroSection';
import LandingNav from '@/components/home/LandingNav';
import LandingIntegrationsStrip from '@/components/home/LandingIntegrationsStrip';
import LandingShowcaseCarousel from '@/components/home/LandingShowcaseCarousel';
import LandingTrustSection from '@/components/home/LandingTrustSection';
import LandingFAQSection from '@/components/home/LandingFAQSection';
import LandingPricingSection from '@/components/home/LandingPricingSection';
import LandingFooter from '@/components/home/LandingFooter';
import { supabase } from '@/lib/supabase';
import { MKT } from '@/lib/marketing-design';

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
    <div
      className="marketing-root min-h-screen overflow-x-hidden font-sans"
      style={{ color: MKT.textPrimary, backgroundColor: MKT.background }}
    >
      <LandingNav heroRef={heroRef} />
      <CinematicHeroSection sectionRef={heroRef} />
      <LandingIntegrationsStrip />
      <LandingShowcaseCarousel />
      <LandingTrustSection />
      <LandingFAQSection />
      <LandingPricingSection />
      <LandingFooter />
    </div>
  );
}
