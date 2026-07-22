'use client';

import Link from 'next/link';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import MarketingPageHeader from '@/components/marketing/MarketingPageHeader';
import { SUPPORT_EMAIL } from '@/lib/support-email';
import { MKT } from '@/lib/marketing-design';

const BELIEFS = [
  {
    title: 'Agents first',
    body: 'Built for individual agents and small teams — not enterprise brokerages with a six-month rollout.',
  },
  {
    title: 'Simple beats flashy',
    body: 'Capture a lead, run a CMA, or draft a listing without sitting through a tutorial first.',
  },
  {
    title: 'Honest pricing',
    body: 'Clear plans, no surprise fees. Cancel anytime from your account.',
  },
  {
    title: 'Real support',
    body: 'When something is off, you talk to a person — not a ticket black hole.',
  },
];

export default function AboutPageClient() {
  return (
    <div className="marketing-root min-h-screen" style={{ backgroundColor: MKT.background }}>
      <MarketingPageHeader />

      <main>
        <section className="border-b py-20 sm:py-28" style={{ borderColor: MKT.border }}>
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <LandingStaggerReveal>
              <p
                data-reveal
                className="text-xs font-medium uppercase tracking-[0.14em]"
                style={{ color: MKT.textSecondary }}
              >
                About Oikaro
              </p>
              <h1
                data-reveal
                className="font-display mt-4 text-4xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-5xl"
                style={{ color: MKT.textPrimary }}
              >
                Software that respects how agents actually work
              </h1>
              <p data-reveal className="mt-6 text-lg leading-[1.65]" style={{ color: MKT.textSecondary }}>
                I&apos;m Ali Ali. I built Oikaro because real estate agents deserve tools that fit
                their day — not another bloated CRM that takes weeks to learn and still misses the
                basics.
              </p>
            </LandingStaggerReveal>
          </div>
        </section>

        <section className="py-20 sm:py-24" style={{ backgroundColor: MKT.surfaceMuted }}>
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <LandingStaggerReveal>
              <p
                data-reveal
                className="font-display text-2xl font-medium leading-[1.35] tracking-[-0.03em] sm:text-3xl"
                style={{ color: MKT.textPrimary }}
              >
                Listing prep, lead follow-up, open houses, CMAs — your week is already full.
                Oikaro takes the repetitive work off your plate so you can spend more time with
                clients.
              </p>
            </LandingStaggerReveal>
          </div>
        </section>

        <section className="border-t py-20 sm:py-28" style={{ borderColor: MKT.border }}>
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <LandingStaggerReveal className="mb-12">
              <h2
                data-reveal
                className="font-display text-2xl font-medium tracking-[-0.03em] sm:text-3xl"
                style={{ color: MKT.textPrimary }}
              >
                What we believe
              </h2>
            </LandingStaggerReveal>

            <LandingStaggerReveal
              className="grid gap-px overflow-hidden border sm:grid-cols-2"
              style={{ borderColor: MKT.border, backgroundColor: MKT.border }}
              stagger={0.06}
            >
              {BELIEFS.map((belief) => (
                <div
                  key={belief.title}
                  data-reveal
                  className="p-7 sm:p-8"
                  style={{ backgroundColor: MKT.surface }}
                >
                  <h3 className="text-[15px] font-medium" style={{ color: MKT.textPrimary }}>
                    {belief.title}
                  </h3>
                  <p className="mt-2 text-sm leading-[1.65]" style={{ color: MKT.textSecondary }}>
                    {belief.body}
                  </p>
                </div>
              ))}
            </LandingStaggerReveal>
          </div>
        </section>

        <section className="border-t py-20 sm:py-28" style={{ borderColor: MKT.border }}>
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <LandingStaggerReveal>
              <h2
                data-reveal
                className="font-display text-2xl font-medium tracking-[-0.03em]"
                style={{ color: MKT.textPrimary }}
              >
                How we work with you
              </h2>
              <p data-reveal className="mt-5 text-base leading-[1.65]" style={{ color: MKT.textSecondary }}>
                Oikaro is a young product, and I&apos;m building it in the open with feedback from
                working agents. If you have an idea, hit a bug, or just want to say hi — I read
                every message.
              </p>
              <p data-reveal className="mt-4 text-base leading-[1.65]" style={{ color: MKT.textSecondary }}>
                Email{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium transition-opacity hover:opacity-70"
                  style={{ color: MKT.textPrimary }}
                >
                  {SUPPORT_EMAIL}
                </a>{' '}
                or use our{' '}
                <Link
                  href="/contact"
                  className="font-medium transition-opacity hover:opacity-70"
                  style={{ color: MKT.textPrimary }}
                >
                  contact form
                </Link>
                . We typically reply within one business day.
              </p>
            </LandingStaggerReveal>
          </div>
        </section>

        <section style={{ backgroundColor: MKT.surfaceMuted }}>
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
            <LandingStaggerReveal className="text-center">
              <h2
                data-reveal
                className="font-display text-2xl font-medium tracking-[-0.03em] sm:text-3xl"
                style={{ color: MKT.textPrimary }}
              >
                Ready to try it?
              </h2>
              <p data-reveal className="mx-auto mt-4 max-w-md text-base leading-[1.65]" style={{ color: MKT.textSecondary }}>
                Start your 7-day free trial and see if Oikaro fits your workflow.
              </p>
              <div data-reveal className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <MarketingButton href="/auth/signup" size="lg">
                  Start your 7-day free trial
                </MarketingButton>
                <MarketingButton href="/pricing" variant="secondary" size="lg">
                  View pricing
                </MarketingButton>
              </div>
            </LandingStaggerReveal>
          </div>
        </section>
      </main>
    </div>
  );
}
