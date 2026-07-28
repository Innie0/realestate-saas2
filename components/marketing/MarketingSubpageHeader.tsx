'use client';

import { useState } from 'react';
import MarketingHeaderNav from '@/components/marketing/MarketingHeaderNav';

export default function MarketingSubpageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-[60] transition-[background-color,border-color,box-shadow] duration-300 ${
        menuOpen ? 'border-b border-[rgba(17,17,17,0.14)] bg-mkt-background' : 'border-b border-mkt-border bg-mkt-background'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-mkt-content items-center px-5 sm:h-[4.5rem] sm:px-8">
        <MarketingHeaderNav onProductsMenuChange={setMenuOpen} />
      </div>
    </header>
  );
}
