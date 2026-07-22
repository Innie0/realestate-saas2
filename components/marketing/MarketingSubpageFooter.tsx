import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/products', label: 'Products' },
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
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <Link
            href="/"
            className="shrink-0 font-mono text-4xl font-semibold tracking-[-0.04em] text-mkt-foreground transition-opacity hover:opacity-80 sm:text-5xl lg:text-6xl"
          >
            Oikaro
          </Link>

          <div className="md:text-right">
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:justify-end">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-mkt-secondary transition-opacity hover:opacity-70"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="mt-4 text-sm text-mkt-secondary">© 2026 Oikaro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
