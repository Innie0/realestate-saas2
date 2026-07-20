'use client';

import Image from 'next/image';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import { MKT } from '@/lib/marketing-design';

type ProductScreenshotProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

export default function ProductScreenshot({ src, alt, priority = false }: ProductScreenshotProps) {
  return (
    <BrowserWindowFrame>
      <div className="relative aspect-[16/10] w-full bg-[var(--surface)]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, 560px"
          priority={priority}
        />
      </div>
    </BrowserWindowFrame>
  );
}
