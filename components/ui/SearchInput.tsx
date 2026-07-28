import clsx from 'clsx';
import { Search } from 'lucide-react';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  containerClassName?: string;
}

export default function SearchInput({
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={clsx('relative flex-1 min-w-0', containerClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        className={clsx(
          'w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm',
          'text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
          'transition-colors duration-150',
          className,
        )}
        {...props}
      />
    </div>
  );
}
