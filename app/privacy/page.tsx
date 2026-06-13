// Privacy Policy page
// Legal document explaining data collection and usage

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Realestic collects, uses, and protects your personal information.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 backdrop-blur-md bg-[#F5F5F5]/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Image
              src="/logo.png"
              alt="Realestic"
              width={160}
              height={48}
              priority
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-12">
          {/* Title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gray-100 rounded-xl">
              <Shield className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-500 mt-2">Last Updated: March 25, 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to Realestic ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and protect your information when you use our real estate SaaS platform (the "Service").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1. Account Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">When you create an account, we collect:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2. Google Account Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">When you sign in with Google or connect Google Calendar:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Google account email address</li>
                <li>Profile information (name)</li>
                <li>Calendar events (titles, dates, times, descriptions, locations)</li>
                <li>OAuth access and refresh tokens</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2b. Microsoft/Outlook Account Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">When you connect Outlook Calendar:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Outlook account email address</li>
                <li>Calendar events (titles, dates, times, descriptions, locations)</li>
                <li>OAuth access and refresh tokens</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3. AI Assistant Conversation Data</h3>
              <p className="text-gray-600 leading-relaxed mb-4">When you use our AI Assistant feature, we collect and store:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Your messages and prompts sent to the AI</li>
                <li>AI-generated responses and content</li>
                <li>Complete conversation history to maintain context across multiple exchanges</li>
                <li>Images you attach to conversations for analysis</li>
                <li>Auto-generated conversation titles based on your first message</li>
                <li>Conversation metadata (creation date, last updated, pinned status)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Note:</strong> Conversations are stored in your account and you can delete them at any time from the AI Assistant page.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4. Property Lookup Search Data</h3>
              <p className="text-gray-600 leading-relaxed mb-4">When you use the Property Lookup feature, we process:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Property addresses you search for</li>
                <li>Search history stored locally in your browser session</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Important:</strong> Property lookup results — including owner names, contact information, and property details — are retrieved in real time from third-party data providers (Rentcast, BatchData) and are <strong>not stored</strong> in your account. This data originates from county public records and third-party databases and may be inaccurate or outdated. We do not guarantee its accuracy.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5. Other Usage Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Property listings and project information you create</li>
                <li>Client information you add</li>
                <li>Transactions you manage</li>
                <li>Calendar events you create</li>
                <li>Files and images you upload</li>
                <li>Notes and communications within the platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6. Feedback Data</h3>
              <p className="text-gray-600 leading-relaxed mb-4">When you submit feedback through the feedback widget or any feedback form, we collect:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>The feedback message you write</li>
                <li>The feedback type you select (General, Bug Report, or Feature Request)</li>
                <li>Your user ID and email address (if you are logged in)</li>
                <li>Timestamp of submission</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Feedback is stored in our database and used solely to improve the Service. We do not share feedback with third parties.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">7. Payment Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Payment method details (processed by Stripe)</li>
                <li>Billing address</li>
                <li>Transaction history</li>
                <li>Subscription plan information</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Note:</strong> We do not store your full credit card numbers. Payment processing is handled securely by Stripe.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8. Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referring URLs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Service Delivery</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Create and manage your account</li>
                <li>Process subscription payments</li>
                <li>Provide access to platform features</li>
                <li>Sync your Google Calendar events</li>
                <li>Create calendar events for showings and meetings</li>
                <li>Store and display your client and property information</li>
                <li>Generate AI-powered content descriptions</li>
                <li>Analyze property images and documents using AI</li>
                <li>Provide task assistance and document analysis</li>
                <li>Query third-party property data APIs to return property owner, contact, and listing information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Communication</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Send you important service updates</li>
                <li>Respond to your inquiries</li>
                <li>Send appointment reminders</li>
                <li>Notify you of calendar events</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Improvement</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Analyze usage patterns to improve our service</li>
                <li>Debug technical issues</li>
                <li>Develop new features</li>
                <li>Review submitted feedback to identify bugs, prioritize feature requests, and enhance the overall user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services We Use</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Supabase</h3>
              <p className="text-gray-600 leading-relaxed mb-2">We use Supabase for:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>User authentication and account management</li>
                <li>Database storage</li>
                <li>File storage for uploaded images and documents</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Data stored:</strong> User profiles, calendar events, client information, property data, uploaded files
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Privacy Policy:</strong>{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">
                  https://supabase.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Google APIs</h3>
              <p className="text-gray-600 leading-relaxed mb-2">We integrate with Google services for:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Google Sign-In (authentication)</li>
                <li>Google Calendar (reading and creating events)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-2"><strong>Scopes requested:</strong></p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><code className="text-gray-600">calendar.readonly</code> - Read your calendar events to display and check for conflicts</li>
                <li><code className="text-gray-600">calendar.events</code> - Create and modify calendar events for showings and meetings</li>
                <li><code className="text-gray-600">userinfo.email</code> - Identify you during sign-in</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Compliance:</strong> We comply with Google's API Services User Data Policy, including the Limited Use Requirements. We only use your Google data to provide the features you've explicitly requested.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Google's Privacy Policy:</strong>{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">
                  https://policies.google.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">OpenAI</h3>
              <p className="text-gray-600 leading-relaxed mb-2">We use OpenAI's GPT-4 services to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Generate property descriptions and marketing content</li>
                <li>Analyze property images and documents</li>
                <li>Refine and enhance content</li>
                <li>Provide AI-powered conversational assistance with conversation memory</li>
                <li>Generate descriptive titles for your conversations</li>
                <li>Maintain conversation context across multiple messages</li>
                <li>Extract information from uploaded documents and images</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Data sent to OpenAI:</strong> Your conversation messages, property information, images, and documents you explicitly request us to process. Your full conversation history is sent to OpenAI to maintain context and provide relevant responses. We store conversation history in our database to enable you to resume conversations later. AI responses are for informational purposes only and do not constitute financial, legal, or professional advice.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Data Retention:</strong> Conversation history is stored indefinitely until you manually delete conversations from the AI Assistant page. You have full control to delete any or all conversations at any time.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>OpenAI Privacy Policy:</strong>{' '}
                <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">
                  https://openai.com/policies/privacy-policy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Stripe</h3>
              <p className="text-gray-600 leading-relaxed mb-2">We use Stripe for payment processing:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Processing subscription payments</li>
                <li>Managing billing and invoices</li>
                <li>Handling refunds and payment disputes</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Data shared with Stripe:</strong> Your payment method details, billing address, and transaction information. Stripe maintains PCI DSS compliance for secure payment processing.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Stripe Privacy Policy:</strong>{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">
                  https://stripe.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Rentcast</h3>
              <p className="text-gray-600 leading-relaxed mb-2">We use Rentcast's property data API to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Retrieve verified property owner names from county assessor/recorder records</li>
                <li>Retrieve property details (beds, baths, sq ft, year built, assessed value, sale history)</li>
                <li>Check active and recent MLS listings for a searched property</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Data sent to Rentcast:</strong> The property address you search. Results are returned in real time and are not stored in your account.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Rentcast Privacy Policy:</strong>{' '}
                <a href="https://rentcast.io/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">
                  https://rentcast.io/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">BatchData (Skip Tracing)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">We use BatchData's skip tracing API to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Retrieve phone numbers and email addresses associated with a property owner</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Data sent to BatchData:</strong> The property address and verified owner name (obtained from county records via Rentcast). Results are returned in real time and are not stored in your account. Contact information returned may be inaccurate, outdated, or belong to a previous owner. Always verify before use.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>BatchData Privacy Policy:</strong>{' '}
                <a href="https://batchdata.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">
                  https://batchdata.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Vercel</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We host our application on Vercel for deployment and performance.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Vercel Privacy Policy:</strong>{' '}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline">
                  https://vercel.com/legal/privacy-policy
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Protect Your Data</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Security Measures</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>All data transmission is encrypted using SSL/TLS</li>
                <li>OAuth tokens are encrypted at rest</li>
                <li>Passwords are hashed using industry-standard algorithms</li>
                <li>Database access is restricted and monitored</li>
                <li>Regular security audits and updates</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Access Control</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Only you can access your account and data</li>
                <li>We never share your data with third parties for marketing</li>
                <li>Our team only accesses data for support or debugging with your permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><strong>Active accounts:</strong> We retain your data for as long as your account is active</li>
                <li><strong>Inactive accounts:</strong> We may delete accounts inactive for 2+ years after notice</li>
                <li><strong>Deleted accounts:</strong> Data is permanently deleted within 30 days of account deletion</li>
                <li><strong>Backups:</strong> Backup copies are retained for 90 days for disaster recovery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Access and Control</h3>
              <p className="text-gray-600 leading-relaxed mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Access all your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Disconnect third-party integrations (Google Calendar)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Google Calendar Integration</h3>
              <p className="text-gray-600 leading-relaxed mb-2">You can:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Disconnect Google Calendar at any time from your Settings page</li>
                <li>Revoke access via your Google Account settings</li>
                <li>Stop sync immediately - no further access to your calendar</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">How to Exercise Your Rights</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><strong>Update data:</strong> Use your account Settings page</li>
                <li><strong>Delete account:</strong> Contact us at privacy@realestic.com</li>
                <li><strong>Data export:</strong> Contact us at privacy@realestic.com</li>
                <li><strong>Questions:</strong> Email us at support@realestic.com</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use essential cookies to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Ensure security</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not use advertising or tracking cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our Service is not intended for users under 18. We do not knowingly collect information from children. If you believe we have collected data from a child, contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Your data may be processed in countries outside your own. We ensure appropriate safeguards are in place to protect your data in compliance with applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may update this privacy policy from time to time. We will notify you of significant changes via:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Email notification</li>
                <li>Prominent notice on our website</li>
                <li>In-app notification</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Basis for Processing (GDPR)</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you are in the European Economic Area (EEA), our legal bases for processing your data are:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li><strong>Contract:</strong> To provide the Service you signed up for</li>
                <li><strong>Consent:</strong> When you explicitly consent (e.g., connecting Google Calendar)</li>
                <li><strong>Legitimate interests:</strong> To improve and secure our Service</li>
                <li><strong>Legal obligation:</strong> To comply with applicable laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">California Privacy Rights (CCPA)</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you are a California resident, you have additional rights:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Right to know what personal information we collect</li>
                <li>Right to delete your personal information</li>
                <li>Right to opt-out of sale of personal information (we don't sell your data)</li>
                <li>Right to non-discrimination for exercising your rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                For privacy-related questions or to exercise your rights:
              </p>
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 space-y-2">
                <p className="text-gray-600"><strong>Email:</strong> privacy@realestic.com</p>
                <p className="text-gray-600"><strong>Support:</strong> support@realestic.com</p>
                <p className="text-gray-600"><strong>Response time:</strong> We aim to respond within 30 days</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Compliance</h2>
              <p className="text-gray-600 leading-relaxed mb-2">We comply with:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>Google API Services User Data Policy</li>
                <li>Other applicable data protection laws</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-gray-500 text-sm italic">
                By using our Service, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-[#F5F5F5]/20 backdrop-blur-sm mt-16">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Realestic. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="text-gray-900 font-medium">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
