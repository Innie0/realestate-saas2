import clsx from 'clsx';
import { Card } from '@/components/ui/Card';

interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  sticky?: boolean;
  flat?: boolean;
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/** Flat panel on the canvas — shadcn Card, hairline border, no elevation shadow. */
export default function Surface({
  children,
  className,
  padding = 'md',
  hover = false,
  sticky = false,
}: SurfaceProps) {
  return (
    <Card
      className={clsx(
        paddingStyles[padding],
        hover && 'transition-colors hover:bg-muted/40',
        sticky && 'sticky top-16 z-10 backdrop-blur-sm bg-card/95',
        className,
      )}
    >
      {children}
    </Card>
  );
}
