import { Check, Minus } from 'lucide-react';
import { PLAN_COMPARISON_ROWS } from '@/lib/pricing';
import { MKT } from '@/lib/marketing-design';

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-4 w-4" strokeWidth={2.5} style={{ color: MKT.textPrimary }} aria-label="Included" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus className="h-4 w-4" strokeWidth={2} style={{ color: MKT.muted }} aria-label="Not included" />
      </span>
    );
  }
  return (
    <span className="text-sm" style={{ color: MKT.textSecondary }}>
      {value}
    </span>
  );
}

export default function PricingComparisonTable() {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: MKT.radius.card,
        border: `1px solid ${MKT.border}`,
        backgroundColor: MKT.surface,
      }}
    >
      <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: MKT.border }}>
        <h2 className="text-lg font-medium tracking-[-0.02em] sm:text-xl" style={{ color: MKT.textPrimary }}>
          Compare plans
        </h2>
        <p className="mt-1 text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
          Full feature breakdown for Starter and Pro.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: MKT.border, backgroundColor: MKT.background }}>
              <th
                className="px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] sm:px-6"
                style={{ color: MKT.textSecondary }}
              >
                Feature
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.12em] sm:px-6"
                style={{ color: MKT.textSecondary }}
              >
                Starter
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.12em] sm:px-6"
                style={{ color: MKT.textSecondary }}
              >
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map((row, i) => (
              <tr
                key={row.label}
                style={{ backgroundColor: MKT.background }}
              >
                <td className="px-5 py-3 text-sm font-medium sm:px-6" style={{ color: MKT.textPrimary }}>
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

      <div className="border-t px-5 py-3 sm:px-6" style={{ borderColor: MKT.border }}>
        <p className="text-xs leading-[1.6]" style={{ color: MKT.textSecondary }}>
          Both plans include a 7-day free trial, lead capture, CRM, calendar, tasks, and transaction tools.
        </p>
      </div>
    </div>
  );
}
