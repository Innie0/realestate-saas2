'use client';

import clsx from 'clsx';
import { Loader2, Search, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

interface AiSearchHeroProps {
  headline: string;
  description?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  actionLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

/** Centered AI search empty-state — Instantly SuperSearch pattern. */
export default function AiSearchHero({
  headline,
  description,
  placeholder,
  value,
  onChange,
  onSubmit,
  actionLabel = 'AI Search',
  loading = false,
  disabled = false,
  className,
  footer,
}: AiSearchHeroProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && !loading) onSubmit();
  };

  return (
    <div className={clsx('mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-12 text-center', className)}>
      <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
        {headline}
      </h2>
      {description ? (
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}

      <div className="relative mt-8 w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={clsx(
            'w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-[7.5rem] text-sm text-foreground',
            'placeholder:text-muted-foreground focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          )}
        />
        <Button
          type="button"
          size="sm"
          disabled={disabled || loading || !value.trim()}
          onClick={onSubmit}
          className="absolute right-2 top-1/2 -translate-y-1/2 gap-1.5 rounded-lg bg-brand-500 px-3.5 hover:bg-brand-600"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" strokeWidth={1.75} />
          )}
          {loading ? 'Searching…' : actionLabel}
        </Button>
      </div>

      {footer ? <div className="mt-6 w-full">{footer}</div> : null}
    </div>
  );
}
