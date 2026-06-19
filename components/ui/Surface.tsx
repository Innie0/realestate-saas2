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
        'rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]',
        paddingStyles[padding],
        hover && 'transition-all duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]',
        sticky && 'sticky top-16 z-10 backdrop-blur-sm bg-white/95',
        className,
      )}
    >
      {children}
    </div>
  );
}
