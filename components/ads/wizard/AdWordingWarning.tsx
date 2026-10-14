'use client';

import { findAdWordingConcerns } from '@/lib/ads/fair-housing';

/** Gentle heads-up about wording that often gets housing ads rejected. */
export default function AdWordingWarning({ headline, body }: { headline: string; body: string }) {
  const concerns = findAdWordingConcerns(headline, body);
  if (concerns.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900">
      <p className="font-medium">Check this wording before you publish</p>
      <ul className="mt-1 space-y-0.5">
        {concerns.map((c) => (
          <li key={c.phrase}>
            “{c.phrase}” — {c.reason}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-amber-800">You can still publish; this is only a heads-up.</p>
    </div>
  );
}
