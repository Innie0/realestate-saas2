'use client';

import { useLandingTypingLoop } from '@/lib/use-landing-typing-loop';

export function LandingTypingDemo() {
  const text = useLandingTypingLoop();

  return (
    <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-sm">
      <p className="mb-2 text-xs uppercase tracking-wide text-black/40">AI Assistant</p>
      <div className="flex min-h-[28px] items-center">
        <span className="text-base text-black/80">{text}</span>
        <span className="ml-0.5 h-5 w-[2px] animate-pulse bg-[#0668E1]" />
      </div>
    </div>
  );
}
