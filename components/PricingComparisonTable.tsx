import { Check, Minus } from 'lucide-react';
import { PLAN_COMPARISON_ROWS } from '@/lib/pricing';

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-brand-500" strokeWidth={2.5} aria-label="Included" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus className="h-4 w-4 text-gray-300" strokeWidth={2} aria-label="Not included" />
      </span>
    );
  }
  return <span className="text-sm text-gray-700">{value}</span>;
}

export default function PricingComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
          Compare plans
        </h2>
        <p className="mt-1 text-sm text-gray-600">Full feature breakdown for Starter and Pro.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-[#fafafa]">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                Feature
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                Starter
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]/60'}
              >
                <td className="px-5 py-3 text-sm font-medium text-gray-900 sm:px-6">{row.label}</td>
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

      <div className="border-t border-gray-100 px-5 py-3 sm:px-6">
        <p className="text-xs text-gray-500">
          Both plans include a 7-day free trial, lead capture, CRM, calendar, tasks, and transaction tools.
        </p>
      </div>
    </div>
  );
}
