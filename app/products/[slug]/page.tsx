import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import {
  getAllProductSlugs,
  getProductBySlug,
  getProductMetaDescription,
} from '@/lib/products';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Product — Oikaro' };

  return {
    title: `${product.tag} — Oikaro`,
    description: getProductMetaDescription(product),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetailClient slug={slug} />;
}
