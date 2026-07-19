'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PLATFORM_HEADLINE, PLATFORM_TOOLS } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';

export default function LandingPlatformStrip() {
  const reduced = useMotionReduced();

  return (
    <section className="relative z-10 border-t border-gray-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
            {PLATFORM_HEADLINE.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {PLATFORM_HEADLINE.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">{PLATFORM_HEADLINE.description}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {PLATFORM_TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={`/products/${tool.id}`}
                className="rounded-full border border-gray-300 bg-[#fafafa] px-3.5 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-white hover:text-gray-900"
              >
                {tool.name}
              </Link>
            ))}
          </div>

          <Link href="/products" className="mt-10 inline-block">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-gray-400 hover:bg-[#fafafa]"
            >
              Explore all products
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
