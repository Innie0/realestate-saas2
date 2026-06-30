import Link from 'next/link';
import Image from 'next/image';

interface WordmarkLogoProps {
  className?: string;
}

/** Orange REALESTIC wordmark — sized large to offset PNG padding. */
export default function WordmarkLogo({ className = 'h-32 w-auto object-contain' }: WordmarkLogoProps) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center">
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
