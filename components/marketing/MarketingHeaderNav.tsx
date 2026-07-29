'use client';

import Link from 'next/link';
import clsx from 'clsx';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';

const NAV_LINK_CLASS =
  'inline-flex items-center px-3 py-2 text-sm font-medium text-mkt-secondary transition-colors duration-200 hover:text-mkt-foreground';

type MarketingHeaderNavProps = {
  onProductsMenuChange?: (open: boolean) => void;
  inverted?: boolean;
};

export default function MarketingHeaderNav({
  onProductsMenuChange,
  inverted = false,
}: MarketingHeaderNavProps) {
  const navLinkClass = inverted
    ? 'inline-flex items-center px-3 py-2 text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white'
    : NAV_LINK_CLASS;

  return (
    <>
      <Link
        href="/"
        className={clsx(
          'shrink-0 text-[15px] font-bold tracking-[-0.02em] transition-opacity duration-200 hover:opacity-70',
          inverted ? 'text-white' : 'text-mkt-foreground',
        )}
      >
        Oikaro
      </Link>

      <nav
        aria-label="Primary"
        className="hidden items-center gap-0.5 md:flex lg:gap-1 lg:pl-8 xl:pl-10"
      >
        <ProductsMegaMenu inverted={inverted} onOpenChange={onProductsMenuChange} />
        <Link href="/pricing" className={navLinkClass}>
          Pricing
        </Link>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/auth/login" className={`${navLinkClass} hidden sm:inline-flex`}>
          Sign in
        </Link>
        <MarketingShimmerCta href="/auth/signup" inverted={inverted}>
          Start free trial
        </MarketingShimmerCta>
      </div>
    </>
  );
}
