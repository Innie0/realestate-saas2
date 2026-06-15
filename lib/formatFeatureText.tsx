import React from 'react';

/** Renders feature text with "Unlimited" bolded for emphasis on Pro plan items. */
export function formatFeatureText(feature: string): React.ReactNode {
  if (!feature.includes('Unlimited')) return feature;

  const parts = feature.split(/(Unlimited)/g);
  return parts.map((part, i) =>
    part === 'Unlimited' ? (
      <strong key={i} className="font-semibold text-gray-900">
        {part}
      </strong>
    ) : (
      part
    )
  );
}
