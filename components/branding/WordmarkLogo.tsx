import Link from 'next/link';
import Image from 'next/image';

interface WordmarkLogoProps {
  className?: string;
}

/** Orange REALESTIC wordmark — sized large to offset PNG padding. */
export default function WordmarkLogo({ className = 'h-32 w-auto max-w-none object-contain object-left' }: WordmarkLogoProps) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center overflow-hidden w-[11rem] sm:w-[12.5rem]">
      <Image
        src="/logo-wordmark.png"
        alt="Realestic"
        width={800}
        height={240}
        priority
        className={className}
      />
    </Link>
  );
}
