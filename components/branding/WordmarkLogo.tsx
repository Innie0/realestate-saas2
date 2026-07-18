import Link from 'next/link';
import Image from 'next/image';

interface WordmarkLogoProps {
  className?: string;
}

/** Oikaro wordmark for the marketing landing page. */
export default function WordmarkLogo({
  className = 'h-9 sm:h-10 w-auto object-contain',
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
