'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { LANDING_FEATURE_CARDS, LANDING_TOOL_LINKS } from '@/lib/landing-showcase';
import { SITE_NAME } from '@/lib/site-config';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';

export default function LandingFeatureCards() {
  return (
    <section className="bg-white pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-20 lg:pt-14">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <LandingStaggerReveal>
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            {LANDING_FEATURE_CARDS.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="group relative flex min-h-[240px] flex-col rounded-[1.25rem] border border-[#EAEAEA] bg-white p-6 transition-shadow hover:shadow-[var(--mkt-shadow-soft)] sm:min-h-[260px] sm:p-8"
              >
                <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#6B6D76]">
                  {card.category}
                </p>
                <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(1.65rem,3vw,2.125rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#1C1D22]">
                  {card.headline}
                </h2>
                <span className="absolute bottom-6 right-6 flex size-11 items-center justify-center rounded-full border border-[#EAEAEA] bg-[#F7F5F1] text-[#1C1D22] transition-colors group-hover:border-[#3548C7] group-hover:bg-[#3548C7] group-hover:text-white sm:bottom-8 sm:right-8">
                  <ArrowUpRight className="size-5" strokeWidth={2} />
                </span>
              </Link>
            ))}
          </div>
        </LandingStaggerReveal>

        <div className="mt-14 sm:mt-16">
          <h3 className="font-display text-xl font-bold tracking-[-0.03em] text-[#1C1D22] sm:text-2xl">
            See what {SITE_NAME} can do
          </h3>
          <ul className="mt-4 divide-y divide-[#EAEAEA] rounded-[1rem] border border-[#EAEAEA] bg-white px-4 sm:px-5">
            {LANDING_TOOL_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-4 py-4 transition-colors hover:text-[#3548C7]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F7F5F1] text-[#3548C7]">
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="text-[15px] font-medium text-[#1C1D22] group-hover:text-[#3548C7]">
                        {item.label}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-[#6B6D76] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3548C7]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
