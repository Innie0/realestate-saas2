import Link from 'next/link';
import { MKT } from '@/lib/marketing-design';

interface AuthLogoProps {
  className?: string;
  centered?: boolean;
}

/** Auth wordmark — matches landing nav typography. */
export default function AuthLogo({ centered = true }: AuthLogoProps) {
  const mark = (
    <Link
      href="/"
      className="font-display text-3xl font-medium tracking-[-0.03em] transition-opacity hover:opacity-70 sm:text-4xl"
      style={{ color: MKT.textPrimary }}
    >
      Oikaro
    </Link>
  );

  if (!centered) return mark;

  return <div className="mb-8 flex justify-center">{mark}</div>;
}
