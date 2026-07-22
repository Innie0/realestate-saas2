import AuthLogo from '@/components/branding/AuthLogo';
import { MKT } from '@/lib/marketing-design';

interface AuthPageShellProps {
  children?: React.ReactNode;
}

/** Shared auth page frame — matches landing palette and spacing. */
export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div
      className="marketing-root relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-8"
      style={{ backgroundColor: MKT.background }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-50"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% -20%, rgba(237, 243, 236, 0.85) 0%, transparent 70%)',
        }}
      />
      <div className="relative w-full max-w-md">
        <AuthLogo />
        {children}
      </div>
    </div>
  );
}
