'use client';

import Link from 'next/link';

type MarketingPageHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export default function MarketingPageHeader({
  backHref = '/',
  backLabel = 'Back to home',
}: MarketingPageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-mkt-border bg-white">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-8">
        <Link
          href={backHref}
          className="text-sm font-medium text-mkt-secondary transition-opacity hover:opacity-70"
        >
          ← {backLabel}
        </Link>
        <Link
          href="/"
          className="font-mkt-mono text-[21px] font-normal tracking-[-0.01em] text-mkt-foreground transition-opacity hover:opacity-70"
        >
          Oikaro
        </Link>
      </div>
    </header>
  );
}
