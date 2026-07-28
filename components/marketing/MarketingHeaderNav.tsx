'use client';

import Link from 'next/link';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';
import MarketingButton from '@/components/marketing/MarketingButton';

const NAV_LINK_CLASS =
  'inline-flex items-center px-3 py-2 text-sm font-medium text-mkt-secondary transition-opacity hover:opacity-70';

type MarketingHeaderNavProps = {
  onProductsMenuChange?: (open: boolean) => void;
};

/** Instantly-style header zones: logo | nav links | sign-in + CTAs */
export default function MarketingHeaderNav({ onProductsMenuChange }: MarketingHeaderNavProps) {
  return (
    <>
      <Link
        href="/"
        className="shrink-0 text-[1.05rem] font-semibold tracking-[-0.02em] text-mkt-foreground transition-opacity hover:opacity-70 sm:text-lg"
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
        <MarketingButton href="/products" variant="secondary" size="md" className="hidden md:inline-flex">
          See demo
        </MarketingButton>
        <MarketingButton href="/auth/signup" variant="dark" size="md">
          Start free trial
        </MarketingButton>
      </div>
    </>
  );
}
