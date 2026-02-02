'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap, X } from 'lucide-react';
import SubscribeButton from '@/components/SubscribeButton';
import Button from '@/components/ui/Button';

/**
 * Pricing Page
 * Displays available subscription plans with Stripe checkout
 */
export default function PricingPage() {
  const router = useRouter();

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
        <div className="flex justify-center items-center">
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
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select the perfect plan to streamline your real estate workflow and save time on every listing
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
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
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

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400">
            All plans include a 14-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
