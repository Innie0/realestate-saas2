'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CinematicHeroSection from '@/components/home/CinematicHeroSection';
import LandingNav from '@/components/home/LandingNav';
import LandingShowcaseCarousel from '@/components/home/LandingShowcaseCarousel';
import LandingPersonaSection from '@/components/home/LandingPersonaSection';
import LandingTrustSection from '@/components/home/LandingTrustSection';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronDown, Star, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  STARTER_PLAN_DESCRIPTION,
  PRO_PLAN_DESCRIPTION,
  PRO_CARD_HIGHLIGHTS,
  getPlanDisplayPrice,
  getPricingFootnote,
  isAnyAnnualBillingAvailable,
} from '@/lib/pricing';
import { MARKETING_FAQ_ITEMS } from '@/lib/marketing-faq';

const STARTER_TEASER = [
  '20 listing projects & research lookups / mo',
  'Leads inbox, CRM & lead capture',
  'Calendar, tasks & transaction checklists',
] as const;

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({
  question,
  answer,
  delay = 0,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  delay?: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="border border-gray-200 rounded-2xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-900 font-medium">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-gray-700 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-700 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {MARKETING_FAQ_ITEMS.map((item, index) => (
        <FAQItem
          key={item.question}
          question={item.question}
          answer={item.answer}
          delay={index * 0.05}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePageClient() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const darkBandRef = useRef<HTMLElement>(null);

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
    <div className="marketing-root min-h-screen bg-[#F5F5F5] text-gray-900 overflow-x-hidden font-sans">

      <LandingNav heroRef={heroRef} darkBandRef={darkBandRef} />

      <CinematicHeroSection sectionRef={heroRef} />

      <LandingShowcaseCarousel />
      <LandingPersonaSection />
      <LandingTrustSection ref={darkBandRef} />

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-[#F5F5F5] py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
            <p className="text-gray-700 text-lg">Everything you need to know about Oikaro.</p>
          </motion.div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── Pricing teaser ─────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-600 mb-6">
              <Star className="w-4 h-4 text-brand-500" />
              7-Day Free Trial on Every Plan
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-700 text-lg">Start free. No credit card setup fees. Cancel anytime.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-6 max-w-3xl mx-auto">
            {[
              {
                name: 'Starter',
                price: getPlanDisplayPrice('starter', 'monthly'),
                description: STARTER_PLAN_DESCRIPTION,
                plan: 'starter' as const,
                popular: false,
                highlights: STARTER_TEASER,
              },
              {
                name: 'Pro',
                price: getPlanDisplayPrice('pro', 'monthly'),
                description: PRO_PLAN_DESCRIPTION,
                plan: 'pro' as const,
                popular: true,
                highlights: PRO_CARD_HIGHLIGHTS,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`relative rounded-2xl p-7 ${
                  plan.popular
                    ? 'bg-white border-2 border-gray-400'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-700 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-price text-4xl">{plan.price}</span>
                    <span className="text-gray-700 text-sm">/ mo after trial</span>
                  </div>
                  {isAnyAnnualBillingAvailable() && (
                    <p className="text-xs text-gray-700 mt-2">
                      or {getPlanDisplayPrice(plan.plan, 'annual')}/year — save 2 months
                    </p>
                  )}
                </div>

                <ul className="mb-7 space-y-2.5">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" strokeWidth={2.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signup">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                        : 'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Start Free Trial
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex flex-col items-center gap-4 text-center"
          >
            <Link href="/pricing#compare" className="text-sm font-medium text-gray-900 hover:text-brand-600 transition-colors">
              Compare all features →
            </Link>
            <p className="text-gray-600 text-sm">{getPricingFootnote()}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200 bg-[#F5F5F5]/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="flex flex-col items-center text-center">
            <Link
              href="/"
              className="font-mono text-5xl font-semibold tracking-[-0.04em] text-gray-900 transition-opacity hover:opacity-80 sm:text-6xl lg:text-7xl"
            >
              Oikaro
            </Link>

            <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-700">
              <Link href="/products" className="hover:text-brand-600 transition-colors">Products</Link>
              <Link href="/pricing" className="hover:text-brand-600 transition-colors">Pricing</Link>
              <Link href="/about" className="hover:text-brand-600 transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-brand-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-600 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-brand-600 transition-colors">Contact</Link>
            </nav>

            <div className="mt-10 flex w-full flex-col items-center gap-3 border-t border-gray-200 pt-8 md:flex-row md:justify-between">
              <p className="text-sm text-gray-700">© 2026 Oikaro. All rights reserved.</p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Start your free trial
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
