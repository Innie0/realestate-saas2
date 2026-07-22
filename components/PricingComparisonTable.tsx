import { Check, Minus } from 'lucide-react';
import { PLAN_COMPARISON_ROWS } from '@/lib/pricing';

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-mkt-foreground" strokeWidth={2.5} aria-label="Included" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus className="h-4 w-4 text-mkt-muted" strokeWidth={2} aria-label="Not included" />
      </span>
    );
  }
  return <span className="text-sm text-mkt-secondary">{value}</span>;
}

export default function PricingComparisonTable() {
  return (
    <div className="overflow-hidden rounded-mkt-card border border-mkt-border bg-mkt-surface">
      <div className="border-b border-mkt-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-medium tracking-[-0.02em] text-mkt-foreground sm:text-xl">
          Compare plans
        </h2>
        <p className="mt-1 text-sm leading-[1.6] text-mkt-secondary">
          Full feature breakdown for Starter and Pro.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-mkt-border bg-mkt-background">
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary sm:px-6">
                Feature
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary sm:px-6">
                Starter
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary sm:px-6">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="bg-mkt-background">
                <td className="px-5 py-3 text-sm font-medium text-mkt-foreground sm:px-6">
                  {row.label}
                </td>
                <td className="px-4 py-3 text-center sm:px-6">
                  <CellValue value={row.starter} />
                </td>
                <td className="px-4 py-3 text-center sm:px-6">
                  <CellValue value={row.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-mkt-border px-5 py-3 sm:px-6">
        <p className="text-xs leading-[1.6] text-mkt-secondary">
          Both plans include a 7-day free trial, lead capture, CRM, calendar, tasks, and transaction tools.
        </p>
      </div>
    </div>
  );
}
