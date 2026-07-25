import Link from 'next/link';
import { PLATFORM_TOOLS } from '@/lib/landing-showcase';
import { getProductHref } from '@/lib/products';

const FOOTER_COMPANY_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
] as const;

export default function MarketingSubpageFooter() {
  return (
    <footer className="border-t border-mkt-border bg-mkt-background">
      <div className="mx-auto max-w-mkt-content px-6 py-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="shrink-0 font-mono text-4xl font-semibold tracking-[-0.04em] text-mkt-foreground transition-opacity hover:opacity-80 sm:text-5xl lg:text-6xl"
            >
              Oikaro
            </Link>
          </div>

          <div>
            <p className="text-sm font-semibold text-mkt-foreground">Products</p>
            <nav aria-label="Products" className="mt-4">
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {PLATFORM_TOOLS.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={getProductHref(tool.id)}
                      className="text-sm text-mkt-secondary transition-opacity hover:text-mkt-foreground hover:opacity-100"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/products"
                className="mt-4 inline-flex text-sm font-medium text-mkt-foreground transition-opacity hover:opacity-70"
              >
                View all products →
              </Link>
            </nav>
          </div>

          <div className="lg:text-right">
            <p className="text-sm font-semibold text-mkt-foreground">Company</p>
            <nav aria-label="Company" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm lg:justify-end">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-mkt-secondary transition-opacity hover:text-mkt-foreground hover:opacity-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="mt-6 text-sm text-mkt-secondary lg:text-right">
              © 2026 Oikaro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
