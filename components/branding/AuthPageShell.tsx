import AuthLogo from '@/components/branding/AuthLogo';

interface AuthPageShellProps {
  children?: React.ReactNode;
}

/** Shared auth page frame — logo renders immediately, even while session is checked. */
export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="marketing-root min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gray-50 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <AuthLogo />
        {children}
      </div>
    </div>
  );
}
