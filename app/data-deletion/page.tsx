// Data deletion instructions — linked from the Privacy Policy and given to
// Meta as the app's "Data Deletion Instructions URL"

import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { SUPPORT_EMAIL } from '@/lib/support-email';

export const metadata: Metadata = {
  title: 'Data Deletion',
  description: 'How to remove Oikaro’s access to your Facebook, Instagram, or Google accounts and delete your data.',
  robots: { index: true, follow: true },
};

const h2 = 'font-display text-2xl font-medium tracking-[-0.02em] text-mkt-foreground mb-4';
const p = 'text-mkt-secondary leading-relaxed mb-4';
const ol = 'list-decimal list-inside text-mkt-secondary space-y-2 mb-4';
const link = 'text-mkt-secondary hover:text-mkt-foreground underline';

export default function DataDeletionPage() {
  return (
    <LegalPageLayout title="Data Deletion" updated="October 28, 2026">
      <section className="mb-8">
        <p className={p}>
          Oikaro is owned and operated by GreatRock LLC. You can remove Oikaro&apos;s access to your connected accounts and
          ask us to delete your data at any time. Here is how.
        </p>
      </section>

      <section className="mb-8">
        <h2 className={h2}>Remove Facebook &amp; Instagram (Meta) data</h2>
        <ol className={ol}>
          <li>
            In Oikaro, open the <strong>Ads</strong> page and click <strong>Disconnect</strong> next to Meta. This deletes
            the access token we stored right away, and Oikaro can no longer see or change your ads.
          </li>
          <li>
            In Facebook, go to <strong>Settings &amp; privacy</strong>, then <strong>Settings</strong>, then{' '}
            <strong>Business integrations</strong>, select <strong>Oikaro</strong>, and click <strong>Remove</strong>.
          </li>
          <li>
            To delete everything else we stored from Meta (your Meta user ID and name, ad account details, campaign IDs, and
            ad results), email <a href={`mailto:${SUPPORT_EMAIL}`} className={link}>{SUPPORT_EMAIL}</a> from the email
            address on your Oikaro account with the subject <strong>&quot;Meta data deletion&quot;</strong>.
          </li>
        </ol>
        <p className={p}>
          We will delete that data within 30 days and reply to confirm when it is done. Ads that are already running in your
          Meta ad account stay in your account; you can pause or delete them in Meta Ads Manager.
        </p>
      </section>

      <section className="mb-8">
        <h2 className={h2}>Remove Google data</h2>
        <ol className={ol}>
          <li>
            In Oikaro, disconnect <strong>Google Ads</strong> from the Ads page and <strong>Google Calendar</strong> from the
            Calendar page.
          </li>
          <li>
            Remove Oikaro at{' '}
            <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer" className={link}>
              myaccount.google.com/connections
            </a>
            .
          </li>
          <li>
            To delete stored Google data, email <a href={`mailto:${SUPPORT_EMAIL}`} className={link}>{SUPPORT_EMAIL}</a>{' '}
            with the subject <strong>&quot;Google data deletion&quot;</strong>.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className={h2}>Delete your whole Oikaro account</h2>
        <p className={p}>
          Email <a href={`mailto:${SUPPORT_EMAIL}`} className={link}>{SUPPORT_EMAIL}</a> from the email address on your
          account with the subject <strong>&quot;Delete my account&quot;</strong>. We delete your account and its data within
          30 days, as described in our <Link href="/privacy" className={link}>Privacy Policy</Link>. Backup copies are
          removed within 90 days.
        </p>
      </section>
    </LegalPageLayout>
  );
}
