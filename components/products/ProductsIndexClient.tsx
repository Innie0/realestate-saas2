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
import { mktEnterReveal } from '@/lib/marketing-design';
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
    <div className="marketing-root min-h-screen bg-white text-mkt-foreground">
      <MarketingSubpageHeader />

      <main>
        <section className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div {...mktEnterReveal(reduced)} className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary">
                Products
              </p>
              <h1 className="font-display text-4xl font-medium tracking-[-0.02em] text-mkt-foreground sm:text-5xl">
                Everything in Oikaro
              </h1>
              <p className="mt-5 text-lg leading-[1.6] text-mkt-secondary">
                Pick a product to learn how it fits your workflow — listings, leads, CRM, deals, and more.
              </p>
              <Link href="/auth/signup" className="mt-8 inline-block">
                <span className="inline-flex items-center gap-2 rounded-mkt-button bg-[#0668E1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0450b0]">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </div>
        </section>

        {PRODUCT_CATEGORIES.map((category) => {
          const features = category.featureIds
            .map((id) => PRODUCTS_BY_ID[id])
            .filter((f) => f && publishedIds.has(f.id));

          if (features.length === 0) return null;

          return (
            <section key={category.id} className="bg-white py-16 lg:py-20">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mb-10 max-w-2xl">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary">
                    {category.label}
                  </p>
                  <p className="text-lg leading-[1.6] text-mkt-secondary">{category.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((feature, i) => (
                    <motion.div key={feature.id} {...mktEnterReveal(reduced, i * 0.05)}>
                      <Link
                        href={getProductHref(feature.id)}
                        className="group flex h-full flex-col overflow-hidden rounded-mkt-card border border-mkt-border bg-mkt-surface transition-opacity hover:opacity-95"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-mkt-border">
                          <Image
                            src={feature.imageSrc}
                            alt={feature.imageAlt}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary">
                            {feature.tag}
                          </p>
                          <h2 className="mt-2 text-lg font-medium tracking-[-0.02em] text-mkt-foreground transition-opacity group-hover:opacity-80">
                            {feature.title}
                          </h2>
                          <p className="mt-2 flex-1 text-sm leading-[1.6] text-mkt-secondary">
                            {getProductCardSummary(feature)}
                          </p>
                          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-mkt-foreground transition-opacity group-hover:opacity-80">
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

        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <h2 className="font-display text-3xl font-medium tracking-[-0.02em] text-mkt-foreground sm:text-4xl">
              Ready to replace your patchwork stack?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-[1.6] text-mkt-secondary">
              Start free and run your whole business from one workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/signup">
                <span className="inline-flex items-center gap-2 rounded-mkt-button bg-[#0668E1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0450b0]">
                  Get started free
                </span>
              </Link>
              <Link href="/pricing">
                <span className="inline-flex items-center gap-2 rounded-mkt-button border border-mkt-border bg-mkt-surface px-6 py-3 text-sm font-medium text-mkt-foreground transition-opacity hover:opacity-90">
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
