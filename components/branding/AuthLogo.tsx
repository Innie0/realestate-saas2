import Link from 'next/link';

interface AuthLogoProps {
  className?: string;
  /** Center above auth forms (default). Set false for inline header use. */
  centered?: boolean;
}

/** Auth pages logo — plain img for instant paint (no Next image optimizer delay). */
export default function AuthLogo({ className = 'h-16 sm:h-20 w-auto', centered = true }: AuthLogoProps) {
  const img = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logo-auth.png"
      alt="Realestic"
      width={200}
      height={112}
      fetchPriority="high"
      decoding="sync"
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
