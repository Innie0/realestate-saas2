// Terms of Service page
// Legal document outlining service terms and conditions

import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - Realestic',
  description: 'Terms of service for Realestic real estate platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-black/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Realestic
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-12">
          {/* Title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
              <p className="text-gray-400 mt-2">Last Updated: January 22, 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-purple max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Agreement to Terms</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                By accessing or using Realestic ("Service", "Platform", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Description of Service</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Realestic is a SaaS platform designed for real estate professionals, providing tools for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Property and transaction management</li>
                <li>Client relationship management (CRM)</li>
                <li>Calendar integration and scheduling</li>
                <li>AI-powered content generation</li>
                <li>Document storage and organization</li>
                <li>Task and reminder management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Account Registration</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Eligibility</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You must be at least 18 years old and legally able to enter into contracts to use our Service. By creating an account, you represent that you meet these requirements.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Account Security</h3>
              <p className="text-gray-300 leading-relaxed mb-2">You are responsible for:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Ensuring your account information is accurate and up-to-date</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Account Termination</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct we deem harmful to the Service or other users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptable Use</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">You Agree To:</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Use the Service only for lawful purposes</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Maintain professional conduct when using the platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">You Agree NOT To:</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload malicious code, viruses, or harmful software</li>
                <li>Scrape, crawl, or spider the Service without permission</li>
                <li>Impersonate another person or entity</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Share your account with others</li>
                <li>Use the Service to spam or send unsolicited messages</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">User Content</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Your Content</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You retain all rights to content you upload, create, or store on the Service ("User Content"), including property listings, client information, documents, and images.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">License to Us</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                By uploading User Content, you grant us a limited, non-exclusive license to store, process, and display your content solely for the purpose of providing the Service to you.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Your Responsibilities</h3>
              <p className="text-gray-300 leading-relaxed mb-2">You are solely responsible for:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>The accuracy and legality of your User Content</li>
                <li>Ensuring you have rights to upload the content</li>
                <li>Complying with fair housing laws and regulations</li>
                <li>Maintaining backups of important data</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Content Removal</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We reserve the right to remove User Content that violates these Terms, applicable laws, or our policies, without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Integrations</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Google Calendar</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                When you connect your Google Calendar, you authorize us to access and modify your calendar events as described in our Privacy Policy. You can revoke this access at any time.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Third-Party Services</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our Service may integrate with third-party services (Supabase, OpenAI, Google, etc.). Your use of these services is subject to their respective terms and conditions. We are not responsible for third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">AI-Generated Content</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">AI Tools</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We provide AI-powered tools to help generate property descriptions and analyze images. While we strive for accuracy, AI-generated content may contain errors or inaccuracies.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Your Responsibility</h3>
              <p className="text-gray-300 leading-relaxed mb-2">You agree to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Review all AI-generated content before use</li>
                <li>Verify accuracy of descriptions and information</li>
                <li>Take full responsibility for content you publish or share</li>
                <li>Not rely solely on AI-generated content for important decisions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Fees and Payment</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Subscription Plans</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Access to certain features may require a paid subscription. Subscription fees, billing cycles, and payment terms will be clearly communicated before you subscribe.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Billing</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You authorize us to charge your payment method</li>
                <li>Fees are non-refundable except as required by law</li>
                <li>We may change pricing with 30 days notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Cancellation</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You may cancel your subscription at any time. Upon cancellation, you'll retain access until the end of your current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Our Rights</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Service, including its design, code, features, and branding (excluding User Content), is owned by Realestic and protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Restrictions</h3>
              <p className="text-gray-300 leading-relaxed mb-2">You may not:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Copy, modify, or reverse engineer the Service</li>
                <li>Create derivative works based on the Service</li>
                <li>Remove or alter any proprietary notices</li>
                <li>Use our trademarks without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Disclaimers</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">"As Is" Service</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">No Guarantees</h3>
              <p className="text-gray-300 leading-relaxed mb-2">We do not guarantee that:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>The Service will be uninterrupted or error-free</li>
                <li>All data will be preserved or backed up</li>
                <li>The Service will meet your specific requirements</li>
                <li>AI-generated content will be accurate or complete</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Professional Advice</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our Service is a tool to assist real estate professionals. It does not constitute legal, financial, or professional advice. Consult with qualified professionals for important decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, REALESTIC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Indemnification</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless Realestic, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Your use of the Service</li>
                <li>Your User Content</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any laws or third-party rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security and Backups</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                While we implement security measures to protect your data, no system is completely secure. You acknowledge that:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>You use the Service at your own risk</li>
                <li>You should maintain independent backups of important data</li>
                <li>We are not responsible for data loss due to system failures, security breaches, or other causes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Modifications</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Modify, suspend, or discontinue the Service or any features</li>
                <li>Update these Terms at any time</li>
                <li>Change pricing or subscription plans</li>
                <li>Limit access to certain features</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                We will provide reasonable notice of material changes when possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">By You</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You may terminate your account at any time by contacting us or using the account deletion feature.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">By Us</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without notice, for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Extended inactivity</li>
                <li>Any reason we deem necessary to protect the Service or other users</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Effect of Termination</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Upon termination, your right to use the Service ceases immediately. We may delete your data in accordance with our Privacy Policy. Provisions of these Terms that should survive termination will remain in effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Governing Law</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Dispute Resolution Process</h3>
              <p className="text-gray-300 leading-relaxed mb-2">In the event of a dispute:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>First, contact us to resolve the issue informally</li>
                <li>If unresolved, disputes may be subject to binding arbitration</li>
                <li>You waive the right to participate in class action lawsuits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">General Provisions</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Entire Agreement</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                These Terms, along with our Privacy Policy, constitute the entire agreement between you and Realestic regarding the Service.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Severability</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Waiver</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our failure to enforce any right or provision of these Terms will not constitute a waiver of that right or provision.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Assignment</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You may not assign or transfer these Terms without our written consent. We may assign our rights and obligations without restriction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-2">
                <p className="text-gray-300"><strong>Email:</strong> legal@realestic.com</p>
                <p className="text-gray-300"><strong>Support:</strong> support@realestic.com</p>
              </div>
            </section>

            <div className="border-t border-gray-700 pt-8 mt-12">
              <p className="text-gray-400 text-sm italic">
                By using Realestic, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur-sm mt-16">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Realestic. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-white font-medium">Terms</Link>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
