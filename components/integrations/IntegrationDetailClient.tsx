'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import type { Integration } from '@/lib/integrations';
import { SITE_NAME } from '@/lib/site-config';

type IntegrationDetailClientProps = {
  integration: Integration;
};

export default function IntegrationDetailClient({ integration }: IntegrationDetailClientProps) {
  return (
    <div className="marketing-root min-h-screen bg-white font-sans text-mkt-foreground">
      <MarketingSubpageHeader background="white" />

      <main>
        <section className="border-b border-mkt-border bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
            <Link
              href="/integrations"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-mkt-secondary transition-colors hover:text-mkt-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All integrations
            </Link>

            <div className="mx-auto mt-8 max-w-2xl text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-mkt-border bg-mkt-surface">
                <IntegrationLogo id={integration.logo} className="h-7 w-7" />
              </span>
              <h1 className="font-display mt-6 text-4xl font-extrabold tracking-[-0.03em] text-mkt-foreground sm:text-5xl">
                {integration.name}
              </h1>
              <p className="mt-5 text-lg leading-[1.6] text-mkt-secondary">
                {integration.description}
              </p>
              <div className="mt-8">
                <Link href="/auth/signup">
                  <span className="inline-flex items-center gap-2 rounded-mkt-button bg-mkt-accent px-6 py-3 text-sm font-medium text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover">
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-mkt-content px-5 text-center sm:px-8">
            <p className="text-sm leading-[1.6] text-mkt-secondary">
              Have a question about connecting {integration.name} to {SITE_NAME}?{' '}
              <Link href="/contact" className="font-medium text-mkt-accent hover:opacity-70">
                Reach out
              </Link>{' '}
              and we&apos;ll help you get set up.
            </p>
          </div>
        </section>
      </main>

      <MarketingSubpageFooter background="white" />
    </div>
  );
}
