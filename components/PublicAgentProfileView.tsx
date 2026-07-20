import Link from 'next/link';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Award,
  Building2,
  ExternalLink,
  MessageCircle,
  CalendarClock,
} from 'lucide-react';
import LeadCaptureForm from '@/components/LeadCaptureForm';

export interface PublicAgentProfile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  photoUrl: string;
  specialties: string[];
  areas: string[];
  phone: string;
  profileEmail: string;
  brokerage: string;
  license: string;
  website: string;
  yearsExperience: number | null;
}

interface PublicAgentProfileViewProps {
  agent: PublicAgentProfile;
  bookingUrl?: string | null;
}

function SectionCard({
  title,
  subtitle,
  children,
  className = '',
  id,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-gray-200 bg-[var(--surface)] p-6 sm:p-7 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-700 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default function PublicAgentProfileView({
  agent,
  bookingUrl,
}: PublicAgentProfileViewProps) {
  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const firstName = agent.name.split(' ')[0];
  const hasContact = Boolean(agent.phone || agent.profileEmail || agent.website);

  const hasSidebar =
    agent.bio ||
    agent.specialties.length > 0 ||
    agent.areas.length > 0 ||
    agent.brokerage ||
    agent.license ||
    agent.yearsExperience != null;

  const websiteHref = agent.website
    ? agent.website.startsWith('http')
      ? agent.website
      : `https://${agent.website}`
    : null;

  const stats = [
    agent.yearsExperience != null
      ? { label: `${agent.yearsExperience}+ years experience`, icon: Award }
      : null,
    agent.areas.length > 0
      ? { label: `${agent.areas.length} area${agent.areas.length === 1 ? '' : 's'} served`, icon: MapPin }
      : null,
  ].filter(Boolean) as { label: string; icon: typeof Award }[];

  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-[var(--surface)]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Oikaro" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            {bookingUrl && (
              <Link
                href={bookingUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Book a showing</span>
                <span className="sm:hidden">Book</span>
              </Link>
            )}
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Get in touch
            </a>
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Call {firstName}</span>
                <span className="sm:hidden">Call</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-[var(--surface)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-brand-200/30 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/[0.06] via-white to-white pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-16">
          <div className="flex flex-col items-center text-center">
            {agent.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.photoUrl}
                alt={agent.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-white shadow-xl mb-5"
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center ring-4 ring-white shadow-xl mb-5">
                <span className="text-3xl sm:text-5xl font-bold text-white">{initials}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              {agent.name}
            </h1>

            <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
              {agent.headline || 'Your local real estate expert'}
            </p>

            {(agent.brokerage || agent.license) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-700">
                {agent.brokerage && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-brand-600" />
                    {agent.brokerage}
                  </span>
                )}
                {agent.license && (
                  <>
                    {agent.brokerage && <span className="text-gray-300">·</span>}
                    <span>{agent.license}</span>
                  </>
                )}
              </div>
            )}

            {stats.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {stats.map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] border border-gray-200 px-3.5 py-1.5 text-xs sm:text-sm text-gray-700 shadow-sm"
                  >
                    <Icon className="w-3.5 h-3.5 text-brand-600" />
                    {label}
                  </span>
                ))}
              </div>
            )}

            {hasContact && (
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {bookingUrl && (
                  <Link
                    href={bookingUrl}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <CalendarClock className="w-4 h-4 text-brand-600" />
                    Book a showing
                  </Link>
                )}
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {agent.phone}
                  </a>
                )}
                {agent.profileEmail && (
                  <a
                    href={`mailto:${agent.profileEmail}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-brand-600" />
                    Email
                  </a>
                )}
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-brand-600" />
                    Website
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                )}
              </div>
            )}

            <a
              href="#contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send a message
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div
          className={`grid gap-6 lg:gap-8 ${
            hasSidebar ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]' : 'max-w-3xl mx-auto'
          }`}
        >
          {hasSidebar && (
            <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              {agent.bio && (
                <SectionCard title="About me">
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {agent.bio}
                  </p>
                </SectionCard>
              )}

              {agent.specialties.length > 0 && (
                <SectionCard title="Specialties">
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-sm text-brand-800"
                      >
                        <Award className="w-3 h-3 shrink-0" />
                        {s}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {agent.areas.length > 0 && (
                <SectionCard title="Areas served">
                  <div className="flex flex-wrap gap-2">
                    {agent.areas.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
                      >
                        <MapPin className="w-3 h-3 shrink-0 text-brand-600" />
                        {a}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {!agent.bio && (agent.brokerage || agent.yearsExperience != null) && (
                <SectionCard title="Why work with me?">
                  <ul className="space-y-3 text-sm text-gray-600">
                    {agent.yearsExperience != null && (
                      <li className="flex items-start gap-2">
                        <Award className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                        {agent.yearsExperience}+ years helping buyers and sellers
                      </li>
                    )}
                    {agent.brokerage && (
                      <li className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                        Affiliated with {agent.brokerage}
                      </li>
                    )}
                    {agent.license && (
                      <li className="flex items-start gap-2">
                        <span className="w-4 h-4 text-brand-600 mt-0.5 shrink-0 text-center text-xs font-bold">✓</span>
                        {agent.license}
                      </li>
                    )}
                  </ul>
                </SectionCard>
              )}
            </div>
          )}

          <div className="space-y-6">
            <SectionCard
              id="contact"
              title={`Work with ${firstName}`}
              subtitle="Share a few details and you'll hear back soon."
              className="border-t-4 border-t-brand-500"
            >
              <LeadCaptureForm agentId={agent.id} agentName={agent.name} />
            </SectionCard>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-[var(--surface)] py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} {agent.name}
            {agent.brokerage ? ` · ${agent.brokerage}` : ''}
          </p>
          <Link href="/" className="text-xs text-gray-700 hover:text-brand-600 transition-colors">
            Powered by Oikaro
          </Link>
        </div>
      </footer>
    </div>
  );
}
