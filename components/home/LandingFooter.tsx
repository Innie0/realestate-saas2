'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MKT } from '@/lib/marketing-design';

const FOOTER_LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
] as const;

export default function LandingFooter() {
  return (
    <footer
      className="relative z-10 border-t"
      style={{ borderColor: MKT.border, backgroundColor: MKT.background }}
    >
      <div className="mx-auto px-6 py-12 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <Link
            href="/"
            className="shrink-0 font-mono text-4xl font-semibold tracking-[-0.04em] transition-opacity hover:opacity-80 sm:text-5xl lg:text-6xl"
            style={{ color: MKT.textPrimary }}
          >
            Oikaro
          </Link>

          <div className="md:text-right">
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:justify-end">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-opacity hover:opacity-70"
                  style={{ color: MKT.textSecondary }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/auth/signup"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 md:justify-end"
              style={{ color: MKT.textPrimary }}
            >
              Start free trial
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <p className="mt-4 text-sm" style={{ color: MKT.textSecondary }}>
              © 2026 Oikaro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
