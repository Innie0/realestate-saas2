import AuthLogo from '@/components/branding/AuthLogo';
import { MKT } from '@/lib/marketing-design';

interface AuthPageShellProps {
  children?: React.ReactNode;
}

/** Shared auth page frame — logo renders immediately, even while session is checked. */
export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div
      className="marketing-root min-h-screen flex items-center justify-center px-4 py-12 font-sans"
      style={{ backgroundColor: MKT.background }}
    >
      <div className="w-full max-w-md">
        <AuthLogo />
        {children}
      </div>
    </div>
  );
}
