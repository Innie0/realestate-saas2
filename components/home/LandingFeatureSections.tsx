'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import { MKT } from '@/lib/marketing-design';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import ProductScreenshot from '@/components/home/ProductScreenshot';

export default function LandingFeatureSections() {
  return (
    <section aria-label="Product features" style={{ backgroundColor: MKT.background }}>
      <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <LandingStaggerReveal
          className="border-t py-24 sm:py-28 lg:py-32"
          style={{ borderColor: MKT.border }}
        >
          <p
            data-reveal
            className="text-xs font-medium uppercase tracking-[0.14em]"
            style={{ color: MKT.textSecondary }}
          >
            Platform
          </p>
          <h2
            data-reveal
            className="font-display mt-4 max-w-2xl text-3xl font-medium leading-[1.12] tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]"
            style={{ color: MKT.textPrimary }}
          >
            Everything your business needs, without the clutter
          </h2>
          <p
            data-reveal
            className="mt-5 max-w-xl text-base leading-[1.65]"
            style={{ color: MKT.textSecondary }}
          >
            One product for listings, leads, clients, and closings — designed so agents can trust
            what they see and act on it quickly.
          </p>
        </LandingStaggerReveal>

        <div className="flex flex-col">
          {SHOWCASE_SLIDES.map((feature, index) => {
            const reversed = index % 2 === 1;
            const tagStyle =
              index % 3 === 0
                ? MKT.tag.green
                : index % 3 === 1
                  ? MKT.tag.blue
                  : MKT.tag.amber;

            return (
              <LandingStaggerReveal
                key={feature.id}
                as="article"
                className={clsx(
                  'grid gap-12 border-t py-24 sm:gap-16 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-32',
                )}
                style={{ borderColor: MKT.border }}
              >
                <div className={clsx(reversed && 'lg:order-2')}>
                  <span
                    data-reveal
                    className="inline-block px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]"
                    style={{
                      borderRadius: 9999,
                      backgroundColor: tagStyle.bg,
                      color: tagStyle.text,
                    }}
                  >
                    {feature.eyebrow}
                  </span>
                  <h3
                    data-reveal
                    className="font-display mt-5 text-2xl font-medium leading-[1.15] tracking-[-0.03em] sm:text-3xl lg:text-[2.125rem]"
                    style={{ color: MKT.textPrimary }}
                  >
                    {feature.headline}
                  </h3>
                  <p
                    data-reveal
                    className="mt-5 max-w-md text-base leading-[1.65]"
                    style={{ color: MKT.textSecondary }}
                  >
                    {feature.description}
                  </p>
                  <div data-reveal className="mt-8 flex flex-wrap items-center gap-4">
                    <MarketingButton href="/auth/signup" variant="primary">
                      Start your 7-day free trial
                    </MarketingButton>
                    <Link
                      href={feature.productsHref}
                      className="text-sm font-medium transition-opacity hover:opacity-70"
                      style={{ color: MKT.textPrimary }}
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
