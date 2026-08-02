'use client';

import Image from 'next/image';
import { TESTIMONIALS } from '@/lib/landing-showcase';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';

const TESTIMONIAL_BACKGROUNDS = [
  '/landing/hero-mountains.jpg',
  '/landing/mesh/mesh-cobalt-1080.webp',
  '/landing/mesh/mesh-teal-1080.webp',
] as const;

export default function LandingTestimonials() {
  return (
    <section className="bg-[#F7F5F1] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <LandingStaggerReveal>
          <div className="mb-10 max-w-2xl sm:mb-12">
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-[#1C1D22] sm:text-4xl">
              Agents who switched stay for the workflow
            </h2>
            <p className="mt-3 text-base text-[#6B6D76] sm:text-lg">
              Real results from agents using Realestic every day.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
            {TESTIMONIALS.map((testimonial, index) => (
              <article
                key={testimonial.id}
                className="relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-[1.25rem] sm:min-h-[400px]"
              >
                <Image
                  src={TESTIMONIAL_BACKGROUNDS[index % TESTIMONIAL_BACKGROUNDS.length]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(53, 72, 199, 0.55) 0%, rgba(28, 29, 34, 0.88) 100%)',
                  }}
                />
                <div className="relative z-10 flex flex-col justify-end p-6 sm:p-7">
                  <blockquote className="text-lg font-semibold leading-snug tracking-[-0.02em] text-white sm:text-xl">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-5 border-t border-white/20 pt-4">
                    <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="mt-1 text-sm text-white/75">{testimonial.role}</p>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </LandingStaggerReveal>
      </div>
    </section>
  );
}
