'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { MKT } from '@/lib/marketing-design';

type MarketingPageHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export default function MarketingPageHeader({
  backHref = '/',
  backLabel = 'Back to home',
}: MarketingPageHeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 border-b backdrop-blur-md"
      style={{
        borderColor: MKT.border,
        backgroundColor: 'rgba(251, 251, 250, 0.92)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-8">
        <Link
          href={backHref}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: MKT.textSecondary }}
        >
          ← {backLabel}
        </Link>
        <Link
          href="/"
          className={clsx('font-medium tracking-[-0.02em] transition-opacity hover:opacity-70')}
          style={{ color: MKT.textPrimary }}
        >
          Oikaro
        </Link>
      </div>
    </header>
  );
}
