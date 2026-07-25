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
    <LandingGradientPanel variant="feature" compact className={className}>
      <ProductScreenshot src={src} alt={alt} className="shadow-[0_24px_60px_-28px_rgba(17,17,17,0.35)]" />
    </LandingGradientPanel>
  );
}
