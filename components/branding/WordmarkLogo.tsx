import Link from 'next/link';
import Image from 'next/image';

interface WordmarkLogoProps {
  className?: string;
}

/**
 * Oikaro wordmark for the marketing landing page.
 * Source asset is white on black — invert + multiply removes the dark matte on light headers.
 */
export default function WordmarkLogo({
  className = 'h-10 sm:h-11 w-auto object-contain invert mix-blend-multiply',
}: WordmarkLogoProps) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center">
      <Image
        src="/logo-oikaro-wordmark.png"
        alt="Oikaro"
        width={1024}
        height={512}
        priority
        className={className}
      />
    </Link>
  );
}
