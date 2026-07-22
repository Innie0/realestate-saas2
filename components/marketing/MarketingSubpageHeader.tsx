'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';

export default function MarketingSubpageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-[60] transition-[background-color,border-color,box-shadow] duration-300 ${
        menuOpen ? 'border-b border-transparent bg-transparent' : 'border-b border-mkt-border bg-mkt-background'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-mkt-content items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-mono text-[1.15rem] font-semibold tracking-[-0.04em] text-mkt-foreground transition-opacity hover:opacity-80 sm:text-[1.35rem]"
        >
          Oikaro
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ProductsMegaMenu onOpenChange={setMenuOpen} />
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-mkt-secondary transition-opacity hover:opacity-70 sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/auth/login"
            className="px-3 py-2 text-sm font-medium text-mkt-secondary transition-opacity hover:opacity-70"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-mkt-button bg-mkt-accent px-3 py-2 text-xs font-medium text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover sm:px-4 sm:text-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
