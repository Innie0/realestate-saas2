'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import type { WizardStepKey } from '@/lib/ads/ad-draft-types';
import { WIZARD_STEPS } from '@/lib/ads/ad-draft-types';

interface StepSidebarProps {
  currentStep: WizardStepKey;
  maxStepIndex: number;
  onStepClick: (step: WizardStepKey) => void;
}

export default function StepSidebar({ currentStep, maxStepIndex, onStepClick }: StepSidebarProps) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-w-0">
      {/* Desktop step list — only when the wizard has room for three columns */}
      <nav className="hidden 2xl:block space-y-1" aria-label="Ad creation steps">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isComplete = index < currentIndex;
          const isClickable = index <= maxStepIndex;

          return (
            <button
              key={step.key}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.key)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left transition-colors duration-150',
                isActive && 'bg-gray-50 border-l-brand-500',
                !isActive && isClickable && 'hover:bg-gray-50 border-l-transparent',
                !isClickable && 'opacity-45 cursor-not-allowed border-l-transparent'
              )}
            >
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  isActive && 'bg-zinc-700 text-white',
                  isComplete && !isActive && 'bg-emerald-100 text-emerald-700',
                  !isActive && !isComplete && 'bg-gray-100 text-gray-700'
                )}
              >
                {isComplete && !isActive ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={clsx(
                  'text-[13px] font-medium',
                  isActive ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Step pills when the desktop step column is hidden */}
      <div className="2xl:hidden flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isClickable = index <= maxStepIndex;
          return (
            <button
              key={step.key}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.key)}
              className={clsx(
                'shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors',
                isActive
                  ? 'bg-zinc-700 text-white'
                  : isClickable
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400'
              )}
            >
              {step.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
