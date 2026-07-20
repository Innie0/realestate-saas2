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
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
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
    <div className="marketing-root min-h-screen font-sans" style={{ backgroundColor: MKT.background }}>
      <MarketingSubpageHeader />

      <main>
        <section className="border-b py-12 lg:py-16" style={{ borderColor: MKT.border, backgroundColor: MKT.surface }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Link
              href="/products"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: MKT.textSecondary }}
            >
              <ArrowLeft className="h-4 w-4" />
              All products
            </Link>

            <motion.div {...mktEnterReveal(reduced)} className="max-w-3xl">
              {category ? (
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: MKT.textSecondary }}>
                  {category.label}
                </p>
              ) : null}
              <span
                className="mb-5 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em]"
                style={{ borderColor: MKT.border, color: MKT.textSecondary, backgroundColor: MKT.background }}
              >
                {product.tag}
              </span>
              <h1
                className="text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-4xl lg:text-5xl"
                style={{ color: MKT.textPrimary }}
              >
                {product.title}
              </h1>
              <p className="mt-5 text-lg leading-[1.6]" style={{ color: MKT.textSecondary }}>
                {product.description}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="border-b py-12 lg:py-16" style={{ borderColor: MKT.border, backgroundColor: MKT.background }}>
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ProductMediaPanel feature={product} priority />
          </div>
        </section>

        <section className="border-b py-16 lg:py-20" style={{ borderColor: MKT.border, backgroundColor: MKT.surface }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              <div>
                <h2 className="mb-6 text-2xl font-medium tracking-[-0.02em]" style={{ color: MKT.textPrimary }}>
                  What you get
                </h2>
                <ul className="space-y-3">
                  {product.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3 text-[15px]" style={{ color: MKT.textSecondary }}>
                      <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} style={{ color: MKT.textPrimary }} />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: MKT.textSecondary }}>
                  How it works
                </p>
                <ol className="space-y-5">
                  {product.howItWorks.map((step, stepIndex) => (
                    <li key={step.title} className="flex gap-4">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center text-[12px] font-medium"
                        style={{
                          borderRadius: MKT.radius.button,
                          backgroundColor: MKT.textPrimary,
                          color: MKT.surface,
                        }}
                      >
                        {stepIndex + 1}
                      </span>
                      <div>
                        <p className="text-[15px] font-medium" style={{ color: MKT.textPrimary }}>
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-[14px] leading-[1.6]" style={{ color: MKT.textSecondary }}>
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-14 flex flex-wrap gap-4">
              <Link href="/auth/signup">
                <span
                  className="mkt-cta inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ borderRadius: MKT.radius.button }}
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
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

        {related.length > 0 ? (
          <section className="py-16 lg:py-20" style={{ backgroundColor: MKT.background }}>
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="mb-8 text-2xl font-medium tracking-[-0.02em]" style={{ color: MKT.textPrimary }}>
                Related products
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={getProductHref(item.id)}
                    className="group overflow-hidden transition-opacity hover:opacity-95"
                    style={{
                      borderRadius: MKT.radius.card,
                      border: `1px solid ${MKT.border}`,
                      backgroundColor: MKT.surface,
                    }}
                  >
                    <ProductScreenshot src={item.imageSrc} alt={item.imageAlt} />
                    <div className="p-4">
                      <p className="text-sm font-medium" style={{ color: MKT.textPrimary }}>
                        {item.tag}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
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
