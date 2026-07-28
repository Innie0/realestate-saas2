'use client';

import Link from 'next/link';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';

const NAV_LINK_CLASS =
  'inline-flex items-center px-3 py-2 text-sm font-medium text-mkt-secondary transition-colors duration-200 hover:text-mkt-foreground';

type MarketingHeaderNavProps = {
  onProductsMenuChange?: (open: boolean) => void;
};

export default function MarketingHeaderNav({ onProductsMenuChange }: MarketingHeaderNavProps) {
  return (
    <>
      <Link
        href="/"
        className="shrink-0 text-[15px] font-semibold tracking-[-0.02em] text-mkt-foreground transition-opacity duration-200 hover:opacity-70"
      >
        Oikaro
      </Link>

      <nav
        aria-label="Primary"
        className="hidden items-center gap-0.5 md:flex lg:gap-1 lg:pl-8 xl:pl-10"
      >
        <ProductsMegaMenu onOpenChange={onProductsMenuChange} />
        <Link href="/pricing" className={NAV_LINK_CLASS}>
          Pricing
        </Link>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/auth/login" className={`${NAV_LINK_CLASS} hidden sm:inline-flex`}>
          Sign in
        </Link>
        <MarketingShimmerCta href="/auth/signup">Get Started</MarketingShimmerCta>
      </div>
    </>
  );
}
