import { PRODUCT_CATEGORIES } from '@/lib/product-categories';
import { PLATFORM_TOOLS } from '@/lib/landing-showcase';
import { getProductHref } from '@/lib/products';

const toolsById = Object.fromEntries(PLATFORM_TOOLS.map((tool) => [tool.id, tool]));

export type ProductMenuColumn = {
  id: string;
  label: string;
  tools: {
    id: string;
    name: string;
    summary: string;
    href: string;
  }[];
};

export const PRODUCT_MENU_COLUMNS: ProductMenuColumn[] = PRODUCT_CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  tools: category.featureIds
    .map((id) => toolsById[id])
    .filter(Boolean)
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      summary: tool.summary,
      href: getProductHref(tool.id),
    })),
}));
