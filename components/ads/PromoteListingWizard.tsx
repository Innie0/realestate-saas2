'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Loader2,
  Megaphone,
  RotateCcw,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Surface from '@/components/ui/Surface';
import AdPreviewMockup, { type AdPreviewPlatform } from '@/components/ads/AdPreviewMockup';
import { useApi } from '@/lib/swr';
import { formatListingAddress, formatListingPrice, normalizeProjectImages } from '@/lib/listing-utils';
import { buildListingAdCopy, isProjectPromotable } from '@/lib/ads/listing-ad-copy';
import {
  AUDIENCE_PRESETS,
  BUDGET_PRESETS_CENTS,
  DURATION_OPTIONS,
  CTA_OPTIONS,
  type AdCtaType,
  type AudiencePresetId,
  MAX_DAILY_BUDGET_CENTS,
  MIN_DAILY_BUDGET_CENTS,
} from '@/lib/ads/promotion-options';
import { EASE_OUT, pageVariants, useMotionReduced } from '@/lib/motion';
import type { Project } from '@/types';
import clsx from 'clsx';

interface AgentProfilePayload {
  profile_photo_url?: string | null;
}

interface PromoteListingWizardProps {
  initialProjectId?: string | null;
  metaConnected: boolean;
  onConnectMeta: () => void;
  connectingMeta: boolean;
  onLaunched?: () => void;
  onMessage?: (message: { type: 'success' | 'error'; text: string }) => void;
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="text-label mb-2 flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-gray-450" strokeWidth={1.75} />
      {children}
    </p>
  );
}

