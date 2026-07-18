'use client';

import { motion } from 'framer-motion';

const ease = [0.25, 0.1, 0.25, 1] as const;

export function ShowcaseAnimationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300/80 bg-white shadow-[0_24px_56px_-20px_rgba(24,24,27,0.18),0_0_0_1px_rgba(24,24,27,0.04)] ring-1 ring-gray-900/[0.05]">
      <div className="relative aspect-[4/3] w-full bg-[#fafafa] p-5 sm:aspect-[16/11] sm:p-6">
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

/** Photos in → description → comps */
export function WinListingAnimation({ reduced }: { reduced: boolean }) {
  return (
    <ShowcaseAnimationFrame>
      <LoopShell reduced={reduced}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.15, duration: 0.35, ease }}
                className="aspect-[4/3] rounded-lg bg-gradient-to-br from-gray-200 to-gray-300"
              />
            ))}
          </div>

          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="space-y-1.5 rounded-xl border border-gray-200 bg-white p-3"
          >
            {[100, 92, 78, 65].map((w, i) => (
              <motion.div
                key={i}
                initial={reduced ? false : { width: 0, opacity: 0 }}
                animate={{ width: `${w}%`, opacity: 1 }}
                transition={{ delay: 0.85 + i * 0.12, duration: 0.35, ease }}
                className="h-2 rounded-full bg-gray-200"
              />
            ))}
            <motion.p
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.35, duration: 0.3 }}
              className="pt-1 text-[10px] font-medium text-brand-600 sm:text-[11px]"
            >
              MLS-ready · Luxury tone
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.4, ease }}
            className="flex gap-2"
          >
            {['$478k', '$495k', '$512k'].map((price) => (
              <div
                key={price}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-center"
              >
                <p className="text-[10px] text-gray-500">Comp</p>
                <p className="text-[12px] font-semibold text-gray-900">{price}</p>
              </div>
            ))}
          </motion.div>
        </div>
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
