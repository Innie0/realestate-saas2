import clsx from 'clsx';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Content max width */
  size?: 'default' | 'narrow' | 'medium' | 'full';
}

const sizeClasses = {
  default: 'max-w-7xl',
  narrow: 'max-w-4xl',
  medium: 'max-w-5xl',
  full: 'max-w-none',
} as const;

export default function PageShell({ children, className, size = 'default' }: PageShellProps) {
  return (
    <div
      className={clsx(
        'px-4 sm:px-7 py-5 sm:py-6 text-foreground mx-auto w-full',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
