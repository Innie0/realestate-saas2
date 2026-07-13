'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import StepSidebar from '@/components/ads/wizard/StepSidebar';
import AdTypeSelector from '@/components/ads/wizard/AdTypeSelector';
import PropertyDetailsStep from '@/components/ads/wizard/PropertyDetailsStep';
import AICopyAssistStep from '@/components/ads/wizard/AICopyAssistStep';
import PlatformTemplateStep from '@/components/ads/wizard/PlatformTemplateStep';
import AudienceBudgetStep from '@/components/ads/wizard/AudienceBudgetStep';
import ReviewLaunchStep from '@/components/ads/wizard/ReviewLaunchStep';
import AdPreviewPane from '@/components/ads/wizard/AdPreviewPane';
import type { AdPreviewPlatform } from '@/components/ads/AdPreviewMockup';
import {
  createEmptyDraft,
  getEffectiveCopy,
  getPrimaryImage,
  listingRequiredForAdType,
  WIZARD_STEPS,
  type AdDraft,
  type WizardStepKey,
} from '@/lib/ads/ad-draft-types';
import { loadAdDraft, saveAdDraft, clearAdDraft } from '@/lib/ads/ad-draft-storage';
import { getDefaultCtaForAdType } from '@/lib/ads/ad-type-config';
import { applyInsightSeeds } from '@/lib/ads/insight-seeds';
import type { AIInsight } from '@/lib/ads/performance-types';
import { tabPanelTransition, useMotionReduced } from '@/lib/motion';
import { useApi } from '@/lib/swr';
import { isValidDailyBudget, isValidDuration } from '@/lib/ads/promotion-options';

interface AgentProfilePayload {
  profile_photo_url?: string | null;
}

interface WizardShellProps {
  initialProjectId?: string | null;
  metaConnected: boolean;
  metaReady: boolean;
  googleConnected: boolean;
  googleReady: boolean;
  onConnectMeta: () => void;
  connectingMeta: boolean;
  onLaunched?: () => void;
  onMessage?: (message: { type: 'success' | 'error'; text: string } | null) => void;
}

function stepIndex(key: WizardStepKey): number {
  return WIZARD_STEPS.findIndex((s) => s.key === key);
}

