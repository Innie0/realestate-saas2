'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';
import { MKT } from '@/lib/marketing-design';

export default function MarketingSubpageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-[60] transition-[background-color,border-color,box-shadow] duration-300"
      style={{
        borderBottom: menuOpen ? '1px solid transparent' : `1px solid ${MKT.border}`,
        backgroundColor: menuOpen ? 'transparent' : MKT.background,
      }}
    >
      <div
        className="mx-auto flex h-16 items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8"
        style={{ maxWidth: MKT.maxContentWidth }}
      >
        <Link
          href="/"
          className="font-mono text-[1.15rem] font-semibold tracking-[-0.04em] transition-opacity hover:opacity-80 sm:text-[1.35rem]"
          style={{ color: MKT.textPrimary }}
        >
          Oikaro
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ProductsMegaMenu onOpenChange={setMenuOpen} />
          <Link
            href="/pricing"
            className="hidden text-sm font-medium transition-opacity hover:opacity-70 sm:inline"
            style={{ color: MKT.textSecondary }}
          >
            Pricing
          </Link>
          <Link
            href="/auth/login"
            className="px-3 py-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: MKT.textSecondary }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="mkt-cta px-3 py-2 text-xs font-medium transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
            style={{ borderRadius: MKT.radius.button }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
