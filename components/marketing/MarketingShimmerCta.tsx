'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';

type MarketingShimmerCtaProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
  inverted?: boolean;
  /** 'blue' uses the header's solid brand blue instead of the default black/mkt-accent fill. */
  color?: 'default' | 'blue';
};

/** Solid primary CTA for marketing pages. */
export default function MarketingShimmerCta({
  href,
  children,
  className,
  size = 'md',
  inverted = false,
  color = 'default',
}: MarketingShimmerCtaProps) {
  const router = useRouter();

  const sizeClass = size === 'lg' ? 'h-12 px-7 text-[15px]' : 'h-10 px-5 text-sm';

  const colorClass = inverted
    ? 'bg-white text-[#111111] hover:bg-white/90 focus-visible:ring-white/40 focus-visible:ring-offset-[#0a0a0a]'
    : color === 'blue'
      ? 'bg-[#0668E1] text-white hover:bg-[#0450b0] focus-visible:ring-[#0668E1]/40 focus-visible:ring-offset-white'
      : 'bg-mkt-accent text-mkt-accent-foreground hover:bg-mkt-accent-hover focus-visible:ring-mkt-foreground/40 focus-visible:ring-offset-mkt-background';

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={clsx(
        'inline-flex items-center justify-center rounded-mkt-button font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        colorClass,
        sizeClass,
        className,
      )}
    >
      {children}
    </button>
  );
}
