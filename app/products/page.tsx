import type { Metadata } from 'next';
import ProductsPageClient from '@/components/products/ProductsPageClient';

export const metadata: Metadata = {
  title: 'Products — Oikaro',
  description:
    'Explore every Oikaro product: AI assistant, listing projects, property research, leads inbox, CRM, transactions, calendar, open houses, ads, and dashboard.',
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
