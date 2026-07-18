'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, History, Phone, Mail, Sparkles } from 'lucide-react';

const ease = [0.25, 0.1, 0.25, 1] as const;

export function ShowcaseAnimationFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300/80 bg-white shadow-[0_24px_56px_-20px_rgba(24,24,27,0.18),0_0_0_1px_rgba(24,24,27,0.04)] ring-1 ring-gray-900/[0.05]">
      <div
        className={`relative w-full bg-[#fafafa] p-5 sm:p-6 ${className ?? 'aspect-[4/3] sm:aspect-[16/11]'}`}
      >
        {children}
      </div>
    </div>
  );
}

function LoopShell({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  if (reduced) {
    return <div className="flex h-full flex-col justify-center">{children}</div>;
  }
  return (
    <motion.div
      className="flex h-full flex-col justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

/** AI chat: prompt → reply → action chips */
export function AskOnceAnimation({ reduced }: { reduced: boolean }) {
  return (
    <ShowcaseAnimationFrame>
      <LoopShell reduced={reduced}>
        <div className="space-y-3">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease }}
            className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-gray-900 px-3.5 py-2.5 text-[12px] leading-snug text-white sm:text-[13px]"
          >
            Draft a listing for 123 Oak St and pull comps
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.45, ease }}
            className="max-w-[90%] rounded-2xl rounded-tl-md border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm"
          >
            <p className="text-[11px] font-medium text-brand-600 sm:text-[12px]">Oikaro</p>
            <p className="mt-1 text-[12px] leading-snug text-gray-700 sm:text-[13px]">
              MLS-ready description drafted. 4 comps found — suggested range $485k–$512k.
            </p>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.35 }}
            className="flex flex-wrap gap-2 pt-1"
          >
            {['Create project', 'Schedule follow-up', 'Add to CRM'].map((chip, i) => (
              <motion.span
                key={chip}
                initial={reduced ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.7 + i * 0.12, duration: 0.3 }}
                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-700 sm:text-[11px]"
              >
                {chip}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </LoopShell>
    </ShowcaseAnimationFrame>
  );
}

const LISTING_TONES = ['Luxury', 'Professional', 'Friendly'] as const;

const LISTING_PREVIEW = {
  address: '123 W Main Street',
  headline: 'Sun-drenched retreat in a walkable neighborhood',
  body:
    'Vaulted ceilings, chef\'s kitchen with quartz counters, and a private backyard oasis with mature oaks. Minutes from downtown with top-rated schools nearby.',
  closing: 'Move-in ready — schedule your private showing today.',
};

