'use client';

import { useEffect, useState } from 'react';

export const LANDING_TYPING_EXAMPLES = [
  'Generate a listing description for 456 Oak Ave',
  'Run a CMA for 123 Maple St',
  'Draft a follow-up email for Sarah Chen',
  'Schedule a showing for tomorrow at 2pm',
] as const;

const TYPE_SPEED = 45;
const DELETE_SPEED = 25;
const PAUSE_AFTER_TYPE = 1600;
const PAUSE_AFTER_DELETE = 300;

export function useLandingTypingLoop() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  useEffect(() => {
    const current = LANDING_TYPING_EXAMPLES[exampleIndex];

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
        setExampleIndex((i) => (i + 1) % LANDING_TYPING_EXAMPLES.length);
        setPhase('typing');
      }, PAUSE_AFTER_DELETE);
      return () => clearTimeout(t);
    }
  }, [text, phase, exampleIndex]);

  return text;
}
