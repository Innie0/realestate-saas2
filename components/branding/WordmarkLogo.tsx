import Link from 'next/link';
import Image from 'next/image';

interface WordmarkLogoProps {
  className?: string;
  /** Light = white wordmark for dark/photo backgrounds; dark = default black wordmark. */
  theme?: 'light' | 'dark';
}

/** Oikaro wordmark for the marketing landing page. */
export default function WordmarkLogo({
  className = 'h-10 sm:h-12 w-auto object-contain',
  theme = 'dark',
}: WordmarkLogoProps) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center">
      <Image
        src="/logo-oikaro-wordmark.png"
        alt="Oikaro"
        width={1017}
        height={247}
        priority
        className={`${className} transition-[filter] duration-300 ease-out ${
          theme === 'light' ? 'brightness-0 invert' : ''
        }`}
      />
    </Link>
  );
}
