import Link from 'next/link';

export default function MarketingSubpageFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#F5F5F5]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-700">© 2026 Oikaro. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700">
            <Link href="/products" className="transition-colors hover:text-brand-600">
              Products
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-brand-600">
              Pricing
            </Link>
            <Link href="/for-agents" className="transition-colors hover:text-brand-600">
              For Agents
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
          </div>
        </div>
      </div>
    </footer>
  );
}