export default function PromoteListingWizard({
  initialProjectId,
  metaConnected,
  onConnectMeta,
  connectingMeta,
  onLaunched,
  onMessage,
}: PromoteListingWizardProps) {
  const reduced = useMotionReduced();
  const { data: projects = [], isLoading: projectsLoading } = useApi<Project[]>('/api/projects');
  const { response: profileResponse } = useApi<AgentProfilePayload | null>('/api/agent-profile');

  const [selectedId, setSelectedId] = useState<string | null>(initialProjectId ?? null);
  const [previewPlatform, setPreviewPlatform] = useState<AdPreviewPlatform>('facebook');
  const [showCustomize, setShowCustomize] = useState(false);
  const [headline, setHeadline] = useState('');
  const [primaryText, setPrimaryText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cta, setCta] = useState<AdCtaType>('LEARN_MORE');
  const [audiencePreset, setAudiencePreset] = useState<AudiencePresetId>('near_home');
  const [dailyBudgetCents, setDailyBudgetCents] = useState(2000);
  const [customBudget, setCustomBudget] = useState('');
  const [useCustomBudget, setUseCustomBudget] = useState(false);
  const [durationDays, setDurationDays] = useState(7);
  const [launching, setLaunching] = useState(false);

  const promotableProjects = useMemo(
    () => projects.filter((p) => isProjectPromotable(p).ok),
    [projects]
  );

  const effectiveProjectId = selectedId ?? initialProjectId ?? null;
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === effectiveProjectId) ?? null,
    [projects, effectiveProjectId]
  );

  const listingImages = useMemo(
    () => (selectedProject ? normalizeProjectImages(selectedProject.images) : []),
    [selectedProject]
  );

  const applyListingDefaults = useCallback((project: Project) => {
    const copy = buildListingAdCopy(project);
    setHeadline(copy.headline);
    setPrimaryText(copy.primaryText);
    setImageUrl(copy.imageUrl);
    setAudiencePreset(copy.zip ? 'near_home' : 'city');
  }, []);

  useEffect(() => {
    if (selectedProject) {
      applyListingDefaults(selectedProject);
    }
  }, [selectedProject, applyListingDefaults]);

  useEffect(() => {
    if (initialProjectId && !selectedId) {
      setSelectedId(initialProjectId);
    }
  }, [initialProjectId, selectedId]);

  const effectiveBudgetCents = useMemo(() => {
    if (useCustomBudget && customBudget.trim()) {
      const dollars = parseFloat(customBudget.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(dollars)) return dailyBudgetCents;
      return Math.round(dollars * 100);
    }
    return dailyBudgetCents;
  }, [useCustomBudget, customBudget, dailyBudgetCents]);

  const budgetValid =
    effectiveBudgetCents >= MIN_DAILY_BUDGET_CENTS &&
    effectiveBudgetCents <= MAX_DAILY_BUDGET_CENTS;

  const totalSpend = (effectiveBudgetCents / 100) * durationDays;
  const resolvedAdvertiserName = (profileResponse?.fullName as string | undefined) || 'Your listing';
  const advertiserAvatar = profileResponse?.data?.profile_photo_url ?? null;

  const audienceDescription = useMemo(() => {
    if (!selectedProject) return '';
    const info = selectedProject.property_info || {};
    const city = info.city?.trim();
    const zip = info.zip_code?.trim();
    if (audiencePreset === 'near_home') return zip ? `Targeting near ${zip}` : 'Targeting near the listing';
    if (audiencePreset === 'city') return city ? `Targeting ${city}` : 'Targeting the listing city';
    return 'Broader regional reach';
  }, [audiencePreset, selectedProject]);

  const handleLaunch = async () => {
    if (!effectiveProjectId) {
      onMessage?.({ type: 'error', text: 'Choose a listing to promote.' });
      return;
    }
    if (!headline.trim() || !primaryText.trim() || !imageUrl) {
      onMessage?.({ type: 'error', text: 'Add a photo, headline, and message before launching.' });
      return;
    }
    if (!budgetValid) {
      onMessage?.({
        type: 'error',
        text: `Daily budget must be between $${MIN_DAILY_BUDGET_CENTS / 100} and $${MAX_DAILY_BUDGET_CENTS / 100}.`,
      });
      return;
    }
    if (!metaConnected) {
      onConnectMeta();
      return;
    }

    setLaunching(true);
    try {
      const res = await fetch('/api/ads/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: effectiveProjectId,
          dailyBudgetCents: effectiveBudgetCents,
          durationDays,
          headline: headline.trim(),
          primaryText: primaryText.trim(),
          imageUrl,
          audiencePreset,
          callToAction: cta,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onMessage?.({
          type: 'success',
          text: json.message || 'Your listing ad is live. Leads will show up in your inbox.',
        });
        onLaunched?.();
      } else {
        onMessage?.({ type: 'error', text: json.error || 'Could not launch the ad.' });
      }
    } catch {
      onMessage?.({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLaunching(false);
    }
  };

  const MotionWrap = reduced ? 'div' : motion.div;
  const motionProps = reduced ? {} : { variants: pageVariants, initial: 'initial' as const, animate: 'animate' as const };

  return (
    <MotionWrap {...motionProps}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        <Surface flat padding="md" className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-500 text-white">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Create your ad</h2>
              <p className="text-caption text-gray-500 mt-1 max-w-xl">
                Choose a listing, tweak the creative, set budget — we handle the Meta setup for you.
              </p>
            </div>
          </div>

          <div>
            <SectionLabel icon={Megaphone}>Listing</SectionLabel>
            {projectsLoading ? (
              <p className="text-caption text-gray-500">Loading your listings…</p>
            ) : promotableProjects.length === 0 ? (
              <p className="text-[13px] text-gray-600 rounded-lg border border-dashed border-gray-200 px-4 py-3">
                Publish a listing with photos and an address first, then come back to promote it.
              </p>
            ) : (
              <div className="grid gap-2 max-h-44 overflow-y-auto pr-1">
                {promotableProjects.map((project) => {
                  const info = project.property_info || {};
                  const address = formatListingAddress(info, project.title);
                  const price = formatListingPrice(info.price);
                  const thumb = normalizeProjectImages(project.images)[0];
                  const isSelected = effectiveProjectId === project.id;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedId(project.id)}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      )}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="44px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Megaphone className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-gray-900 truncate">{address}</p>
                        <p className="text-[12px] text-gray-500 tabular-nums">{price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedProject && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setShowCustomize((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Customize ad creative</p>
                  <p className="text-caption text-gray-500 mt-0.5">Photo, headline, message & button</p>
                </div>
                <ChevronDown
                  className={clsx(
                    'h-4 w-4 text-gray-400 transition-transform duration-200',
                    showCustomize && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {showCustomize && (
                  <motion.div
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-1 pb-1">
                      {listingImages.length > 1 && (
                        <div>
                          <p className="text-[12px] font-medium text-gray-600 mb-2">Photo</p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {listingImages.map((url) => (
                              <button
                                key={url}
                                type="button"
                                onClick={() => setImageUrl(url)}
                                className={clsx(
                                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                                  imageUrl === url
                                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                                    : 'border-gray-200 hover:border-gray-300'
                                )}
                              >
                                <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="ad-headline" className="text-[12px] font-medium text-gray-600">
                            Headline
                          </label>
                          {selectedProject && (
                            <button
                              type="button"
                              onClick={() => applyListingDefaults(selectedProject)}
                              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-600 hover:text-brand-700"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </button>
                          )}
                        </div>
                        <Input
                          id="ad-headline"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value.slice(0, 100))}
                          placeholder="123 Main St — $450.000"
                        />
                      </div>

                      <div>
                        <label htmlFor="ad-text" className="text-[12px] font-medium text-gray-600 mb-1.5 block">
                          Message
                        </label>
                        <textarea
                          id="ad-text"
                          value={primaryText}
                          onChange={(e) => setPrimaryText(e.target.value.slice(0, 250))}
                          rows={3}
                          placeholder="Tell buyers why they'll love this home…"
                          className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/40 resize-none"
                        />
                        <p className="text-[11px] text-gray-450 mt-1">{primaryText.length}/250</p>
                      </div>

                      <div>
                        <p className="text-[12px] font-medium text-gray-600 mb-2">Button</p>
                        <div className="flex flex-wrap gap-2">
                          {CTA_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setCta(opt.id)}
                              className={clsx(
                                'rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                                cta === opt.id
                                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <SectionLabel icon={Users}>Who should see it?</SectionLabel>
                <div className="grid gap-2 sm:grid-cols-3">
                  {AUDIENCE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAudiencePreset(preset.id)}
                      className={clsx(
                        'rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                        audiencePreset === preset.id
                          ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      )}
                    >
                      <p className="text-[12.5px] font-medium text-gray-900">{preset.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{preset.description}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-450 mt-2">{audienceDescription}</p>
              </div>

              <div>
                <SectionLabel icon={Wallet}>Budget & schedule</SectionLabel>
                <div className="flex flex-wrap gap-2 mb-3">
                  {BUDGET_PRESETS_CENTS.map((cents) => (
                    <button
                      key={cents}
                      type="button"
                      onClick={() => {
                        setUseCustomBudget(false);
                        setDailyBudgetCents(cents);
                      }}
                      className={clsx(
                        'rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
                        !useCustomBudget && dailyBudgetCents === cents
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      ${cents / 100}/day
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-36">
                    <Input
                      label="Custom $/day"
                      value={customBudget}
                      onChange={(e) => {
                        setCustomBudget(e.target.value);
                        setUseCustomBudget(true);
                      }}
                      placeholder="25"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pb-0.5">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setDurationDays(opt.days)}
                        className={clsx(
                          'rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
                          durationDays === opt.days
                            ? 'border-brand-500 bg-brand-50 text-brand-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className={clsx('text-[12px] mt-2', budgetValid ? 'text-gray-500' : 'text-red-600')}>
                  Estimated spend:{' '}
                  <span className="font-medium text-gray-700 tabular-nums">
                    ${budgetValid ? totalSpend.toLocaleString('en-US') : '—'}
                  </span>{' '}
                  total · billed to your Meta account
                </p>
              </div>

              {!metaConnected ? (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                  <p className="text-[13px] text-indigo-900 font-medium">Connect Meta to launch</p>
                  <p className="text-[12px] text-indigo-700/80 mt-1">
                    Preview your ad now — connect Meta when you&apos;re ready to go live.
                  </p>
                  <Button size="sm" className="mt-3" onClick={onConnectMeta} disabled={connectingMeta}>
                    {connectingMeta && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    Connect Meta Ads
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleLaunch}
                  disabled={
                    launching ||
                    !effectiveProjectId ||
                    promotableProjects.length === 0 ||
                    !budgetValid
                  }
                  className="w-full sm:w-auto gap-2"
                >
                  {launching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Launching your ad…
                    </>
                  ) : (
                    <>
                      <Megaphone className="h-4 w-4" />
                      Launch ad
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          )}
        </Surface>

        <AdPreviewMockup
          platform={previewPlatform}
          onPlatformChange={setPreviewPlatform}
          imageUrl={imageUrl}
          headline={headline}
          primaryText={primaryText}
          cta={cta}
          advertiserName={resolvedAdvertiserName}
          advertiserAvatar={advertiserAvatar}
          emptyHint={
            selectedProject ? undefined : 'Select a listing on the left to preview your ad'
          }
        />
      </div>
    </MotionWrap>
  );
}
