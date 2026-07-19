'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import ProductMediaPanel from '@/components/home/ProductMediaPanel';
import {
  getProductBySlug,
  getProductCardSummary,
  getProductCategory,
  getProductHref,
  getRelatedProducts,
} from '@/lib/products';
import { useMotionReduced } from '@/lib/motion';

type ProductDetailClientProps = {
  slug: string;
};

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const product = getProductBySlug(slug);
  const reduced = useMotionReduced();

  if (!product) return null;

  const Icon = product.icon;
  const category = getProductCategory(product.id);
  const related = getRelatedProducts(product.id);

  return (
    <div className="marketing-root min-h-screen bg-[#F4F4F5] font-sans">
      <MarketingSubpageHeader />

      <main>
        <section className="border-b border-gray-200 bg-white py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Link
              href="/products"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              All products
            </Link>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              {category ? (
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                  {category.label}
                </p>
              ) : null}
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-label">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {product.tag}
              </span>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                {product.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-gray-700">{product.description}</p>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-gray-200 bg-[#fafafa] py-12 lg:py-16">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ProductMediaPanel feature={product} priority />
          </div>
        </section>

        <section className="border-b border-gray-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              <div>
                <h2 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">What you get</h2>
                <ul className="space-y-3">
                  {product.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3 text-[15px] text-gray-700">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" strokeWidth={1.8} />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  How it works
                </p>
                <ol className="space-y-5">
                  {product.howItWorks.map((step, stepIndex) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[12px] font-semibold text-white">
                        {stepIndex + 1}
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold text-gray-900">{step.title}</p>
                        <p className="mt-0.5 text-[14px] leading-relaxed text-gray-600">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-14 flex flex-wrap gap-4">
              <Link href="/auth/signup">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
              <Link href="/pricing">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-gray-400"
                >
                  View pricing
                </motion.span>
              </Link>
            </div>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="bg-[#fafafa] py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="mb-8 text-2xl font-semibold tracking-tight text-gray-900">Related products</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => {
                  const RelatedIcon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={getProductHref(item.id)}
                      className="group rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-[#fafafa]">
                        <RelatedIcon className="h-4 w-4 text-gray-700" strokeWidth={1.75} />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600">{item.tag}</p>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{getProductCardSummary(item)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <MarketingSubpageFooter />
    </div>
  );
}
