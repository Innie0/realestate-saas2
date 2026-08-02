'use client';

import { useEffect, useState } from 'react';

const EXAMPLES = [
  'Generate a listing description for 456 Oak Ave',
  'Find leads in Austin with a hot score',
  'Run a CMA for 123 Maple St',
  'Draft a follow-up email for Sarah Chen',
  'Schedule a showing for tomorrow at 2pm',
];

const TYPE_SPEED = 45;
const DELETE_SPEED = 25;
const PAUSE_AFTER_TYPE = 1600;
const PAUSE_AFTER_DELETE = 300;

export function LandingTypingDemo() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  useEffect(() => {
    const current = EXAMPLES[exampleIndex];

    if (phase === 'typing') {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), TYPE_SPEED);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('pausing'), PAUSE_AFTER_TYPE);
      return () => clearTimeout(t);
    }

    if (phase === 'pausing') {
      const t = setTimeout(() => setPhase('deleting'), PAUSE_AFTER_TYPE);
      return () => clearTimeout(t);
    }

    if (phase === 'deleting') {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), DELETE_SPEED);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setExampleIndex((i) => (i + 1) % EXAMPLES.length);
        setPhase('typing');
      }, PAUSE_AFTER_DELETE);
      return () => clearTimeout(t);
    }
  }, [text, phase, exampleIndex]);

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
