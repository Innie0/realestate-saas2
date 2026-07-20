'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import {
  PRODUCT_CATEGORIES,
  getProductCardSummary,
  getProductHref,
  getPublishedProducts,
  PRODUCTS_BY_ID,
} from '@/lib/products';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

export default function ProductsIndexClient() {
  const reduced = useMotionReduced();
  const router = useRouter();
  const publishedIds = new Set(getPublishedProducts().map((p) => p.id));

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && PRODUCTS_BY_ID[hash]) {
      router.replace(getProductHref(hash));
    }
  }, [router]);

  return (
    <div className="marketing-root min-h-screen font-sans" style={{ backgroundColor: MKT.background }}>
      <MarketingSubpageHeader />

      <main>
        <section className="border-b py-16 lg:py-24" style={{ borderColor: MKT.border, backgroundColor: MKT.background }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div {...mktEnterReveal(reduced)} className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: MKT.textSecondary }}>
                Products
              </p>
              <h1
                className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl"
                style={{ color: MKT.textPrimary }}
              >
                Everything in Oikaro
              </h1>
              <p className="mt-5 text-lg leading-[1.6]" style={{ color: MKT.textSecondary }}>
                Pick a product to learn how it fits your workflow — listings, leads, CRM, deals, and more.
              </p>
              <Link href="/auth/signup" className="mt-8 inline-block">
                <span
                  className="mkt-cta inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ borderRadius: MKT.radius.button }}
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </div>
        </section>

        {PRODUCT_CATEGORIES.map((category, categoryIndex) => {
          const features = category.featureIds
            .map((id) => PRODUCTS_BY_ID[id])
            .filter((f) => f && publishedIds.has(f.id));

          if (features.length === 0) return null;

          return (
            <section
              key={category.id}
              className="border-b py-16 lg:py-20"
              style={{
                borderColor: MKT.border,
                backgroundColor: MKT.background,
              }}
            >
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mb-10 max-w-2xl">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: MKT.textSecondary }}>
                    {category.label}
                  </p>
                  <p className="text-lg leading-[1.6]" style={{ color: MKT.textSecondary }}>
                    {category.description}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((feature, i) => (
                    <motion.div key={feature.id} {...mktEnterReveal(reduced, i * 0.05)}>
                      <Link
                        href={getProductHref(feature.id)}
                        className="group flex h-full flex-col overflow-hidden transition-opacity hover:opacity-95"
                        style={{
                          borderRadius: MKT.radius.card,
                          border: `1px solid ${MKT.border}`,
                          backgroundColor: MKT.surface,
                        }}
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden border-b" style={{ borderColor: MKT.border }}>
                          <Image
                            src={feature.imageSrc}
                            alt={feature.imageAlt}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <p className="text-xs font-medium uppercase tracking-[0.12em]" style={{ color: MKT.textSecondary }}>
                            {feature.tag}
                          </p>
                          <h2
                            className="mt-2 text-lg font-medium tracking-[-0.02em] transition-opacity group-hover:opacity-80"
                            style={{ color: MKT.textPrimary }}
                          >
                            {feature.title}
                          </h2>
                          <p className="mt-2 flex-1 text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
                            {getProductCardSummary(feature)}
                          </p>
                          <span
                            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity group-hover:opacity-80"
                            style={{ color: MKT.textPrimary }}
                          >
                            Learn more
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <section className="py-20 lg:py-24" style={{ backgroundColor: MKT.background }}>
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl" style={{ color: MKT.textPrimary }}>
              Ready to replace your patchwork stack?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-[1.6]" style={{ color: MKT.textSecondary }}>
              Start free and run your whole business from one workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/signup">
                <span
                  className="mkt-cta inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ borderRadius: MKT.radius.button }}
                >
                  Get started free
                </span>
              </Link>
              <Link href="/pricing">
                <span
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{
                    borderRadius: MKT.radius.button,
                    border: `1px solid ${MKT.border}`,
                    backgroundColor: MKT.surface,
                    color: MKT.textPrimary,
                  }}
                >
                  View pricing
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingSubpageFooter />
    </div>
  );
}