export default function WizardShell({
  initialProjectId,
  metaConnected,
  metaReady,
  googleConnected,
  googleReady,
  onConnectMeta,
  connectingMeta,
  onLaunched,
  onMessage,
}: WizardShellProps) {
  const reduced = useMotionReduced();
  const { response: profileResponse } = useApi<AgentProfilePayload | null>('/api/agent-profile');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draft, setDraft] = useState<AdDraft>(() => {
    const saved = loadAdDraft();
    if (saved) return saved;
    const d = createEmptyDraft();
    if (initialProjectId) {
      d.projectId = initialProjectId;
      d.adType = 'new_listing';
    }
    return d;
  });

  const [currentStep, setCurrentStep] = useState<WizardStepKey>(
    initialProjectId ? 'details' : 'type'
  );
  const [maxStepIndex, setMaxStepIndex] = useState(() =>
    initialProjectId ? stepIndex('details') : 0
  );
  const [previewPlatform, setPreviewPlatform] = useState<AdPreviewPlatform>('facebook');
  const [launching, setLaunching] = useState(false);
  const [draftSavedHint, setDraftSavedHint] = useState(false);
  const [insightNote, setInsightNote] = useState<string | null>(null);
  const insightApplied = useRef(false);

  const { data: wizardInsights = [] } = useApi<AIInsight[]>('/api/ads/insights?forWizard=1');

  const advertiserName = (profileResponse?.fullName as string | undefined) || 'Your listing';
  const advertiserAvatar = profileResponse?.data?.profile_photo_url ?? null;

  const patchDraft = useCallback((patch: Partial<AdDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch, status: 'draft' }));
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAdDraft(draft);
      setDraftSavedHint(true);
      setTimeout(() => setDraftSavedHint(false), 2000);
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft]);

  useEffect(() => {
    if (insightApplied.current || wizardInsights.length === 0) return;
    insightApplied.current = true;
    setDraft((prev) => {
      const result = applyInsightSeeds(prev, wizardInsights);
      if (!result) return prev;
      setInsightNote(result.note);
      return { ...prev, ...result.draftPatch, status: 'draft' as const };
    });
  }, [wizardInsights]);

  const currentIndex = stepIndex(currentStep);
  const stepMeta = WIZARD_STEPS[currentIndex];

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'type':
        return Boolean(draft.adType);
      case 'details':
        if (draft.images.length === 0) {
          if (draft.adType && listingRequiredForAdType(draft.adType) && !draft.projectId) {
            const hasManual = draft.propertyDetails.address;
            if (!hasManual) return false;
          }
          return false;
        }
        return true;
      case 'copy':
        return true;
      case 'platform':
        return draft.platforms.length > 0;
      case 'audience':
        return (
          isValidDailyBudget(draft.budget.dailyAmountCents) &&
          isValidDuration(draft.budget.durationDays)
        );
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentStep, draft]);

  const goToStep = (key: WizardStepKey) => {
    setCurrentStep(key);
    setMaxStepIndex((m) => Math.max(m, stepIndex(key)));
  };

  const goNext = () => {
    if (!canProceed) return;
    const next = WIZARD_STEPS[currentIndex + 1];
    if (next) goToStep(next.key);
  };

  const goBack = () => {
    const prev = WIZARD_STEPS[currentIndex - 1];
    if (prev) setCurrentStep(prev.key);
  };

  const handleAdType = (adType: AdDraft['adType']) => {
    patchDraft({
      adType,
      cta: adType ? getDefaultCtaForAdType(adType) : draft.cta,
    });
  };

  const handleSaveDraft = () => {
    saveAdDraft(draft);
    onMessage?.({ type: 'success', text: 'Draft saved — pick up anytime from this device.' });
  };

  const handleLaunch = async () => {
    const { headline, body } = getEffectiveCopy(draft);
    const imageUrl = getPrimaryImage(draft);

    if (!headline || !body || !imageUrl) {
      onMessage?.({ type: 'error', text: 'Add a photo, headline, and message before publishing.' });
      return;
    }

    if (draft.platforms.includes('meta') && !metaConnected) {
      onConnectMeta();
      return;
    }

    if (!draft.platforms.includes('meta')) {
      onMessage?.({
        type: 'error',
        text: 'Meta publishing is available now. Google Ads publishing is coming soon.',
      });
      return;
    }

    setLaunching(true);
    onMessage?.(null);
    try {
      const res = await fetch('/api/ads/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: draft.projectId,
          adType: draft.adType,
          propertyDetails: draft.propertyDetails,
          images: draft.images,
          dailyBudgetCents: draft.budget.dailyAmountCents,
          durationDays: draft.budget.durationDays,
          headline,
          primaryText: body,
          imageUrl,
          audiencePreset: draft.audience.preset,
          callToAction: draft.cta,
          ageMin: draft.audience.ageMin,
          ageMax: draft.audience.ageMax,
        }),
      });
      const json = await res.json();
      if (json.success) {
        clearAdDraft();
        setDraft(createEmptyDraft());
        setCurrentStep('type');
        setMaxStepIndex(0);
        onMessage?.({
          type: 'success',
          text: json.message || 'Your ad is live. Leads will show up in your inbox.',
        });
        onLaunched?.();
      } else {
        onMessage?.({ type: 'error', text: json.error || 'Could not publish the ad.' });
      }
    } catch {
      onMessage?.({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLaunching(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return <AdTypeSelector value={draft.adType} onChange={handleAdType} />;
      case 'details':
        return <PropertyDetailsStep draft={draft} onChange={patchDraft} />;
      case 'copy':
        return <AICopyAssistStep draft={draft} onChange={patchDraft} />;
      case 'platform':
        return (
          <PlatformTemplateStep
            draft={draft}
            onChange={patchDraft}
            metaConnected={metaConnected}
            metaReady={metaReady}
            googleConnected={googleConnected}
            googleReady={googleReady}
          />
        );
      case 'audience':
        return <AudienceBudgetStep draft={draft} onChange={patchDraft} />;
      case 'review':
        return (
          <ReviewLaunchStep
            draft={draft}
            advertiserName={advertiserName}
            advertiserAvatar={advertiserAvatar}
            metaConnected={metaConnected}
            metaReady={metaReady}
            googleConnected={googleConnected}
            googleReady={googleReady}
            launching={launching}
            onLaunch={() => void handleLaunch()}
            onSaveDraft={handleSaveDraft}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {insightNote && (
        <div className="rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3 text-[12.5px] text-brand-900 mb-4">
          {insightNote}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
      <StepSidebar
        currentStep={currentStep}
        maxStepIndex={maxStepIndex}
        onStepClick={goToStep}
      />

      <Surface flat padding="md" className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-mono text-gray-450 uppercase tracking-wide">
              Step {currentIndex + 1} of {WIZARD_STEPS.length}
            </p>
            <h2 className="text-[15px] font-semibold text-gray-900 mt-0.5">{stepMeta.label}</h2>
          </div>
          {draftSavedHint && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -4 }}
            transition={reduced ? { duration: 0.01 } : tabPanelTransition}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {currentStep !== 'review' && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 border-t border-gray-150">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={currentIndex === 0}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                Save draft
              </Button>
              <Button size="sm" onClick={goNext} disabled={!canProceed} className="gap-1.5">
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Surface>

      {currentStep !== 'review' && (
        <AdPreviewPane
          draft={draft}
          advertiserName={advertiserName}
          advertiserAvatar={advertiserAvatar}
          previewPlatform={previewPlatform}
          onPreviewPlatformChange={setPreviewPlatform}
        />
      )}
    </div>
    </>
  );
}
