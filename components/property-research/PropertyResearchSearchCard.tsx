'use client';

import { Search, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';

const inputClass =
  'w-full rounded-lg border border-border bg-[var(--canvas)] px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

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
}: PropertyResearchSearchCardProps) {
  const canSubmit = Boolean(street.trim() && state);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && canSubmit && !loading) onSubmit();
  };

  return (
    <Card className="p-5 sm:p-[22px]" data-tour="research-search">
      <div className="max-w-2xl">
        <h2 className="text-[15px] font-semibold text-foreground">Research an address</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Look up owners, property details, and run a comp-based CMA from one search.
        </p>

        <div className="mt-5 space-y-3" onKeyDown={handleKeyDown}>
          <div>
            <label htmlFor="research-street" className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Street address *
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="research-street"
                type="text"
                value={street}
                onChange={(e) => onStreetChange(e.target.value)}
                placeholder="123 W Main Street"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="research-city" className="mb-1 block text-[11px] font-medium text-muted-foreground">
                City
              </label>
              <input
                id="research-city"
                type="text"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="Austin"
                className={inputClass}
              />
            </div>
            <div>
              <Select
                label="State *"
                value={state}
                onChange={onStateChange}
                placeholder="Select state"
                triggerClassName={`${inputClass} py-2`}
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
                value={zip}
                onChange={(e) => onZipChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="78701"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-muted-foreground">
              Demo: 123 W Main Street, Austin, TX — sample owner + CMA (no real PII).
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
      </div>
    </Card>
  );
}
