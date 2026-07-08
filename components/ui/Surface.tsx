import clsx from 'clsx';

interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  sticky?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/** Soft white panel — Notion-style surface on the gray canvas. */
export default function Surface({
  children,
  className,
  padding = 'md',
  hover = false,
  sticky = false,
}: SurfaceProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-white ring-1 ring-gray-900/[0.04] shadow-surface',
        paddingStyles[padding],
        hover && 'transition-all duration-200 hover:shadow-raised hover:ring-gray-900/[0.07] hover:-translate-y-px',
        sticky && 'sticky top-16 z-10 backdrop-blur-sm bg-white/95',
        className,
      )}
    >
      {children}
    </div>
  );
}
