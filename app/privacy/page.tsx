// Privacy Policy page
// Legal document explaining data collection and usage

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - Realestic',
  description: 'Privacy policy for Realestic real estate platform',
};

export default function PrivacyPage() {
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
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-gray-400 mt-2">Last Updated: January 22, 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Welcome to Realestic ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and protect your information when you use our real estate SaaS platform (the "Service").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">1. Account Information</h3>
              <p className="text-gray-300 leading-relaxed mb-4">When you create an account, we collect:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Profile picture (optional)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2. Google Account Information</h3>
              <p className="text-gray-300 leading-relaxed mb-4">When you sign in with Google or connect Google Calendar:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Google account email address</li>
                <li>Profile information (name, profile picture)</li>
                <li>Calendar events (titles, dates, times, descriptions, locations)</li>
                <li>OAuth access and refresh tokens</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">3. Usage Information</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Property listings and project information you create</li>
                <li>Client information you add</li>
                <li>Tasks and transactions you manage</li>
                <li>Calendar events you create</li>
                <li>Files and images you upload</li>
                <li>Notes and communications within the platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">4. Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referring URLs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Service Delivery</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Create and manage your account</li>
                <li>Provide access to platform features</li>
                <li>Sync your Google Calendar events</li>
                <li>Create calendar events for showings and meetings</li>
                <li>Store and display your client and property information</li>
                <li>Generate AI-powered content descriptions</li>
                <li>Analyze property images using AI</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Communication</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Send you important service updates</li>
                <li>Respond to your inquiries</li>
                <li>Send appointment reminders</li>
                <li>Notify you of calendar events</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Improvement</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Analyze usage patterns to improve our service</li>
                <li>Debug technical issues</li>
                <li>Develop new features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services We Use</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Supabase</h3>
              <p className="text-gray-300 leading-relaxed mb-2">We use Supabase for:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>User authentication and account management</li>
                <li>Database storage</li>
                <li>File storage for uploaded images and documents</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>Data stored:</strong> User profiles, calendar events, client information, property data, uploaded files
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>Privacy Policy:</strong>{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                  https://supabase.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Google APIs</h3>
              <p className="text-gray-300 leading-relaxed mb-2">We integrate with Google services for:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Google Sign-In (authentication)</li>
                <li>Google Calendar (reading and creating events)</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-2"><strong>Scopes requested:</strong></p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><code className="text-blue-400">calendar.readonly</code> - Read your calendar events to display and check for conflicts</li>
                <li><code className="text-blue-400">calendar.events</code> - Create and modify calendar events for showings and meetings</li>
                <li><code className="text-blue-400">userinfo.email</code> - Identify you during sign-in</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>Compliance:</strong> We comply with Google's API Services User Data Policy, including the Limited Use Requirements. We only use your Google data to provide the features you've explicitly requested.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>Google's Privacy Policy:</strong>{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                  https://policies.google.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">OpenAI</h3>
              <p className="text-gray-300 leading-relaxed mb-2">We use OpenAI's services to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Generate property descriptions</li>
                <li>Analyze property images</li>
                <li>Refine and enhance marketing content</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>Data sent to OpenAI:</strong> Property information and images you explicitly request us to process
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>OpenAI Privacy Policy:</strong>{' '}
                <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                  https://openai.com/policies/privacy-policy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Vercel</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We host our application on Vercel for deployment and performance.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>Vercel Privacy Policy:</strong>{' '}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                  https://vercel.com/legal/privacy-policy
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Protect Your Data</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Security Measures</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>All data transmission is encrypted using SSL/TLS</li>
                <li>OAuth tokens are encrypted at rest</li>
                <li>Passwords are hashed using industry-standard algorithms</li>
                <li>Database access is restricted and monitored</li>
                <li>Regular security audits and updates</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Access Control</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Only you can access your account and data</li>
                <li>We never share your data with third parties for marketing</li>
                <li>Our team only accesses data for support or debugging with your permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><strong>Active accounts:</strong> We retain your data for as long as your account is active</li>
                <li><strong>Inactive accounts:</strong> We may delete accounts inactive for 2+ years after notice</li>
                <li><strong>Deleted accounts:</strong> Data is permanently deleted within 30 days of account deletion</li>
                <li><strong>Backups:</strong> Backup copies are retained for 90 days for disaster recovery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights and Choices</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Access and Control</h3>
              <p className="text-gray-300 leading-relaxed mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Access all your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Disconnect third-party integrations (Google Calendar)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Google Calendar Integration</h3>
              <p className="text-gray-300 leading-relaxed mb-2">You can:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Disconnect Google Calendar at any time from your Settings page</li>
                <li>Revoke access via your Google Account settings</li>
                <li>Stop sync immediately - no further access to your calendar</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">How to Exercise Your Rights</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><strong>Update data:</strong> Use your account Settings page</li>
                <li><strong>Delete account:</strong> Contact us at privacy@realestic.com</li>
                <li><strong>Data export:</strong> Contact us at privacy@realestic.com</li>
                <li><strong>Questions:</strong> Email us at support@realestic.com</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use essential cookies to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Ensure security</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not use advertising or tracking cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our Service is not intended for users under 18. We do not knowingly collect information from children. If you believe we have collected data from a child, contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">International Data Transfers</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Your data may be processed in countries outside your own. We ensure appropriate safeguards are in place to protect your data in compliance with applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may update this privacy policy from time to time. We will notify you of significant changes via:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Email notification</li>
                <li>Prominent notice on our website</li>
                <li>In-app notification</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                Continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Legal Basis for Processing (GDPR)</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you are in the European Economic Area (EEA), our legal bases for processing your data are:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li><strong>Contract:</strong> To provide the Service you signed up for</li>
                <li><strong>Consent:</strong> When you explicitly consent (e.g., connecting Google Calendar)</li>
                <li><strong>Legitimate interests:</strong> To improve and secure our Service</li>
                <li><strong>Legal obligation:</strong> To comply with applicable laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">California Privacy Rights (CCPA)</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you are a California resident, you have additional rights:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Right to know what personal information we collect</li>
                <li>Right to delete your personal information</li>
                <li>Right to opt-out of sale of personal information (we don't sell your data)</li>
                <li>Right to non-discrimination for exercising your rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                For privacy-related questions or to exercise your rights:
              </p>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-2">
                <p className="text-gray-300"><strong>Email:</strong> privacy@realestic.com</p>
                <p className="text-gray-300"><strong>Support:</strong> support@realestic.com</p>
                <p className="text-gray-300"><strong>Response time:</strong> We aim to respond within 30 days</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Compliance</h2>
              <p className="text-gray-300 leading-relaxed mb-2">We comply with:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>Google API Services User Data Policy</li>
                <li>Other applicable data protection laws</li>
              </ul>
            </section>

            <div className="border-t border-gray-700 pt-8 mt-12">
              <p className="text-gray-400 text-sm italic">
                By using our Service, you acknowledge that you have read and understood this Privacy Policy.
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
              <Link href="/privacy" className="text-white font-medium">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
