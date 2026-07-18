import Link from 'next/link';

interface AuthLogoProps {
  className?: string;
  /** Center above auth forms (default). Set false for inline header use. */
  centered?: boolean;
}

/** Auth pages logo — high-res PNG downscaled for crisp Retina display. */
export default function AuthLogo({ className = 'h-16 sm:h-20 w-auto', centered = true }: AuthLogoProps) {
  const img = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logo-collapsed.png"
      alt="Oikaro"
      width={512}
      height={288}
      fetchPriority="high"
      decoding="async"
      className={`object-contain ${className}`}
    />
  );

  if (!centered) {
    return (
      <Link href="/" className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }

  return (
    <div className="flex justify-center mb-8">
      <Link href="/" className="inline-flex shrink-0">
        {img}
      </Link>
    </div>
  );
}
