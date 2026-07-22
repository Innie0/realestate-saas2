'use client';

import Image from 'next/image';
import Link from 'next/link';
import ProductFrame from '@/components/home/ProductFrame';

type ProductScreenshotProps = {
  src: string;
  alt: string;
  priority?: boolean;
  href?: string;
};

export default function ProductScreenshot({ src, alt, priority = false, href }: ProductScreenshotProps) {
  const image = (
    <ProductFrame interactive={!href}>
      <div className="relative aspect-[16/10] w-full bg-[var(--mkt-mock-surface)]">
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
