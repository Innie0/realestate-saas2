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
          'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:shadow-[0_0_0_3px_rgba(252,92,3,0.08)]',
          'transition-shadow duration-150',
          className,
        )}
        {...props}
      />
    </div>
  );
}
