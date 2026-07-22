import AuthLogo from '@/components/branding/AuthLogo';

interface AuthPageShellProps {
  children?: React.ReactNode;
}

/** Shared auth page frame — matches landing palette and spacing. */
export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="marketing-root relative flex min-h-screen items-center justify-center bg-mkt-background px-5 py-12 text-mkt-foreground sm:px-8">
      <div className="relative w-full max-w-md">
        <AuthLogo />
        {children}
      </div>
    </div>
  );
}
