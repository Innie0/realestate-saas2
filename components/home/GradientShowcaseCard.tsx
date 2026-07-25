'use client';

import ProductScreenshot from '@/components/home/ProductScreenshot';

type GradientShowcaseCardProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function GradientShowcaseCard({ src, alt, className }: GradientShowcaseCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.35rem] p-3 sm:p-4 lg:p-5 ${className ?? ''}`}
      style={{ background: 'var(--mkt-cobalt-gradient)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
      <div className="relative">
        <ProductScreenshot src={src} alt={alt} className="shadow-[0_24px_60px_-28px_rgba(17,17,17,0.35)]" />
      </div>
    </div>
  );
}
