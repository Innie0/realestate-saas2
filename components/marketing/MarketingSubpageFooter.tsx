import Link from 'next/link';

export default function MarketingSubpageFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#F5F5F5]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="font-mono text-5xl font-semibold tracking-[-0.04em] text-gray-900 transition-opacity hover:opacity-80 sm:text-6xl lg:text-7xl"
          >
            Oikaro
          </Link>

          <nav className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700">
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

          <p className="mt-10 w-full border-t border-gray-200 pt-8 text-sm text-gray-700">
            © 2026 Oikaro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
