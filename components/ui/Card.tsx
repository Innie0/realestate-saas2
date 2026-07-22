import Surface from '@/components/ui/Surface';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

/** Flat dashboard panel — alias of Surface flat for a single card language. */
export default function Card({
  children,
  className,
  padding = 'md',
  hover = false,
}: CardProps) {
  return (
    <Surface flat padding={padding} hover={hover} className={className}>
      {children}
    </Surface>
  );
}
