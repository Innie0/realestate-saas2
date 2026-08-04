'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import { Marquee } from '@/components/ui/marquee';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import { getCategoryLabel, getIntegrationsFlat, type Integration } from '@/lib/integrations';
import { SITE_NAME } from '@/lib/site-config';

function IntegrationCard({ integration, className }: { integration: Integration; className?: string }) {
  return (
    <Link
      href={`/integrations/${integration.slug}`}
      className={clsx(
        'group flex w-[280px] shrink-0 flex-col gap-4 rounded-mkt-card border border-mkt-border bg-mkt-surface p-6 shadow-[0_1px_2px_rgba(28,29,34,0.03),0_6px_16px_-12px_rgba(28,29,34,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0668E1]/40 hover:shadow-[var(--mkt-shadow-soft)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-mkt-border bg-mkt-surface-muted">
          <IntegrationLogo id={integration.logo} className="h-7 w-7" />
        </span>
        <span className="mt-1 inline-flex items-center rounded-full bg-mkt-surface-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mkt-secondary">
          {getCategoryLabel(integration.category)}
        </span>
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-mkt-foreground">
          {integration.name}
        </h3>
        <p className="mt-1.5 text-sm leading-[1.55] text-mkt-secondary">{integration.summary}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-mkt-accent opacity-0 transition-opacity group-hover:opacity-100">
        Learn more
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function IntegrationsPageClient() {
  return (
    <div className="marketing-root min-h-screen bg-white text-mkt-foreground">
      <MarketingSubpageHeader background="white" ctaColor="blue" />

      <main>
        <section className="relative overflow-hidden bg-white pb-8 pt-16 lg:pb-10 lg:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-24 h-[560px] w-[920px] -translate-x-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(6,104,225,0.22) 0%, rgba(6,104,225,0) 70%)',
              filter: 'blur(110px)',
            }}
          />
          <div className="relative z-[1] mx-auto max-w-mkt-content px-5 sm:px-8">
            <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
              <p
                data-reveal
                className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]"
              >
                INTEGRATIONS
              </p>
              <h1
                data-reveal
                className="font-display mt-4 text-4xl font-extrabold tracking-[-0.03em] text-mkt-foreground sm:text-5xl"
              >
                Works with the tools you already use
              </h1>
              <p data-reveal className="mt-5 text-lg leading-[1.6] text-mkt-secondary">
                {SITE_NAME} connects to your calendar, your ad accounts, and your lead sources —
                so nothing you rely on today has to change.
              </p>
            </LandingStaggerReveal>
          </div>
        </section>

        <section className="relative bg-white pb-16 pt-4 lg:pb-20 lg:pt-6">
          <Marquee pauseOnHover className="[--duration:34s] [--gap:1rem] py-2">
            {getIntegrationsFlat().map((integration) => (
              <IntegrationCard key={integration.slug} integration={integration} />
            ))}
          </Marquee>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent sm:w-32"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent sm:w-32"
          />
        </section>

        <section className="bg-mkt-surface-muted py-16 lg:py-20">
          <div className="mx-auto max-w-mkt-content px-5 text-center sm:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-mkt-foreground sm:text-4xl">
              Don&apos;t see what you need?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-[1.6] text-mkt-secondary">
              Tell us what you&apos;d like {SITE_NAME} to connect to next.
            </p>
            <div className="mt-7">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 rounded-mkt-button bg-[#0668E1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0450b0]">
                  Request an integration
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingSubpageFooter background="white" />
    </div>
  );
}
