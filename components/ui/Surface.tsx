import clsx from 'clsx';

interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  sticky?: boolean;
  /**
   * Kept for API compatibility — all Surfaces are flat (border, no shadow).
   */
  flat?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/** Flat panel on the canvas — hairline border, no elevation shadow. */
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
        'rounded-[10px] border border-[var(--border)] bg-[var(--surface)]',
        paddingStyles[padding],
        hover && 'transition-colors duration-150 hover:bg-gray-150',
        sticky && 'sticky top-16 z-10 backdrop-blur-sm bg-[var(--surface)]/95',
        className,
      )}
    >
      {children}
    </div>
  );
}