/** Photos in → description, then switches to property lookup with owner + sale history */
function ListingGenerationPhase({ reduced }: { reduced: boolean }) {
  const photoStyles = [
    'from-amber-100 via-orange-50 to-amber-200',
    'from-sky-100 via-blue-50 to-indigo-100',
    'from-emerald-100 via-green-50 to-teal-100',
  ];

  return (
    <motion.div
      key="listing"
      initial={reduced ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: 12 }}
      transition={{ duration: 0.4, ease }}
      className="space-y-3"
    >
      <div className="grid grid-cols-3 gap-2">
        {photoStyles.map((gradient, i) => (
          <motion.div
            key={gradient}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.1, duration: 0.35, ease }}
            className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br ${gradient}`}
          >
            <div className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-white/40" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35, ease }}
        className="flex flex-wrap items-center gap-1.5"
      >
        <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-gray-500 sm:text-[10px]">
          <Sparkles className="h-3 w-3 text-brand-500" strokeWidth={2} />
          Tone
        </span>
        {LISTING_TONES.map((tone, i) => (
          <motion.span
            key={tone}
            initial={reduced ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.42 + i * 0.08, duration: 0.25 }}
            className={`rounded-full px-2 py-0.5 text-[9px] font-medium sm:text-[10px] ${
              tone === 'Luxury'
                ? 'bg-brand-500 text-white'
                : 'border border-gray-200 bg-white text-gray-600'
            }`}
          >
            {tone}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
      >
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.35, ease }}
          className="text-[10px] font-medium text-gray-500 sm:text-[11px]"
        >
          {LISTING_PREVIEW.address}
        </motion.p>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.35, ease }}
          className="mt-1.5 text-[12px] font-semibold leading-snug text-gray-900 sm:text-[13px]"
        >
          {LISTING_PREVIEW.headline}
        </motion.p>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.35, ease }}
          className="mt-2 text-[11px] leading-relaxed text-gray-700 sm:text-[12px]"
        >
          {LISTING_PREVIEW.body}
        </motion.p>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.12, duration: 0.35, ease }}
          className="mt-2 text-[11px] leading-relaxed text-gray-700 sm:text-[12px]"
        >
          {LISTING_PREVIEW.closing}
        </motion.p>
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.28, duration: 0.3 }}
          className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5"
        >
          <span className="text-[10px] font-medium text-brand-600 sm:text-[11px]">MLS-ready · Luxury tone</span>
          <span className="text-[9px] text-gray-500 sm:text-[10px]">248 words</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function PropertyLookupPhase({ reduced }: { reduced: boolean }) {
  const saleHistory = [
    { date: 'Mar 2019', price: '$485,000', note: 'Arms-length sale' },
    { date: 'Jun 2014', price: '$412,000', note: 'Resale' },
  ];

  return (
    <motion.div
      key="research"
      initial={reduced ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: -12 }}
      transition={{ duration: 0.4, ease }}
      className="space-y-3"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease }}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-500" strokeWidth={2} />
        <p className="text-[11px] font-medium text-gray-900 sm:text-[12px]">123 W Main Street</p>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease }}
        className="rounded-xl border border-gray-200 bg-white p-3"
      >
        <p className="text-[11px] font-semibold text-gray-900 sm:text-[12px]">123 W Main Street</p>
        <p className="mt-1 text-[10px] text-gray-600 sm:text-[11px]">3 bed · 2 bath · 1,840 sqft · Built 2004</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {['Single family', 'Owner-occupied', 'Travis County'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-gray-600 sm:text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.35, ease }}
        className="rounded-xl border border-gray-200 bg-white p-3"
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Owner</p>
            <p className="text-[12px] font-semibold text-gray-900 sm:text-[13px]">Michael & Sarah Chen</p>
            <p className="mt-0.5 text-[10px] text-gray-600 sm:text-[11px]">Mailing address on file · High match confidence</p>
            <div className="mt-2 space-y-1">
              <motion.div
                initial={reduced ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.58, duration: 0.3, ease }}
                className="flex items-center gap-1.5 text-[10px] text-gray-800 sm:text-[11px]"
              >
                <Phone className="h-3 w-3 shrink-0 text-gray-500" strokeWidth={2} />
                <span className="font-medium">(512) 555-0147</span>
                <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[8px] font-semibold text-emerald-700">
                  Mobile
                </span>
              </motion.div>
              <motion.div
                initial={reduced ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3, ease }}
                className="flex items-center gap-1.5 text-[10px] text-gray-800 sm:text-[11px]"
              >
                <Mail className="h-3 w-3 shrink-0 text-gray-500" strokeWidth={2} />
                <span className="truncate font-medium">m.chen@email.com</span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.35, ease }}
        className="rounded-xl border border-gray-200 bg-white p-3"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <History className="h-3 w-3 text-gray-500" strokeWidth={2} />
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-[11px]">
            Sale history
          </p>
        </div>
        <ul className="space-y-2">
          {saleHistory.map((sale, i) => (
            <motion.li
              key={sale.date}
              initial={reduced ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.12, duration: 0.3, ease }}
              className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-[11px] font-medium text-gray-900 sm:text-[12px]">{sale.date}</p>
                <p className="text-[10px] text-gray-500">{sale.note}</p>
              </div>
              <p className="text-[11px] font-semibold text-gray-900 sm:text-[12px]">{sale.price}</p>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export function WinListingAnimation({ reduced }: { reduced: boolean }) {
  const [phase, setPhase] = useState<'listing' | 'research'>(reduced ? 'research' : 'listing');

  useEffect(() => {
    if (reduced) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = (current: 'listing' | 'research') => {
      const delay = current === 'listing' ? 4200 : 4800;
      timeoutId = setTimeout(() => {
        const next = current === 'listing' ? 'research' : 'listing';
        setPhase(next);
        scheduleNext(next);
      }, delay);
    };

    setPhase('listing');
    scheduleNext('listing');

    return () => clearTimeout(timeoutId);
  }, [reduced]);

  return (
    <ShowcaseAnimationFrame className="min-h-[320px] sm:min-h-[360px]">
      <LoopShell reduced={reduced}>
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'listing' ? (
            <ListingGenerationPhase reduced={reduced} key="listing-phase" />
          ) : (
            <PropertyLookupPhase reduced={reduced} key="research-phase" />
          )}
        </AnimatePresence>
      </LoopShell>
    </ShowcaseAnimationFrame>
  );
}

/** Leads arrive scored → move to CRM */
export function NeverLoseLeadAnimation({ reduced }: { reduced: boolean }) {
  const leads = [
    { name: 'Sarah M.', score: 'Hot', color: 'bg-red-100 text-red-700 border-red-200' },
    { name: 'James R.', score: 'Warm', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { name: 'Alex T.', score: 'Cold', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  ];

  return (
    <ShowcaseAnimationFrame>
      <LoopShell reduced={reduced}>
        <div className="space-y-2.5">
          {leads.map((lead, i) => (
            <motion.div
              key={lead.name}
              initial={reduced ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.25, duration: 0.4, ease }}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
            >
              <div>
                <p className="text-[12px] font-semibold text-gray-900 sm:text-[13px]">{lead.name}</p>
                <p className="text-[10px] text-gray-500">Open house · 2BR condo</p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lead.color}`}
              >
                {lead.score}
              </span>
            </motion.div>
          ))}

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4, ease }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/80 px-3 py-2"
          >
            <motion.div
              initial={reduced ? false : { x: -8, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.45, duration: 0.35 }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white"
            >
              ✓
            </motion.div>
            <p className="text-[11px] font-medium text-gray-800 sm:text-[12px]">
              Hot lead added to CRM — follow-up scheduled
            </p>
          </motion.div>
        </div>
      </LoopShell>
    </ShowcaseAnimationFrame>
  );
}

