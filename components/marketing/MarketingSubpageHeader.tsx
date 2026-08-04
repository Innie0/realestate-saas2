'use client';

import { useState } from 'react';
import MarketingHeaderNav from '@/components/marketing/MarketingHeaderNav';

type MarketingSubpageHeaderProps = {
  /** 'default' is the marketing-root cream background; 'white' matches the landing page's white sections. */
  background?: 'default' | 'white';
  /** 'blue' uses the header brand blue for the trial CTA instead of the default black. */
  ctaColor?: 'default' | 'blue';
};

export default function MarketingSubpageHeader({
  background = 'default',
  ctaColor = 'default',
}: MarketingSubpageHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const bgClass = background === 'white' ? 'bg-white' : 'bg-mkt-background';

  return (
    <header
      className={`sticky top-0 z-[60] transition-[background-color,border-color,box-shadow] duration-300 ${
        menuOpen ? `border-b border-[rgba(17,17,17,0.14)] ${bgClass}` : `border-b border-mkt-border ${bgClass}`
      }`}
    >
      <div className="mx-auto flex h-16 max-w-mkt-content items-center px-5 sm:h-[4.5rem] sm:px-8">
        <MarketingHeaderNav onProductsMenuChange={setMenuOpen} ctaColor={ctaColor} />
      </div>
    </header>
  );
}
