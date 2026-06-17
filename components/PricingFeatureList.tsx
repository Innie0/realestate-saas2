import { Check, CheckCircle } from 'lucide-react';
import { formatFeatureText } from '@/lib/formatFeatureText';
import {
  STARTER_FEATURES,
  PRO_PLAN_INTRO,
  PRO_EXCLUSIVE_FEATURES,
  type PlanSlug,
} from '@/lib/pricing';

type PricingFeatureListProps = {
  plan: PlanSlug;
  icon?: 'check' | 'check-circle';
  className?: string;
};

export default function PricingFeatureList({
  plan,
  icon = 'check-circle',
  className = 'space-y-3 flex-1',
}: PricingFeatureListProps) {
  const Icon = icon === 'check' ? Check : CheckCircle;
  const iconClass = icon === 'check' ? 'text-green-400' : 'text-brand-500';

  if (plan === 'starter') {
    return (
      <ul className={className}>
        {STARTER_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Icon className={`w-4 h-4 ${iconClass} flex-shrink-0 mt-0.5`} />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={className}>
      <li className="flex items-start gap-3">
        <Icon className={`w-4 h-4 ${iconClass} flex-shrink-0 mt-0.5`} />
        <span className="text-sm text-gray-600">7-day free trial</span>
      </li>
      <li className="pt-0.5">
        <span className="text-sm font-semibold text-gray-900">{PRO_PLAN_INTRO}</span>
      </li>
      {PRO_EXCLUSIVE_FEATURES.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <Icon className={`w-4 h-4 ${iconClass} flex-shrink-0 mt-0.5`} />
          <span className="text-sm text-gray-600">{formatFeatureText(feature)}</span>
        </li>
      ))}
    </ul>
  );
}