/** Checklist → calendar → pipeline */
export function CloseConfidenceAnimation({ reduced }: { reduced: boolean }) {
  const tasks = ['Offer accepted', 'Inspection scheduled', 'Appraisal ordered'];

  return (
    <ShowcaseAnimationFrame>
      <LoopShell reduced={reduced}>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-2.5 text-[11px] font-semibold text-gray-900 sm:text-[12px]">
              742 Maple Ave · Closing Apr 18
            </p>
            <ul className="space-y-2">
              {tasks.map((task, i) => (
                <motion.li
                  key={task}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.2, duration: 0.35, ease }}
                  className="flex items-center gap-2 text-[11px] text-gray-700 sm:text-[12px]"
                >
                  <motion.span
                    initial={reduced ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.2, type: 'spring', stiffness: 420, damping: 22 }}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] text-white"
                  >
                    ✓
                  </motion.span>
                  {task}
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.4, ease }}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">This week</p>
            <div className="mt-2 flex gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <div
                  key={day}
                  className={`flex-1 rounded-md py-2 text-center text-[10px] ${
                    i === 2 ? 'bg-brand-500 font-semibold text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-600">Showing · 742 Maple Ave · 2:00 PM</p>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.4 }}
          >
            <div className="mb-1 flex justify-between text-[10px] text-gray-600">
              <span>Pipeline</span>
              <span className="font-medium text-gray-900">3 active deals</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <motion.div
                initial={reduced ? false : { width: 0 }}
                animate={{ width: '72%' }}
                transition={{ delay: 1.45, duration: 0.6, ease }}
                className="h-full rounded-full bg-brand-500"
              />
            </div>
          </motion.div>
        </div>
      </LoopShell>
    </ShowcaseAnimationFrame>
  );
}

export type ShowcaseAnimationId =
  | 'ask-once'
  | 'win-listing'
  | 'never-lose-lead'
  | 'close-confidence';

export function ShowcaseAnimation({
  id,
  reduced,
}: {
  id: ShowcaseAnimationId;
  reduced: boolean;
}) {
  switch (id) {
    case 'ask-once':
      return <AskOnceAnimation reduced={reduced} />;
    case 'win-listing':
      return <WinListingAnimation reduced={reduced} />;
    case 'never-lose-lead':
      return <NeverLoseLeadAnimation reduced={reduced} />;
    case 'close-confidence':
      return <CloseConfidenceAnimation reduced={reduced} />;
    default:
      return null;
  }
}
