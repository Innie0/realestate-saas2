import Link from 'next/link';

interface AuthLogoProps {
  className?: string;
  centered?: boolean;
}

/** Auth wordmark — matches landing nav monospace typography. */
export default function AuthLogo({ centered = true }: AuthLogoProps) {
  const mark = (
    <Link
      href="/"
      className="font-mkt-mono text-2xl font-normal tracking-[-0.01em] text-mkt-foreground transition-opacity hover:opacity-70 sm:text-3xl"
    >
      Oikaro
    </Link>
  );

  if (!centered) return mark;

  return <div className="mb-8 flex justify-center">{mark}</div>;
}
