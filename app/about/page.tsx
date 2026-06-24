import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { HeartHandshake } from 'lucide-react';
import { SUPPORT_EMAIL } from '@/lib/support-email';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Meet Ali Ali and learn why Realestic was built — simple tools for real estate agents who want to save time and win more business.',
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <LegalPageLayout
      title="About Realestic"
      subtitle="Built for agents, by someone who cares about your day-to-day work."
      icon={HeartHandshake}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hi, I&apos;m Ali Ali</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          I built Realestic because real estate agents deserve software that actually fits how they
          work — not another bloated CRM that takes weeks to learn and still misses the basics.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Listing prep, lead follow-up, open houses, CMAs, social content — your week is already
          full. Realestic is meant to take the repetitive work off your plate so you can spend
          more time with clients and less time fighting your tools.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">What we believe</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            <strong className="text-gray-800">Agents first.</strong> Realestic is for individual
            agents and small teams — not enterprise brokerages with a six-month rollout.
          </li>
          <li>
            <strong className="text-gray-800">Simple beats flashy.</strong> You should be able to
            capture a lead, run a CMA, or draft a listing post without a tutorial.
          </li>
          <li>
            <strong className="text-gray-800">Honest pricing.</strong> Clear plans, no surprise
            fees, and you can cancel anytime from your account.
          </li>
          <li>
            <strong className="text-gray-800">Real support.</strong> When something&apos;s off, you
            talk to a person — not a ticket black hole.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">How we work with you</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Realestic is a young product, and I&apos;m building it in the open with feedback from
          working agents. If you have an idea, hit a bug, or just want to say hi, reach out — I read
          every message.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 hover:text-brand-700 font-medium">
            {SUPPORT_EMAIL}
          </a>{' '}
          or use our{' '}
          <Link href="/contact" className="text-brand-600 hover:text-brand-700 font-medium">
            contact form
          </Link>
          . We typically reply within one business day.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to try it?</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          Start free and see if Realestic fits your workflow. No credit card required to explore.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            View pricing
          </Link>
        </div>
      </section>
    </LegalPageLayout>
  );
}
