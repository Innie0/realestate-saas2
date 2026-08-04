'use client';

import Link from 'next/link';
import clsx from 'clsx';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';
import { SITE_NAME } from '@/lib/site-config';

const NAV_LINK_CLASS =
  'inline-flex items-center px-3 py-2.5 text-[15px] font-medium text-mkt-secondary transition-colors duration-200 hover:text-mkt-foreground';

type MarketingHeaderNavProps = {
  onProductsMenuChange?: (open: boolean) => void;
  inverted?: boolean;
  /** Blue hero bar: mono wordmark, white sign-in pill, black trial CTA */
  heroFade?: boolean;
};

export default function MarketingHeaderNav({
  onProductsMenuChange,
  inverted = false,
  heroFade = false,
}: MarketingHeaderNavProps) {
  const navLinkClass = inverted
    ? 'inline-flex items-center px-3 py-2.5 text-[15px] font-medium text-white/75 transition-colors duration-200 hover:text-white'
    : NAV_LINK_CLASS;

  return (
    <>
      <Link
        href="/"
        className={clsx(
          'shrink-0 transition-opacity duration-200 hover:opacity-70',
          heroFade
            ? 'font-mkt-mono text-[21px] font-normal tracking-[-0.01em] text-white'
            : clsx(
                'text-[17px] font-bold tracking-[-0.02em]',
                inverted ? 'text-white' : 'text-mkt-foreground',
              ),
        )}
      >
        {SITE_NAME}
      </Link>

      <nav
        aria-label="Primary"
        className="hidden items-center gap-0.5 md:flex lg:gap-1 lg:pl-8 xl:pl-10"
      >
        <ProductsMegaMenu inverted={inverted} onOpenChange={onProductsMenuChange} />
        <Link href="/integrations" className={navLinkClass}>
          Integrations
        </Link>
        <Link href="/pricing" className={navLinkClass}>
          Pricing
        </Link>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3.5">
        {heroFade ? (
          <>
            <Link
              href="/auth/login"
              className="hidden h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#111111] transition-opacity hover:opacity-90 sm:inline-flex"
            >
              Sign in
              <span className="text-[#0668E1]" aria-hidden>
                →
              </span>
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex h-11 items-center rounded-full bg-[#0A0A0A] px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-[#262626]"
            >
              Start free trial
            </Link>
          </>
        ) : (
          <>
            <Link href="/auth/login" className={`${navLinkClass} hidden sm:inline-flex`}>
              Sign in
            </Link>
            <MarketingShimmerCta href="/auth/signup" inverted={inverted} size="lg">
              Start free trial
            </MarketingShimmerCta>
          </>
        )}
      </div>
    </>
  );
}
