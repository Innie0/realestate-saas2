import Link from 'next/link';
import {
  FOOTER_COLUMN_HEADER,
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_LINK_CLASS,
  FOOTER_PRODUCT_LINKS,
  footerProductHref,
} from '@/lib/marketing-footer';

type MarketingFooterColumnsProps = {
  brand: React.ReactNode;
};

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={FOOTER_COLUMN_HEADER}>{title}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

export default function MarketingFooterColumns({ brand }: MarketingFooterColumnsProps) {
  return (
    <>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))] lg:items-start lg:gap-12">
        <div className="sm:col-span-2 lg:col-span-1">{brand}</div>

        <FooterColumn title="Product">
          {FOOTER_PRODUCT_LINKS.map((item) => (
            <li key={item.id}>
              <Link href={footerProductHref(item.id)} className={FOOTER_LINK_CLASS}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/pricing" className={FOOTER_LINK_CLASS}>
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/products" className={`${FOOTER_LINK_CLASS} font-medium text-mkt-foreground`}>
              All products →
            </Link>
          </li>
        </FooterColumn>

        <FooterColumn title="Company">
          {FOOTER_COMPANY_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={FOOTER_LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Legal">
          {FOOTER_LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={FOOTER_LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="mt-10 border-t border-mkt-border pt-6">
        <p className="text-sm text-mkt-secondary">© 2026 Oikaro. All rights reserved.</p>
      </div>
    </>
  );
}
