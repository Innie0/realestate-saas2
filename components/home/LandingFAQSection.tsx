'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { MARKETING_FAQ_ITEMS } from '@/lib/marketing-faq';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

function FAQItem({
  question,
  answer,
  delay = 0,
  isOpen,
  onToggle,
  reduced,
}: {
  question: string;
  answer: string;
  delay?: number;
  isOpen: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      {...mktEnterReveal(reduced, delay)}
      className="overflow-hidden"
      style={{
        borderRadius: MKT.radius.card,
        border: `1px solid ${MKT.border}`,
        backgroundColor: MKT.surface,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-black/[0.02]"
      >
        <span className="font-medium" style={{ color: MKT.textPrimary }}>
          {question}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-5 w-5 shrink-0" style={{ color: MKT.textSecondary }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p
              className="px-6 pb-5 text-base leading-[1.6]"
              style={{ color: MKT.textSecondary }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingFAQSection() {
  const reduced = useMotionReduced();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative z-10 border-t py-24 lg:py-32"
      style={{ borderColor: MKT.border, backgroundColor: MKT.background }}
    >
      <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <motion.div
          {...mktEnterReveal(reduced)}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p
            className="mb-4 text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: MKT.textSecondary }}
          >
            FAQ
          </p>
          <h2
            className="font-sans text-3xl font-medium tracking-[-0.02em] sm:text-4xl lg:text-5xl"
            style={{ color: MKT.textPrimary }}
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg leading-[1.6]" style={{ color: MKT.textSecondary }}>
            Everything you need to know about Oikaro.
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl space-y-3">
          {MARKETING_FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              delay={index * 0.04}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              reduced={reduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
