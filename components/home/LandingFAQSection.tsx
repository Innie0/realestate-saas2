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
  card = false,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  card?: boolean;
}) {
  const toggleIcon = (
    <span
      className={clsx(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-lg leading-none tabular-nums transition-colors',
        card
          ? 'border border-white/25 bg-white/10 text-white group-hover:border-white/40 group-hover:bg-white/[0.16]'
          : 'mt-0.5 text-white/60',
      )}
      aria-hidden
    >
      {isOpen ? '−' : '+'}
    </span>
  );

  const answerBlock = (
    <div
      className={clsx(
        'grid transition-[grid-template-rows] duration-300 ease-out',
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="overflow-hidden">
        <p
          className={clsx(
            'text-base leading-[1.65] text-white/75',
            card ? 'pt-4' : 'pb-6 pr-8',
          )}
        >
          {answer}
        </p>
      </div>
    </div>
  );

  if (card) {
    return (
      <div
        data-reveal
        className="group rounded-[18px] bg-white/10 p-7 transition-colors hover:bg-white/[0.14] sm:p-8"
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-5 text-left"
        >
          <span className="text-lg font-semibold leading-snug text-white sm:text-[19px]">
            {question}
          </span>
          {toggleIcon}
        </button>
        {answerBlock}
      </div>
    );
  }

  return (
    <div data-reveal className="border-b border-white/15">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:opacity-80"
      >
        <span className="text-base font-medium leading-snug text-white">{question}</span>
        {toggleIcon}
      </button>
      {answerBlock}
    </div>
  );
}

export default function LandingFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#0668E1] py-24 text-white lg:py-32">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <LandingStaggerReveal className="mx-auto mb-14 max-w-2xl text-center">
          <p data-reveal className="text-xs font-medium uppercase tracking-[0.14em] text-white/70">
            FAQ
          </p>
          <h2
            data-reveal
            className="font-display mt-4 text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl"
          >
            Common questions
          </h2>
          <p data-reveal className="mt-4 text-base leading-[1.65] text-white/75">
            Straight answers about trials, billing, and how Oikaro handles your client data.
          </p>
        </LandingStaggerReveal>

        <LandingStaggerReveal className="mx-auto max-w-2xl" stagger={0.05}>
          {MARKETING_FAQ_ITEMS.map((item, index) => (
            <div key={item.question} className={index === 0 ? 'mb-5' : undefined}>
              <FAQItem
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                card={index === 0}
              />
            </div>
          ))}
        </LandingStaggerReveal>
      </div>
    </section>
  );
}
