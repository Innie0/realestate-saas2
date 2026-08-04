import Link from 'next/link';
import {
  FOOTER_COLUMN_HEADER,
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_LINK_CLASS,
  FOOTER_PRODUCT_LINKS,
  FOOTER_RESOURCES_LINKS,
  footerProductHref,
} from '@/lib/marketing-footer';
import { SITE_NAME } from '@/lib/site-config';

type MarketingFooterColumnsProps = {
  brand: React.ReactNode;
  onBlue?: boolean;
};

function FooterColumn({
  title,
  children,
  headerClassName,
}: {
  title: string;
  children: React.ReactNode;
  headerClassName?: string;
}) {
  return (
    <div>
      <p className={headerClassName ?? FOOTER_COLUMN_HEADER}>{title}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

export default function MarketingFooterColumns({ brand, onBlue = false }: MarketingFooterColumnsProps) {
  const headerClass = onBlue
    ? 'text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60'
    : FOOTER_COLUMN_HEADER;
  const linkClass = onBlue
    ? 'text-sm text-white/75 transition-colors hover:text-white'
    : FOOTER_LINK_CLASS;
  const dividerClass = onBlue ? 'border-white/15' : 'border-mkt-border';
  const copyrightClass = onBlue ? 'text-sm text-white/60' : 'text-sm text-mkt-secondary';

  return (
    <>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(0,1fr))] lg:items-start lg:gap-10">
        <div className="sm:col-span-2 lg:col-span-1">{brand}</div>

        <FooterColumn title="Product" headerClassName={headerClass}>
          {FOOTER_PRODUCT_LINKS.map((item) => (
            <li key={item.id}>
              <Link href={footerProductHref(item.id)} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/pricing" className={linkClass}>
              Pricing
            </Link>
          </li>
        </FooterColumn>

        <FooterColumn title="Resources" headerClassName={headerClass}>
          {FOOTER_RESOURCES_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Company" headerClassName={headerClass}>
          {FOOTER_COMPANY_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Legal" headerClassName={headerClass}>
          {FOOTER_LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className={`mt-10 border-t pt-6 ${dividerClass}`}>
        <p className={copyrightClass}>© 2026 {SITE_NAME}. All rights reserved.</p>
      </div>
    </>
  );
}
