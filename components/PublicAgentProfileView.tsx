import Link from 'next/link';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Award,
  Building2,
  ExternalLink,
} from 'lucide-react';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { formatListingPrice, normalizeProjectImages } from '@/lib/listing-utils';
import type { Project } from '@/types';

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

interface ListingRow {
  id: string;
  title: string;
  property_info: Record<string, unknown> | null;
  images: Project['images'];
}

interface PublicAgentProfileViewProps {
  agent: PublicAgentProfile;
  listings: ListingRow[];
}

function SectionCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function PublicAgentProfileView({
  agent,
  listings,
}: PublicAgentProfileViewProps) {
  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Realestic" className="h-8 w-auto" />
          </Link>
          {hasContact && agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call {agent.name.split(' ')[0]}
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-orange-50/50 to-white pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col items-center text-center">
            {agent.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.photoUrl}
                alt={agent.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white shadow-lg mb-5"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center ring-4 ring-white shadow-lg mb-5">
                <span className="text-3xl sm:text-4xl font-bold text-white">{initials}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {agent.name}
            </h1>

            <p className="mt-2 text-base sm:text-lg text-gray-600 max-w-xl">
              {agent.headline || 'Your local real estate expert'}
            </p>

            {(agent.brokerage || agent.yearsExperience != null) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {agent.brokerage && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-sm text-gray-700 shadow-sm">
                    <Building2 className="w-3.5 h-3.5 text-brand-600" />
                    {agent.brokerage}
                  </span>
                )}
                {agent.yearsExperience != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-sm text-gray-700 shadow-sm">
                    <Award className="w-3.5 h-3.5 text-brand-600" />
                    {agent.yearsExperience}+ years experience
                  </span>
                )}
              </div>
            )}

            {agent.license && (
              <p className="mt-2 text-xs text-gray-500">{agent.license}</p>
            )}

            {hasContact && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-brand-600" />
                    {agent.phone}
                  </a>
                )}
                {agent.profileEmail && (
                  <a
                    href={`mailto:${agent.profileEmail}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-brand-300 hover:text-brand-700 transition-colors"
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
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-brand-600" />
                    Website
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div
          className={`grid gap-6 lg:gap-8 ${
            hasSidebar ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]' : 'max-w-2xl mx-auto'
          }`}
        >
          {/* Sidebar */}
          {hasSidebar && (
            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              {agent.bio && (
                <SectionCard title="About">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
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
            </div>
          )}

          {/* Listings + contact */}
          <div className="space-y-6">
            {listings.length > 0 && (
              <SectionCard title={`Listings (${listings.length})`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {listings.map((listing) => {
                    const info = listing.property_info || {};
                    const thumb = normalizeProjectImages(listing.images)[0];
                    const address =
                      (typeof info.address === 'string' && info.address) || listing.title;
                    const price = typeof info.price === 'number' ? info.price : null;
                    const beds = typeof info.bedrooms === 'number' ? info.bedrooms : null;
                    const baths = typeof info.bathrooms === 'number' ? info.bathrooms : null;

                    return (
                      <Link
                        key={listing.id}
                        href={`/listing/${listing.id}`}
                        className="group rounded-xl border border-gray-200 bg-gray-50 overflow-hidden hover:border-brand-300 hover:shadow-md transition-all"
                      >
                        <div className="aspect-[16/10] bg-gray-200 overflow-hidden">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={address}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                              No photo
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-white">
                          <p className="font-bold text-gray-900 text-base">
                            {formatListingPrice(price)}
                          </p>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{address}</p>
                          {(beds != null || baths != null) && (
                            <p className="text-xs text-gray-500 mt-2">
                              {[beds != null ? `${beds} bed` : null, baths != null ? `${baths} bath` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            <SectionCard title={`Work with ${agent.name.split(' ')[0]}`}>
              <p className="text-sm text-gray-500 mb-6 -mt-2">
                Tell us what you&apos;re looking for and {agent.name.split(' ')[0]} will get back to
                you shortly.
              </p>
              <LeadCaptureForm agentId={agent.id} agentName={agent.name} />
            </SectionCard>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white py-8 text-center">
        <Link href="/" className="text-xs text-gray-500 hover:text-brand-600 transition-colors">
          Powered by Realestic
        </Link>
      </footer>
    </div>
  );
}
