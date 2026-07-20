'use client';

import Image from 'next/image';
import { MKT } from '@/lib/marketing-design';

export default function HeroProductScreenshot() {
  return (
    <div className="overflow-hidden bg-white" style={{ borderRadius: MKT.radius.lg }}>
      <Image
        src="/landing/hero-assistant.png"
        alt="Oikaro workspace — AI Assistant, listings, and leads in one place"
        width={1760}
        height={1100}
        className="h-auto w-full"
        priority
        sizes="(max-width: 880px) 100vw, 880px"
      />
    </div>
  );
}
