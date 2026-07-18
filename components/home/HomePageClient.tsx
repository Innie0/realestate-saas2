'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WordmarkLogo from '@/components/branding/WordmarkLogo';
import HeroAssistantPreview from '@/components/home/HeroAssistantPreview';
import LandingFeatureSections from '@/components/home/LandingFeatureSections';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronDown, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PricingFeatureList from '@/components/PricingFeatureList';
import {
  STARTER_PLAN_DESCRIPTION,
  PRO_PLAN_DESCRIPTION,
  getPlanDisplayPrice,
  getPricingFootnote,
  isAnyAnnualBillingAvailable,
} from '@/lib/pricing';
import { MARKETING_FAQ_ITEMS } from '@/lib/marketing-faq';

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

// ─── CountUp Component ────────────────────────────────────────────────────────

function CountUp({ end, suffix = '', duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

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
    <div className="marketing-root min-h-screen bg-[#F5F5F5] text-gray-900 overflow-hidden font-sans">


      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-50 border-b border-gray-200 backdrop-blur-md bg-[#F5F5F5]/20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 sm:h-24 items-center justify-between">
            <motion.div className="flex items-center shrink-0" whileHover={{ scale: 1.02 }}>
              <WordmarkLogo className="h-8 sm:h-10 w-auto object-contain" />
            </motion.div>
            <div className="flex-1" />
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/auth/login">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                  Sign In
                </motion.button>
              </Link>
              <Link href="/auth/signup">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(252,92,3,0.25)' }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
                  Get Started
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 overflow-x-clip pt-20 pb-24 lg:pt-32 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] gap-12 xl:gap-16 items-center"
          >
          <div className="relative z-10 max-w-xl lg:max-w-none">
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-600 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-brand-500" />
                AI-Powered Real Estate Platform
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl sm:text-5xl lg:text-7xl font-medium italic tracking-tight leading-[1.08] text-gray-900"
            >
              Work Smarter
              <br />
              Close Faster
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-6 sm:mt-8 text-base sm:text-lg text-gray-700 leading-relaxed max-w-xl">
              Transform your workflow as a real estate agent with intelligent tools designed for you.
              Manage leads, schedule showings, and close more deals with our AI-powered platform.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255,0.3)' }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto group px-8 py-4 text-base font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-900 border border-gray-400 rounded-xl backdrop-blur-sm transition-all">
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="hidden lg:block relative min-w-0 pl-4 xl:pl-8 -mr-6 xl:-mr-16 2xl:-mr-24 translate-x-6 xl:translate-x-10"
          >
            <HeroAssistantPreview />
          </motion.div>
        </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-gray-200 bg-gray-50 backdrop-blur-sm py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10, suffix: 'x', label: 'Faster Listing Descriptions' },
              { value: 5, suffix: '+', label: 'Hours Saved Per Week' },
              { value: 10, suffix: '+', label: 'More Leads' },
              { value: 100, suffix: '%', label: 'Built for Real Estate' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-4xl lg:text-5xl font-semibold tracking-[-0.02em] tabular-nums text-gray-900 mb-2">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-label text-center">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <LandingFeatureSections />

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
            <p className="text-gray-700 text-lg">Everything you need to know about Oikaro.</p>
          </motion.div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
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
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-700 text-lg">Start free. No credit card setup fees. Cancel anytime.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: 'Starter',
                price: getPlanDisplayPrice('starter', 'monthly'),
                description: STARTER_PLAN_DESCRIPTION,
                plan: 'starter' as const,
                popular: false,
              },
              {
                name: 'Pro',
                price: getPlanDisplayPrice('pro', 'monthly'),
                description: PRO_PLAN_DESCRIPTION,
                plan: 'pro' as const,
                popular: true,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`relative rounded-2xl p-7 flex flex-col ${
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

                <Link href="/pricing" className="mb-7">
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

                <div className="border-t border-gray-200 mb-5" />
                <p className="text-label mb-4">What&apos;s included</p>
                <PricingFeatureList plan={plan.plan} />
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-gray-600 text-sm mt-10"
          >
            {getPricingFootnote()}
          </motion.p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-600 mb-8">
              <Star className="w-4 h-4 text-brand-500" />
              7-Day Free Trial
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stop wasting time.<br />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">
                Start closing more deals.
              </span>
            </h2>
            <p className="text-gray-700 text-lg mb-10 max-w-2xl mx-auto">
              Built for real estate agents who want to save hours every week and win more listings.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(255,255,255,0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-10 py-4 text-lg font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-4 text-lg font-semibold text-gray-900 border border-gray-400 rounded-xl transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-700">No setup fees. Cancel anytime.</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200 bg-[#F5F5F5]/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-700 text-sm">© 2026 Oikaro. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-700">
              <Link href="/for-agents" className="hover:text-brand-600 transition-colors">For Agents</Link>
              <Link href="/agents" className="hover:text-brand-600 transition-colors">Find an Agent</Link>
              <Link href="/about" className="hover:text-brand-600 transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-brand-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-600 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-brand-600 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
