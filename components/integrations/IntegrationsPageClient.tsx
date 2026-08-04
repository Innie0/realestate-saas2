'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import { INTEGRATIONS } from '@/lib/integrations';
import { SITE_NAME } from '@/lib/site-config';

export default function IntegrationsPageClient() {
  return (
    <div className="marketing-root min-h-screen bg-mkt-background font-sans text-mkt-foreground">
      <MarketingSubpageHeader />

      <main>
        <section className="border-b border-mkt-border bg-mkt-background py-16 lg:py-24">
          <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
            <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
              <p
                data-reveal
                className="text-xs font-medium uppercase tracking-[0.12em] text-mkt-accent"
              >
                Integrations
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

        <section className="bg-mkt-background py-16 lg:py-20">
          <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
            <LandingStaggerReveal
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              stagger={0.05}
            >
              {INTEGRATIONS.map((integration) => (
                <Link
                  key={integration.slug}
                  data-reveal
                  href={`/integrations/${integration.slug}`}
                  className="group flex flex-col gap-4 rounded-mkt-card border border-mkt-border bg-mkt-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-mkt-accent/40 hover:shadow-[var(--mkt-shadow-soft)]"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-mkt-border bg-mkt-surface-muted">
                    <IntegrationLogo id={integration.logo} className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.01em] text-mkt-foreground">
                      {integration.name}
                    </h2>
                    <p className="mt-1.5 text-sm leading-[1.55] text-mkt-secondary">
                      {integration.summary}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-mkt-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </LandingStaggerReveal>
          </div>
        </section>

        <section className="border-t border-mkt-border bg-mkt-background py-16 lg:py-20">
          <div className="mx-auto max-w-mkt-content px-5 text-center sm:px-8">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-mkt-foreground sm:text-3xl">
              Don&apos;t see what you need?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-[1.6] text-mkt-secondary">
              Tell us what you&apos;d like {SITE_NAME} to connect to next.
            </p>
            <div className="mt-7">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 rounded-mkt-button bg-mkt-accent px-6 py-3 text-sm font-medium text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover">
                  Request an integration
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingSubpageFooter />
    </div>
  );
}
