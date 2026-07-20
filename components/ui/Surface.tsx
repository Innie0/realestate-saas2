import clsx from 'clsx';

interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  sticky?: boolean;
  /**
   * Flat card: 1px hairline border, 10px radius, no shadow.
   */
  flat?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/** Elevated panel on the dark canvas — never white. */
export default function Surface({
  children,
  className,
  padding = 'md',
  hover = false,
  sticky = false,
  flat = false,
}: SurfaceProps) {
  return (
    <div
      className={clsx(
        flat
          ? 'rounded-[10px] bg-[var(--surface)] border border-gray-200'
          : 'rounded-2xl bg-[var(--surface)] ring-1 ring-white/[0.06] shadow-surface',
        paddingStyles[padding],
        hover &&
          (flat
            ? 'transition-colors duration-150 hover:bg-gray-150'
            : 'transition-all duration-200 hover:shadow-raised hover:ring-white/[0.1] hover:-translate-y-px'),
        sticky && 'sticky top-16 z-10 backdrop-blur-sm bg-[var(--surface)]/95',
        className,
      )}
    >
      {children}
    </div>
  );
}
