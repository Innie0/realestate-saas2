'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingNav from '@/components/home/LandingNav';
import LandingHeroFade from '@/components/home/LandingHeroFade';
import LandingWhySwitcher from '@/components/home/LandingWhySwitcher';
import LandingFeatureCards from '@/components/home/LandingFeatureCards';
import LandingTestimonials from '@/components/home/LandingTestimonials';
import LandingFAQSection from '@/components/home/LandingFAQSection';
import LandingCTABand from '@/components/home/LandingCTABand';
import LandingFooter from '@/components/home/LandingFooter';
import { supabase } from '@/lib/supabase';

export default function HomePageClient() {
  const router = useRouter();

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
    <div className="marketing-root relative z-[1] min-h-screen overflow-x-hidden bg-white text-mkt-foreground">
      <LandingNav />
      <LandingHeroFade />
      <LandingWhySwitcher />
      <LandingFeatureCards />
      <LandingTestimonials />
      <LandingFAQSection />
      <LandingCTABand />
      <LandingFooter />
    </div>
  );
}
