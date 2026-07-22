'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import ProductMediaPanel from '@/components/home/ProductMediaPanel';
import ProductScreenshot from '@/components/home/ProductScreenshot';
import {
  getProductBySlug,
  getProductCardSummary,
  getProductCategory,
  getProductHref,
  getRelatedProducts,
} from '@/lib/products';
import { mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

type ProductDetailClientProps = {
  slug: string;
};

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const product = getProductBySlug(slug);
  const reduced = useMotionReduced();

  if (!product) return null;

  const category = getProductCategory(product.id);
  const related = getRelatedProducts(product.id);

  return (
    <div className="marketing-root min-h-screen bg-mkt-background font-sans text-mkt-foreground">
      <MarketingSubpageHeader />

      <main>
        <section className="border-b border-mkt-border bg-mkt-background py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Link
              href="/products"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-mkt-secondary transition-opacity hover:opacity-70"
            >
              <ArrowLeft className="h-4 w-4" />
              All products
            </Link>

            <motion.div {...mktEnterReveal(reduced)} className="max-w-3xl">
              {category ? (
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary">
                  {category.label}
                </p>
              ) : null}
              <span className="mb-5 inline-flex items-center rounded-full border border-mkt-border bg-mkt-background px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary">
                {product.tag}
              </span>
              <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-mkt-foreground sm:text-4xl lg:text-5xl">
                {product.title}
              </h1>
              <p className="mt-5 text-lg leading-[1.6] text-mkt-secondary">{product.description}</p>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-mkt-border bg-mkt-background py-12 lg:py-16">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ProductMediaPanel feature={product} priority />
          </div>
        </section>

        <section className="border-b border-mkt-border bg-mkt-background py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              <div>
                <h2 className="mb-6 text-2xl font-medium tracking-[-0.02em] text-mkt-foreground">
                  What you get
                </h2>
                <ul className="space-y-3">
                  {product.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3 text-[15px] text-mkt-secondary">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-mkt-foreground" strokeWidth={2} />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary">
                  How it works
                </p>
                <ol className="space-y-5">
                  {product.howItWorks.map((step, stepIndex) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-mkt-button bg-mkt-foreground text-[12px] font-medium text-mkt-surface">
                        {stepIndex + 1}
                      </span>
                      <div>
                        <p className="text-[15px] font-medium text-mkt-foreground">{step.title}</p>
                        <p className="mt-0.5 text-[14px] leading-[1.6] text-mkt-secondary">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-14 flex flex-wrap gap-4">
              <Link href="/auth/signup">
                <span className="inline-flex items-center gap-2 rounded-mkt-button bg-mkt-accent px-6 py-3 text-sm font-medium text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
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

        {related.length > 0 ? (
          <section className="bg-mkt-background py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="mb-8 text-2xl font-medium tracking-[-0.02em] text-mkt-foreground">
                Related products
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={getProductHref(item.id)}
                    className="group overflow-hidden rounded-mkt-card border border-mkt-border bg-mkt-surface transition-opacity hover:opacity-95"
                  >
                    <ProductScreenshot src={item.imageSrc} alt={item.imageAlt} />
                    <div className="p-4">
                      <p className="text-sm font-medium text-mkt-foreground">{item.tag}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-[1.6] text-mkt-secondary">
                        {getProductCardSummary(item)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <MarketingSubpageFooter />
    </div>
  );
}
