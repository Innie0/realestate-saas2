import clsx from 'clsx';

interface PageToolbarProps {
  children: React.ReactNode;
  className?: string;
  meta?: React.ReactNode;
}

/** Unified row for search, filters, and primary actions. */
export default function PageToolbar({ children, className, meta }: PageToolbarProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {children}
      </div>
      {meta && <p className="text-xs text-gray-700">{meta}</p>}
    </div>
  );
}
