'use client';

import Link from 'next/link';
import { SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import LandingGradientPanel, { type LandingGradientVariant } from '@/components/home/LandingGradientPanel';
import MarketingButton from '@/components/marketing/MarketingButton';
import ProductScreenshot from '@/components/home/ProductScreenshot';

const GRADIENT_VARIANTS: LandingGradientVariant[] = [
  'feature',
  'feature-alt',
  'feature-warm',
  'feature',
];

export default function LandingFeatureStack() {
  return (
    <div aria-label="Product features" className="bg-mkt-background">
      {SHOWCASE_SLIDES.map((slide, index) => (
        <section key={slide.id} className="py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
            <LandingStaggerReveal className="mx-auto max-w-3xl text-center">
              <p
                data-reveal
                className="text-xs font-semibold uppercase tracking-[0.14em] text-mkt-accent"
              >
                {slide.eyebrow}
              </p>
              <h2
                data-reveal
                className="font-display mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-mkt-foreground"
              >
                {slide.headline}
              </h2>
              <p
                data-reveal
                className="mx-auto mt-5 max-w-2xl text-base leading-[1.65] text-mkt-secondary sm:text-[17px]"
              >
                {slide.description}
              </p>
              <div data-reveal className="mt-8 flex flex-col items-center gap-3">
                <MarketingButton href="/auth/signup" variant="dark" size="lg">
                  Start free trial
                </MarketingButton>
                <Link
                  href={slide.productsHref}
                  className="text-sm font-medium text-mkt-secondary transition-colors hover:text-mkt-foreground"
                >
                  Learn more →
                </Link>
              </div>
            </LandingStaggerReveal>

            <LandingStaggerReveal className="mt-12 sm:mt-16 lg:mt-20">
              <div data-reveal data-reveal-fade>
                <LandingGradientPanel
                  variant={GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length]}
                  showcase
                >
                  <div className="mx-auto w-full max-w-[640px] sm:max-w-[680px] lg:max-w-[720px]">
                    <ProductScreenshot
                      src={slide.screenshot}
                      alt={slide.screenshotAlt}
                      size="showcase"
                    />
                  </div>
                </LandingGradientPanel>
              </div>
            </LandingStaggerReveal>
          </div>
        </section>
      ))}
    </div>
  );
}
