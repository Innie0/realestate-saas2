import Link from 'next/link';
import { PLATFORM_TOOLS } from '@/lib/landing-showcase';
import { getProductHref } from '@/lib/products';

const FOOTER_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
] as const;

export default function LandingFooter() {
  return (
    <footer className="border-t border-mkt-border bg-mkt-background">
      <div className="mx-auto max-w-mkt-content px-5 py-14 sm:px-8 lg:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/"
              className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground transition-opacity hover:opacity-70 sm:text-4xl"
            >
              Oikaro
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-[1.6] text-mkt-secondary">
              One workspace for listings, leads, clients, and transactions.
            </p>
          </div>

          <div className="md:text-right">
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-start gap-x-6 gap-y-4 text-sm md:justify-end"
            >
              <div className="text-left md:text-right">
                <Link
                  href="/products"
                  className="text-mkt-secondary transition-opacity hover:text-mkt-foreground hover:opacity-100"
                >
                  Products
                </Link>
                <ul className="mt-2 space-y-1.5">
                  {PLATFORM_TOOLS.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={getProductHref(tool.id)}
                        className="text-mkt-secondary transition-opacity hover:text-mkt-foreground hover:opacity-100"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-mkt-secondary transition-opacity hover:text-mkt-foreground hover:opacity-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/auth/signup"
              className="mt-5 inline-flex text-sm font-medium text-mkt-foreground transition-opacity hover:opacity-70"
            >
              Start your 7-day free trial
            </Link>
            <p className="mt-6 text-sm text-mkt-secondary">© 2026 Oikaro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
