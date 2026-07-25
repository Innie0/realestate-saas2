'use client';

import ProductScreenshot from '@/components/home/ProductScreenshot';
import LandingGradientPanel from '@/components/home/LandingGradientPanel';

type GradientShowcaseCardProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function GradientShowcaseCard({ src, alt, className }: GradientShowcaseCardProps) {
  return (
    <LandingGradientPanel variant="feature" showcase className={className}>
      <div className="mx-auto w-full max-w-[640px] sm:max-w-[680px] lg:max-w-[720px]">
        <ProductScreenshot
          src={src}
          alt={alt}
          size="showcase"
          className="shadow-[0_24px_60px_-28px_rgba(17,17,17,0.35)]"
        />
      </div>
    </LandingGradientPanel>
  );
}
