import { Check, CheckCircle, Minus } from 'lucide-react';
import { formatFeatureText } from '@/lib/formatFeatureText';
import {
  PRO_CARD_HIGHLIGHTS,
  PRO_PLAN_INTRO,
  PRO_EXCLUSIVE_FEATURES,
  STARTER_FEATURE_GROUPS,
  STARTER_FEATURES,
  type PlanSlug,
} from '@/lib/pricing';

type PricingFeatureListProps = {
  plan: PlanSlug;
  icon?: 'check' | 'check-circle';
  className?: string;
  /** Full flat list (legacy); default is compact grouped cards */
  variant?: 'compact' | 'full';
  /** Marketing landing uses design.md token colors */
  tone?: 'default' | 'marketing';
};

function FeatureIcon({
  icon,
  iconClass,
}: {
  icon: 'check' | 'check-circle';
  iconClass: string;
}) {
  const Icon = icon === 'check' ? Check : CheckCircle;
  return <Icon className={`h-3.5 w-3.5 ${iconClass} mt-0.5 shrink-0`} strokeWidth={2} />;
}

export default function PricingFeatureList({
  plan,
  icon = 'check-circle',
  className = '',
  variant = 'compact',
  tone = 'default',
}: PricingFeatureListProps) {
  const isMarketing = tone === 'marketing';
  const iconClass = isMarketing
    ? 'text-[#6B6A64]'
    : icon === 'check'
      ? 'text-green-500'
      : 'text-brand-500';
  const textClass = isMarketing ? 'text-[#6B6A64]' : 'text-gray-600';
  const headingClass = isMarketing ? 'text-[#141412]' : 'text-gray-900';
  const labelClass = isMarketing
    ? 'text-[#6B6A64] text-xs font-medium uppercase tracking-[0.12em]'
    : 'text-gray-500 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]';

  if (variant === 'full' && plan === 'starter') {
    return (
      <ul className={`space-y-2 ${className}`}>
        {STARTER_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <FeatureIcon icon={icon} iconClass={iconClass} />
            <span className={`text-sm ${textClass}`}>{feature}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === 'full' && plan === 'pro') {
    return (
      <ul className={`space-y-2 ${className}`}>
        <li className="flex items-start gap-2.5">
          <FeatureIcon icon={icon} iconClass={iconClass} />
          <span className={`text-sm ${textClass}`}>7-day free trial</span>
        </li>
        <li className="pt-0.5">
          <span className={`text-sm font-semibold ${headingClass}`}>{PRO_PLAN_INTRO}</span>
        </li>
        {PRO_EXCLUSIVE_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <FeatureIcon icon={icon} iconClass={iconClass} />
            <span className={`text-sm ${textClass}`}>{formatFeatureText(feature)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (plan === 'starter') {
    return (
      <div className={`space-y-4 ${className}`}>
        {STARTER_FEATURE_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={`mb-1.5 ${labelClass}`}>
              {group.title}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <FeatureIcon icon={icon} iconClass={iconClass} />
                  <span className={`text-[13px] leading-snug ${textClass}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className={`space-y-2 ${className}`}>
      <li className="pb-0.5">
        <span className={`text-sm font-semibold ${headingClass}`}>{PRO_PLAN_INTRO}</span>
      </li>
      {PRO_CARD_HIGHLIGHTS.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <FeatureIcon icon={icon} iconClass={iconClass} />
            <span className={`text-[13px] leading-snug ${textClass}`}>{formatFeatureText(feature)}</span>
        </li>
      ))}
    </ul>
  );
}
