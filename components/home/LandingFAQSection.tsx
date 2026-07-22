'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { MARKETING_FAQ_ITEMS } from '@/lib/marketing-faq';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div data-reveal className="border-b border-mkt-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:opacity-80"
      >
        <span className="text-base font-medium leading-snug text-mkt-foreground">{question}</span>
        <span
          className="mt-0.5 shrink-0 text-lg leading-none tabular-nums text-mkt-secondary"
          aria-hidden
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div
        className={clsx(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-6 pr-8 text-base leading-[1.65] text-mkt-secondary">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-t border-mkt-border bg-mkt-background py-24 lg:py-32">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <LandingStaggerReveal className="mx-auto mb-14 max-w-2xl text-center">
          <p data-reveal className="text-xs font-medium uppercase tracking-[0.14em] text-mkt-secondary">
            FAQ
          </p>
          <h2
            data-reveal
            className="font-display mt-4 text-3xl font-medium tracking-[-0.03em] text-mkt-foreground sm:text-4xl"
          >
            Common questions
          </h2>
          <p data-reveal className="mt-4 text-base leading-[1.65] text-mkt-secondary">
            Straight answers about trials, billing, and how Oikaro handles your client data.
          </p>
        </LandingStaggerReveal>

        <LandingStaggerReveal className="mx-auto max-w-2xl border-t border-mkt-border" stagger={0.05}>
          {MARKETING_FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </LandingStaggerReveal>
      </div>
    </section>
  );
}
