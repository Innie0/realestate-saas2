'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap, X, Loader2 } from 'lucide-react';
import SubscribeButton from '@/components/SubscribeButton';
import Button from '@/components/ui/Button';
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

  // Check authentication status on mount
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
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const plans = [
    {
      name: 'Starter',
      price: '$14.99',
      period: 'per month',
      description: 'Perfect for getting started with your real estate business',
      priceId: 'price_starter_id_here', // Replace with your actual Stripe Price ID
      features: [
        'Up to 10 property listings per month',
        'AI-powered descriptions',
        'Image analysis',
        'Basic client management',
        'Calendar integration',
        'Email support',
      ],
      notIncluded: [
        'Unlimited listings',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
      ],
      popular: false,
      color: 'blue',
    },
    {
      name: 'Pro',
      price: '$39.99',
      period: 'per month',
      description: 'Everything you need to scale your real estate business',
      priceId: 'price_pro_id_here', // Replace with your actual Stripe Price ID
      features: [
        'Unlimited property listings',
        'AI-powered descriptions with multiple tones',
        'Advanced image analysis',
        'Full client & transaction management',
        'Calendar integration (Google + Outlook)',
        'Advanced task automation',
        'Transaction checklists & reminders',
        'Priority support',
        'Custom branding',
        'Advanced analytics',
      ],
      notIncluded: [],
      popular: true,
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="block">
            <Image
              src="/logo.png"
              alt="Realestic"
              width={240}
              height={72}
              priority
              className="h-14 w-auto"
            />
          </Link>
          
          {/* User status indicator */}
          {!isLoading && (
            <div className="text-sm">
              {isAuthenticated ? (
                <span className="text-green-400">✓ Logged in as {userEmail}</span>
              ) : (
                <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300">
                  Sign in to subscribe
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="container mx-auto px-4 py-32 text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading plans...</p>
        </div>
      )}

      {/* Pricing Section */}
      {!isLoading && (
        <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-3">
            Select the perfect plan to streamline your real estate workflow and save time on every listing
          </p>
          <p className="text-lg text-green-400 font-semibold">
            ✨ Start with a 7-day free trial on any plan
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-purple-500 bg-gradient-to-br from-purple-900/20 to-gray-900/50 shadow-2xl shadow-purple-500/20'
                  : 'border-gray-700 bg-gray-900/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-green-400 font-medium">
                  7-day free trial included
                </p>
              </div>

              {/* Subscribe Button */}
              <div className="mb-6">
                <SubscribeButton
                  priceId={plan.priceId}
                  planName={plan.name}
                  className="w-full"
                />
              </div>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  What's Included:
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
                
                {/* Not Included (only for Starter) */}
                {plan.notIncluded.length > 0 && (
                  <>
                    <div className="pt-4 mt-4 border-t border-gray-700">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Not Included:
                      </p>
                      {plan.notIncluded.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-500 line-through">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Not Authenticated Warning */}
        {!isAuthenticated && (
          <div className="max-w-2xl mx-auto mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-yellow-400 mb-3">
              ⚠️ You need to be logged in to subscribe
            </p>
            <Button
              onClick={() => router.push('/auth/signup')}
              variant="outline"
            >
              Sign up to get started
            </Button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
