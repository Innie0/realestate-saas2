'use client';

import clsx from 'clsx';
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
    <div
      className={clsx(
        'rounded-mkt-browser shadow-[0_32px_80px_-32px_rgba(17,17,17,0.45)]',
        className,
      )}
    >
      <ProductFrame interactive={!href}>
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
    </div>
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
