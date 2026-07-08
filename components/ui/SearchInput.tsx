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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        className={clsx(
          'w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl',
          'text-gray-900 placeholder:text-gray-400',
          'ring-1 ring-gray-900/[0.06] shadow-surface',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          'transition-shadow duration-150',
          className,
        )}
        {...props}
      />
    </div>
  );
}
