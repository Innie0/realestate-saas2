import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type DataLoadingStateProps = {
  title?: string;
  description?: string;
  /** 0–100 when known; omit for indeterminate spinner */
  progress?: number;
  className?: string;
};

/** In-panel loading for fetches that take a few seconds (CMA, AI generation, lookup). */
export default function DataLoadingState({
  title = 'Loading…',
  description,
  progress,
  className,
}: DataLoadingStateProps) {
  const showBar = typeof progress === 'number';

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-8 animate-spin text-brand-500" strokeWidth={1.75} aria-hidden />
      <p className="mt-4 text-sm font-medium text-gray-900">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-600">{description}</p>
      ) : null}
      {showBar ? (
        <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
