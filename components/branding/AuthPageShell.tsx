import AuthLogo from '@/components/branding/AuthLogo';
import { mktVar } from '@/lib/mkt-css';

interface AuthPageShellProps {
  children?: React.ReactNode;
}

/** Shared auth page frame — matches landing palette and spacing. */
export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="marketing-root relative flex min-h-screen items-center justify-center bg-mkt-background px-5 py-12 text-mkt-foreground sm:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-50"
        aria-hidden
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% -20%, ${mktVar('--mkt-hero-glow')} 0%, transparent 70%)`,
        }}
      />
      <div className="relative w-full max-w-md">
        <AuthLogo />
        {children}
      </div>
    </div>
  );
}
