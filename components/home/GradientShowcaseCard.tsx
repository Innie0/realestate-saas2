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
    <LandingGradientPanel
      variant="feature"
      mesh="static"
      showcase
      innerClassName="!py-4 !px-4 sm:!py-5 sm:!px-6 lg:!py-6 lg:!px-8"
      className={className}
    >
      <div className="w-full">
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
