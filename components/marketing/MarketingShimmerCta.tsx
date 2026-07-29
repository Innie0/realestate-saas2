'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';

type MarketingShimmerCtaProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
};

/** Solid black primary CTA for marketing pages. */
export default function MarketingShimmerCta({
  href,
  children,
  className,
  size = 'md',
}: MarketingShimmerCtaProps) {
  const router = useRouter();

  const sizeClass = size === 'lg' ? 'h-12 px-7 text-[15px]' : 'h-10 px-5 text-sm';

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={clsx(
        'inline-flex items-center justify-center rounded-mkt-button bg-mkt-accent font-medium text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mkt-background',
        sizeClass,
        className,
      )}
    >
      {children}
    </button>
  );
}
