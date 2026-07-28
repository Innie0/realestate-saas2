'use client';

import Link from 'next/link';
import { SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import LandingGradientPanel, { type LandingGradientVariant } from '@/components/home/LandingGradientPanel';
import MarketingButton from '@/components/marketing/MarketingButton';
import ProductScreenshot from '@/components/home/ProductScreenshot';

const GRADIENT_VARIANTS: LandingGradientVariant[] = [
  'feature',
  'feature-violet',
  'feature-teal',
  'feature-plum',
];

export default function LandingFeatureStack() {
  return (
    <div aria-label="Product features" className="bg-mkt-background">
      {SHOWCASE_SLIDES.map((slide, index) => (
        <section key={slide.id} className="py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mkt-accent">
                {slide.eyebrow}
              </p>
              <h2 className="font-display mt-3 text-[clamp(1.65rem,3.2vw,2.25rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-mkt-foreground">
                {slide.headline}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-[1.6] text-mkt-secondary sm:text-[15px]">
                {slide.description}
              </p>
              <div className="mt-6 flex flex-col items-center gap-2.5">
                <MarketingButton href="/auth/signup" variant="dark" size="md">
                  Start free trial
                </MarketingButton>
                <Link
                  href={slide.productsHref}
                  className="text-xs font-medium text-mkt-secondary transition-colors hover:text-mkt-foreground sm:text-sm"
                >
                  Learn more →
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-6xl sm:mt-10 lg:mt-12">
              <LandingGradientPanel
                variant={GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length]}
                mesh="static"
                showcase
                elevated={false}
                innerClassName="!py-4 !px-4 sm:!py-5 sm:!px-6 lg:!py-6 lg:!px-8"
              >
                <div className="w-full">
                  <ProductScreenshot
                    src={slide.screenshot}
                    alt={slide.screenshotAlt}
                    size="showcase"
                  />
                </div>
              </LandingGradientPanel>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
