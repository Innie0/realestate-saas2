'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import SubscribeButton from '@/components/SubscribeButton';
import { supabase } from '@/lib/supabase';

/**
 * Pricing Page
 * Displays available subscription plans with Stripe checkout
 */
export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'Pricing - Realestic';
  }, []);

  // Check authentication and subscription status on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Pricing] Checking auth...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('[Pricing] Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: error?.message,
      });

      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
        
        // Check if user already has an active subscription
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();
        
        const hasActiveSubscription = 
          userData?.subscription_status === 'active' || 
          userData?.subscription_status === 'trialing';
        
        if (hasActiveSubscription) {
          console.log('[Pricing] User already has active subscription - redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Try Realestic at your own pace — no credit card required',
      priceId: null,
      features: [
        '3 AI Listing Projects per Month',
        '5 Property Lookups (lifetime)',
        '20 AI Assistant Messages per Month',
        'Up to 5 Clients',
        'Up to 3 Transactions',
        'Unlimited Calendar Events',
        'AI-Powered Descriptions',
        'Image Analysis',
      ],
      popular: false,
      cta: 'Get Started Free',
      ctaHref: '/auth/signup',
    },
    {
      name: 'Starter',
      price: '$14.99',
      period: 'per month',
      description: 'Perfect for active agents growing their business',
      priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1Sw9B7Enz9g2d62xiHw3wYn5',
      features: [
        '10 AI Listing Projects per Month',
        '10 Property Lookups per Month',
        '50 AI Assistant Messages per Month',
        'Up to 25 Clients',
        'Up to 10 Transactions',
        'Calendar Integration (50 Events)',
        'AI-Powered Descriptions',
        'Image Analysis',
        'Email Support',
      ],
      popular: false,
      cta: null,
      ctaHref: null,
    },
    {
      name: 'Pro',
      price: '$39.99',
      period: 'per month',
      description: 'Everything you need to scale your real estate business',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sw9MdEnz9g2d62xlyjilIoq',
      features: [
        'Unlimited Property Listings',
        'Unlimited Property Lookups',
        'Unlimited AI Assistant Messages',
        'Unlimited Clients & Transactions',
        'Unlimited Calendar Events',
        'AI-Powered Descriptions (3 Tones)',
        'Advanced Image Analysis',
        'Google Calendar Integration',
        'Transaction Checklists & Reminders',
        'Priority Support',
      ],
      popular: true,
      cta: null,
      ctaHref: null,
    },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="Realestic" width={160} height={48} priority className="h-10 w-auto" />
        </Link>
        {!isLoading && (
          <div className="text-sm">
            {isAuthenticated ? (
              <span className="text-gray-400 truncate max-w-[220px] block">✓ {userEmail}</span>
            ) : (
              <Link href="/auth/signup" className="text-gray-400 hover:text-white transition-colors">
                Sign in to subscribe →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
          {/* Page header */}
          <div className="text-center pt-12 pb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-gray-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Free plan available — no credit card needed
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Everything you need to run your real estate business, at a price that makes sense.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.popular
                    ? 'bg-[#111111] border-2 border-white/30'
                    : 'bg-[#111111] border border-white/10'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white text-black text-xs font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name & description */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mb-7">
                  {plan.ctaHref ? (
                    <Link
                      href={plan.ctaHref}
                      className="block w-full text-center py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <SubscribeButton priceId={plan.priceId!} planName={plan.name} className="w-full" />
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 mb-5" />

                {/* Features */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">What's included</p>
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Not authenticated */}
          {!isAuthenticated && (
            <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-2xl text-center">
              <p className="text-gray-400 text-sm mb-4">You need an account to subscribe</p>
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Create your account
              </button>
            </div>
          )}

          {/* Footer note */}
          <p className="text-center text-gray-600 text-sm mt-10">
            Free plan available forever · Paid plans cancel anytime · No hidden fees
          </p>
        </div>
      )}
    </div>
  );
}
