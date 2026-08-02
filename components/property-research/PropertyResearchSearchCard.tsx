'use client';

import clsx from 'clsx';
import { Search, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';

const inputClass =
  'w-full rounded-lg border border-border bg-[var(--canvas)] px-3 py-2 text-[13px] text-foreground placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

type PropertyResearchSearchCardProps = {
  street: string;
  city: string;
  state: string;
  zip: string;
  states: { value: string; label: string }[];
  loading?: boolean;
  onStreetChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipChange: (value: string) => void;
  onSubmit: () => void;
  onTryDemo?: () => void;
};

export default function PropertyResearchSearchCard({
  street,
  city,
  state,
  zip,
  states,
  loading = false,
  onStreetChange,
  onCityChange,
  onStateChange,
  onZipChange,
  onSubmit,
  onTryDemo,
}: PropertyResearchSearchCardProps) {
  const canSubmit = Boolean(street.trim() && state);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && canSubmit && !loading) onSubmit();
  };

  return (
    <Card className="p-5 sm:p-[22px]" data-tour="research-search">
      <h2 className="text-[15px] font-semibold text-foreground">Research an address</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Look up owners, property details, and run a comp-based CMA from one search.
      </p>

      <div className="mt-4 space-y-2.5" onKeyDown={handleKeyDown}>
        <div>
          <label htmlFor="research-street" className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Street address *
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="research-street"
              type="text"
              autoComplete="off"
              value={street}
              onChange={(e) => onStreetChange(e.target.value)}
              placeholder="123 W Main Street"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <div>
            <label htmlFor="research-city" className="mb-1 block text-[11px] font-medium text-muted-foreground">
              City
            </label>
            <input
              id="research-city"
              type="text"
              autoComplete="off"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="Austin"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="research-state" className="mb-1 block text-[11px] font-medium text-muted-foreground">
              State *
            </label>
            <Select
              value={state}
              onChange={onStateChange}
              placeholder="Select state"
              triggerClassName={clsx(
                inputClass,
                'py-2',
                !state && '!text-gray-400',
              )}
              options={[{ value: '', label: 'Select state' }, ...states.map((s) => ({ value: s.value, label: s.label }))]}
            />
          </div>
          <div>
            <label htmlFor="research-zip" className="mb-1 block text-[11px] font-medium text-muted-foreground">
              ZIP
            </label>
            <input
              id="research-zip"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={zip}
              onChange={(e) => onZipChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="78701"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted-foreground">
            Demo:{' '}
            {onTryDemo ? (
              <button
                type="button"
                onClick={onTryDemo}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                123 W Main Street, Austin, TX
              </button>
            ) : (
              '123 W Main Street, Austin, TX'
            )}{' '}
            — sample owner + CMA (no real PII, free lookup).
          </p>
          <Button
            type="button"
            size="sm"
            disabled={!canSubmit || loading}
            onClick={onSubmit}
            className="shrink-0 gap-1.5 self-start sm:self-auto"
            isLoading={loading}
          >
            {!loading && <Sparkles className="size-3.5" />}
            {loading ? 'Researching…' : 'Research address'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
