import clsx from 'clsx';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Content max width */
  size?: 'default' | 'narrow' | 'medium';
}

const sizeClasses = {
  default: 'max-w-7xl',
  narrow: 'max-w-4xl',
  medium: 'max-w-5xl',
} as const;

export default function PageShell({ children, className, size = 'default' }: PageShellProps) {
  return (
    <div
      className={clsx(
        'px-4 sm:px-6 py-6 text-gray-900 mx-auto w-full',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
