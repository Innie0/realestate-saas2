'use client';

import Image from 'next/image';
import Link from 'next/link';
import ProductFrame from '@/components/home/ProductFrame';

type ProductScreenshotProps = {
  src: string;
  alt: string;
  priority?: boolean;
  href?: string;
  className?: string;
  /** Shorter aspect for feature showcase cards */
  size?: 'default' | 'showcase';
};

export default function ProductScreenshot({
  src,
  alt,
  priority = false,
  href,
  className,
  size = 'default',
}: ProductScreenshotProps) {
  const image = (
    <ProductFrame interactive={!href} className={className}>
      <div
        className={`relative w-full bg-[var(--mkt-mock-surface)] ${size === 'showcase' ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, 720px"
          priority={priority}
        />
      </div>
    </ProductFrame>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-[0.98]">
        {image}
      </Link>
    );
  }

  return image;
}
