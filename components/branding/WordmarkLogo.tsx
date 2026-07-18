import Link from 'next/link';
import Image from 'next/image';

interface WordmarkLogoProps {
  className?: string;
  /** White wordmark asset — invert for light marketing backgrounds. */
  inverted?: boolean;
}

/** Oikaro wordmark for the marketing landing page. */
export default function WordmarkLogo({
  className = 'h-10 sm:h-11 w-auto object-contain',
  inverted = true,
}: WordmarkLogoProps) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center">
      <Image
        src="/logo-oikaro-wordmark.png"
        alt="Oikaro"
        width={1024}
        height={512}
        priority
        className={`${className}${inverted ? ' invert' : ''}`}
      />
    </Link>
  );
}
