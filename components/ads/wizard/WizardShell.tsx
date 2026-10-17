'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import StepSidebar from '@/components/ads/wizard/StepSidebar';
import AdTypeSelector from '@/components/ads/wizard/AdTypeSelector';
import PropertyDetailsStep from '@/components/ads/wizard/PropertyDetailsStep';
import CustomIdeaStep from '@/components/ads/wizard/CustomIdeaStep';
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
  getDraftDestination,
  isValidDestinationUrl,
  DEFAULT_AD_DESTINATION,
} from '@/lib/ads/ad-draft-types';
import { loadAdDraft, saveAdDraft, clearAdDraft } from '@/lib/ads/ad-draft-storage';
import {
  getAdTypeOption,
  getDefaultCtaForAdType,
  isPlatformAllowedForAdType,
  PLATFORM_AVAILABLE,
} from '@/lib/ads/ad-type-config';
import { applyInsightSeeds } from '@/lib/ads/insight-seeds';
import type { AIInsight } from '@/lib/ads/performance-types';
import { tabPanelTransition, useMotionReduced } from '@/lib/motion';
import { useApi } from '@/lib/swr';
import { DURATION_OPTIONS, isValidDailyBudget, isValidDuration } from '@/lib/ads/promotion-options';
import type { AdPlatform } from '@/lib/ads/types';

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
        // A listing ad needs a listing or at least an address; photos are only needed for Meta
        if (draft.adType && listingRequiredForAdType(draft.adType) && !draft.projectId) {
          return Boolean(draft.propertyDetails.address);
        }
        // Your own idea: reviewed, and runnable somewhere that's available
        if (draft.adType === 'custom') {
          const review = draft.customIdea?.review;
          return Boolean(review) && (review!.google.suitable || PLATFORM_AVAILABLE.meta);
        }
        // Ads about the agent target the city they serve
        if (draft.adType === 'home_value' || draft.adType === 'agent_branding') {
          return Boolean(String(draft.propertyDetails.city ?? '').trim());
        }
        return true;
      case 'copy':
        return true;
      case 'platform': {
        const destination = getDraftDestination(draft);
        return (
          draft.platforms.length > 0 &&
          (destination.type !== 'custom' || isValidDestinationUrl(destination.customUrl)) &&
          (destination.type !== 'open_house' || Boolean(destination.openHouseId))
        );
      }
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

  const readyPlatforms: AdPlatform[] = [
    ...(googleReady ? (['google'] as const) : []),
    ...(metaReady ? (['meta'] as const) : []),
  ];

  const handleAdType = (adType: AdDraft['adType']) => {
    const option = getAdTypeOption(adType);
    const changed = adType !== draft.adType;
    // Only the platforms this ad type works on; connected ones first
    const allowed = (option?.platforms ?? []).filter((p) => isPlatformAllowedForAdType(adType, p));
    const platforms = allowed.filter((p) => readyPlatforms.includes(p));
    // Start from the duration closest to what this ad type needs
    const durationDays = option
      ? DURATION_OPTIONS.reduce((best, o) =>
          Math.abs(o.days - option.suggestedDays) < Math.abs(best.days - option.suggestedDays) ? o : best,
        ).days
      : draft.budget.durationDays;

    patchDraft({
      adType,
      cta: adType ? getDefaultCtaForAdType(adType) : draft.cta,
      ...(changed
        ? {
            // A different ad type gets its own recommended destination, platforms, and budget
            destination: { ...DEFAULT_AD_DESTINATION },
            platforms: platforms.length > 0 ? platforms : allowed.slice(0, 1),
            ...(option
              ? { budget: { dailyAmountCents: option.suggestedDailyCents, durationDays } }
              : {}),
          }
        : {}),
    });
  };

  const handleSaveDraft = () => {
    saveAdDraft(draft);
    onMessage?.({ type: 'success', text: 'Draft saved — pick up anytime from this device.' });
  };

  const handleLaunch = async () => {
    const { headline, body } = getEffectiveCopy(draft);
    const imageUrl = getPrimaryImage(draft);

    const wantsMeta = draft.platforms.includes('meta');
    const wantsGoogle = draft.platforms.includes('google');

    if (!headline || !body) {
      onMessage?.({ type: 'error', text: 'Add a headline and message before publishing.' });
      return;
    }

    if (wantsMeta && PLATFORM_AVAILABLE.meta && !metaConnected && !(wantsGoogle && googleReady)) {
      onConnectMeta();
      return;
    }

    // Publish to every selected platform whose ad account is ready
    const targets: AdPlatform[] = [
      ...(wantsMeta && metaReady ? (['meta'] as const) : []),
      ...(wantsGoogle && googleReady ? (['google'] as const) : []),
    ].filter((p) => isPlatformAllowedForAdType(draft.adType, p));

    if (targets.length === 0) {
      onMessage?.({
        type: 'error',
        text: 'Connect an ad account under Ad accounts before publishing.',
      });
      return;
    }

    if (targets.includes('meta') && !imageUrl) {
      onMessage?.({ type: 'error', text: 'Add a photo before publishing to Facebook & Instagram.' });
      return;
    }

    setLaunching(true);
    onMessage?.(null);
    try {
      const published: string[] = [];
      const failures: string[] = [];

      for (const platform of targets) {
        const label = platform === 'google' ? 'Google' : 'Meta';
        const res = await fetch('/api/ads/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
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
            radiusMiles: draft.audience.radiusMiles,
            destinationType: getDraftDestination(draft).type,
            destinationUrl: getDraftDestination(draft).customUrl.trim(),
            openHouseId: getDraftDestination(draft).openHouseId ?? null,
            customKeywords: draft.customIdea?.review?.google.keywords ?? [],
            // Remember a pasted listing link on the listing for next time
            saveListingLink: listingRequiredForAdType(draft.adType) && Boolean(draft.projectId),
            callToAction: draft.cta,
            ageMin: draft.audience.ageMin,
            ageMax: draft.audience.ageMax,
          }),
        });
        const json = await res.json().catch(() => null);
        if (json?.success) published.push(label);
        else failures.push(`${label}: ${json?.error || 'Could not publish the ad.'}`);
      }

      if (published.length > 0) {
        clearAdDraft();
        setDraft(createEmptyDraft());
        setCurrentStep('type');
        setMaxStepIndex(0);
        onLaunched?.();
      }

      if (failures.length === 0) {
        onMessage?.({
          type: 'success',
          text: `Your ad is live on ${published.join(' and ')}. Leads will show up in your inbox.`,
        });
      } else if (published.length > 0) {
        onMessage?.({
          type: 'error',
          text: `Published on ${published.join(' and ')}, but not everywhere. ${failures.join(' ')}`,
        });
      } else {
        onMessage?.({ type: 'error', text: failures.join(' ') });
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
        return (
          <AdTypeSelector value={draft.adType} onChange={handleAdType} readyPlatforms={readyPlatforms} />
        );
      case 'details':
        return draft.adType === 'custom' ? (
          <CustomIdeaStep draft={draft} onChange={patchDraft} />
        ) : (
          <PropertyDetailsStep draft={draft} onChange={patchDraft} />
        );
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

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start 2xl:grid-cols-[220px_minmax(0,1fr)_minmax(280px,320px)]">
      <div className="min-w-0 lg:col-span-full 2xl:col-auto">
        <StepSidebar
          currentStep={currentStep}
          maxStepIndex={maxStepIndex}
          onStepClick={goToStep}
        />
      </div>

      <Card className="p-5 sm:p-6 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-mono text-gray-600 uppercase tracking-wide">
              Step {currentIndex + 1} of {WIZARD_STEPS.length}
            </p>
            <h2 className="text-[15px] font-semibold text-gray-900 mt-0.5">
              {currentStep === 'details' && draft.adType === 'custom' ? 'Your idea' : stepMeta.label}
            </h2>
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
      </Card>

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
