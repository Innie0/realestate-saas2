'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useMotionReduced } from '@/lib/motion';

type MarketingShimmerCtaProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
};

/** Cobalt primary CTA with Magic UI shimmer — falls back to flat button when reduced motion. */
export default function MarketingShimmerCta({
  href,
  children,
  className,
  size = 'md',
}: MarketingShimmerCtaProps) {
  const router = useRouter();
  const reduced = useMotionReduced();

  const sizeClass = size === 'lg' ? 'h-12 px-7 text-[15px]' : 'h-10 px-5 text-sm';

  if (reduced) {
    return (
      <button
        type="button"
        onClick={() => router.push(href)}
        className={clsx(
          'inline-flex items-center justify-center rounded-mkt-button bg-mkt-accent font-medium text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mkt-background',
          sizeClass,
          className,
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <ShimmerButton
      type="button"
      onClick={() => router.push(href)}
      background="#111111"
      shimmerColor="#ffffff"
      borderRadius="10px"
      shimmerDuration="3s"
      className={clsx(
        'font-medium shadow-[var(--mkt-shadow-cta)]',
        sizeClass,
        className,
      )}
    >
      {children}
    </ShimmerButton>
  );
}
