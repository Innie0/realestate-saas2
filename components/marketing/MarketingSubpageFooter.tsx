import Link from 'next/link';

export default function MarketingSubpageFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#F5F5F5]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <Link
            href="/"
            className="shrink-0 font-mono text-4xl font-semibold tracking-[-0.04em] text-gray-900 transition-opacity hover:opacity-80 sm:text-5xl lg:text-6xl"
          >
            Oikaro
          </Link>

          <div className="md:text-right">
            <nav className="flex flex-wrap gap-6 text-sm text-gray-700 md:justify-end">
              <Link href="/products" className="transition-colors hover:text-brand-600">
                Products
              </Link>
              <Link href="/pricing" className="transition-colors hover:text-brand-600">
                Pricing
              </Link>
              <Link href="/about" className="transition-colors hover:text-brand-600">
                About
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-brand-600">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-brand-600">
                Terms
              </Link>
              <Link href="/contact" className="transition-colors hover:text-brand-600">
                Contact
              </Link>
            </nav>
            <p className="mt-4 text-sm text-gray-700">© 2026 Oikaro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
