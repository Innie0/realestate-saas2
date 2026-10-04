import type { Metadata } from 'next';
import ProductsIndexClient from '@/components/products/ProductsIndexClient';
import { PRODUCT_PAGES_LIVE } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Products — Oikaro',
  description:
    'Explore every Oikaro product: AI assistant, listing projects, property research, leads inbox, CRM, transactions, calendar, open houses, ads, and dashboard.',
  robots: PRODUCT_PAGES_LIVE ? undefined : { index: false, follow: false },
};

export default function ProductsPage() {
  return <ProductsIndexClient />;
}
