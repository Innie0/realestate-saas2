'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import ProductScreenshot from '@/components/home/ProductScreenshot';

const TAG_CLASSES = [
  'bg-mkt-tag-green-bg text-mkt-tag-green-text',
  'bg-mkt-tag-blue-bg text-mkt-tag-blue-text',
  'bg-mkt-tag-amber-bg text-mkt-tag-amber-text',
] as const;

export default function LandingFeatureSections() {
  return (
    <section aria-label="Product features" className="bg-mkt-background">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <LandingStaggerReveal className="border-t border-mkt-border py-24 sm:py-28 lg:py-32">
          <p
            data-reveal
            className="text-xs font-medium uppercase tracking-[0.14em] text-mkt-secondary"
          >
            Platform
          </p>
          <h2
            data-reveal
            className="font-display mt-4 max-w-2xl text-3xl font-medium leading-[1.12] tracking-[-0.03em] text-mkt-foreground sm:text-4xl lg:text-[2.75rem]"
          >
            Everything your business needs, without the clutter
          </h2>
          <p data-reveal className="mt-5 max-w-xl text-base leading-[1.65] text-mkt-secondary">
            One product for listings, leads, clients, and closings — designed so agents can trust
            what they see and act on it quickly.
          </p>
        </LandingStaggerReveal>

        <div className="flex flex-col">
          {SHOWCASE_SLIDES.map((feature, index) => {
            const reversed = index % 2 === 1;

            return (
              <LandingStaggerReveal
                key={feature.id}
                as="article"
                className="grid gap-12 border-t border-mkt-border py-24 sm:gap-16 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-32"
              >
                <div className={clsx(reversed && 'lg:order-2')}>
                  <span
                    data-reveal
                    className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${TAG_CLASSES[index % 3]}`}
                  >
                    {feature.eyebrow}
                  </span>
                  <h3
                    data-reveal
                    className="font-display mt-5 text-2xl font-medium leading-[1.15] tracking-[-0.03em] text-mkt-foreground sm:text-3xl lg:text-[2.125rem]"
                  >
                    {feature.headline}
                  </h3>
                  <p
                    data-reveal
                    className="mt-5 max-w-md text-base leading-[1.65] text-mkt-secondary"
                  >
                    {feature.description}
                  </p>
                  <div data-reveal className="mt-8 flex flex-wrap items-center gap-4">
                    <MarketingButton href="/auth/signup" variant="primary">
                      Start your 7-day free trial
                    </MarketingButton>
                    <Link
                      href={feature.productsHref}
                      className="text-sm font-medium text-mkt-foreground transition-opacity hover:opacity-70"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>

                <div data-reveal className={clsx(reversed && 'lg:order-1')}>
                  <ProductScreenshot
                    src={feature.screenshot}
                    alt={feature.screenshotAlt}
                    href={feature.productsHref}
                  />
                </div>
              </LandingStaggerReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
