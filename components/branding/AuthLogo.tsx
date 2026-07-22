import Link from 'next/link';

interface AuthLogoProps {
  className?: string;
  centered?: boolean;
}

/** Auth wordmark — matches landing nav typography. */
export default function AuthLogo({ centered = true }: AuthLogoProps) {
  const mark = (
    <Link
      href="/"
      className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground transition-opacity hover:opacity-70 sm:text-4xl"
    >
      Oikaro
    </Link>
  );

  if (!centered) return mark;

  return <div className="mb-8 flex justify-center">{mark}</div>;
}
