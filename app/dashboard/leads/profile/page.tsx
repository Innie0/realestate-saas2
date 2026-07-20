'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import LeadsSectionSwitcher from '@/components/leads/LeadsSectionSwitcher';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import Switch from '@/components/ui/Switch';
import PageLoadingSkeleton from '@/components/dashboard/PageLoadingSkeleton';
import { useToast } from '@/components/providers/ToastProvider';
import {
  ArrowLeft, Save, User, Copy, Check,
  Plus, X, Eye, Award, Globe, Briefcase,
} from 'lucide-react';

export default function ProfileEditorPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [copied, setCopied] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [license, setLicense] = useState('');
  const [website, setWebsite] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newArea, setNewArea] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    document.title = 'Agent Profile - Oikaro';
    const init = async () => {
      try {
        const usageRes = await fetch('/api/usage');
        const usage = await usageRes.json();
        if (!usage.hasProLeadTools) {
          router.replace('/dashboard/upgrade');
          return;
        }
      } catch {
        router.replace('/dashboard/leads');
        return;
      } finally {
        setCheckingPlan(false);
      }
      fetchProfile();
    };
    void init();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/agent-profile');
      const result = await res.json();
      if (result.success) {
        if (result.data) {
          setEnabled(result.data.profile_enabled === true);
          setHeadline(result.data.profile_headline || '');
          setBio(result.data.profile_bio || '');
          setPhotoUrl(result.data.profile_photo_url || '');
          setBrokerage(result.data.profile_brokerage || '');
          setLicense(result.data.profile_license || '');
          setWebsite(result.data.profile_website || '');
          setYearsExperience(
            result.data.profile_years_experience != null
              ? String(result.data.profile_years_experience)
              : ''
          );
          setSpecialties(result.data.profile_specialties || []);
          setAreas(result.data.profile_areas || []);
          setPhone(result.data.profile_phone || '');
          setEmail(result.data.profile_email || '');
        }
        setProfileUrl(result.profileUrl || '');
        setDisplayName(result.fullName || '');
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      const res = await fetch('/api/agent-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_enabled: enabled,
          profile_headline: headline,
          profile_bio: bio,
          profile_photo_url: photoUrl,
          profile_brokerage: brokerage,
          profile_license: license,
          profile_website: website,
          profile_years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
          profile_specialties: specialties,
          profile_areas: areas,
          profile_phone: phone,
          profile_email: email,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSaved(true);
        toast.success('Profile saved');
        if (result.data) {
          setEnabled(result.data.profile_enabled === true);
        }
        if (result.warning) {
          setSaveError(result.warning);
        }
      } else {
        setSaveError(result.error || 'Could not save profile. Please try again.');
      }
    } catch (e) {
      console.error('Error saving profile:', e);
      setSaveError('Could not save profile. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleCopy = async () => {
    if (!profileUrl) return;
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const addArea = () => {
    if (newArea.trim() && !areas.includes(newArea.trim())) {
      setAreas([...areas, newArea.trim()]);
      setNewArea('');
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-[10px] bg-gray-50 border border-gray-200 text-gray-900 text-[13px] placeholder-gray-450 focus:outline-none focus:border-gray-400';

  if (loading || checkingPlan) {
    return <PageLoadingSkeleton variant="account" />;
  }

  const saveButton = (
    <Button size="sm" onClick={handleSave} isLoading={saving}>
      {saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
      {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
    </Button>
  );

  return (
    <DashboardPage
      title="Agent profile"
      subtitle="Edit your public profile page"
      size="narrow"
      inline
      actions={
        <>
          {enabled && profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--surface)] text-gray-600 border border-gray-200 hover:text-gray-900 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </a>
          )}
          {saveButton}
        </>
      }
    >
      <LeadsSectionSwitcher active="capture" />

      <Link
        href="/dashboard/leads?tab=capture"
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to leads
      </Link>

      <div className="space-y-4">
            {saveError && (
              <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                {saveError}
              </div>
            )}
            {/* Public profile toggle */}
            <Surface flat padding="none" className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">Public profile</h3>
                  <p className="text-[12.5px] text-gray-600 mt-0.5">
                    Share your bio, listings, and lead form at your personal URL
                  </p>
                </div>
                <Switch checked={enabled} onChange={() => setEnabled(!enabled)} label="" />
              </div>
              {enabled && profileUrl && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-150">
                  <input
                    type="text"
                    readOnly
                    value={profileUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 font-mono text-gray-600 text-[12px] focus:outline-none cursor-text min-w-0 truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all border shrink-0 ${
                      copied
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-[var(--surface)] text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </Surface>

            {/* Basic info */}
            <Surface flat padding="none" className="p-5 space-y-4">
              <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-700" strokeWidth={1.8} /> Basic info
              </h3>
              {displayName && (
                <div>
                  <label className="block text-[12.5px] text-gray-600 mb-1.5">Display name</label>
                  <input type="text" value={displayName} readOnly className={inputClass + ' bg-gray-100 text-gray-600'} />
                  <p className="text-[11.5px] text-gray-600 mt-1">From your account settings</p>
                </div>
              )}
              <div>
                <label className="block text-[12.5px] text-gray-600 mb-1.5">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Licensed Realtor | First-Time Buyer Specialist"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12.5px] text-gray-600 mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell potential clients about yourself, your experience, and how you can help..."
                  rows={5}
                  className={inputClass + ' resize-none'}
                />
                <p className="text-[11.5px] text-gray-600 mt-1 text-right">{bio.length} characters</p>
              </div>
              <div>
                <label className="block text-[12.5px] text-gray-600 mb-1.5">Profile photo URL</label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  className={inputClass}
                />
                {photoUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={photoUrl}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <p className="text-[12.5px] text-gray-600">Photo preview</p>
                  </div>
                )}
              </div>
            </Surface>

            {/* Professional details */}
            <Surface flat padding="none" className="p-5 space-y-4">
              <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-700" strokeWidth={1.8} /> Professional details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] text-gray-600 mb-1.5">Brokerage</label>
                  <input
                    type="text"
                    value={brokerage}
                    onChange={(e) => setBrokerage(e.target.value)}
                    placeholder="e.g. Keller Williams"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] text-gray-600 mb-1.5">License #</label>
                  <input
                    type="text"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="e.g. DRE #01234567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] text-gray-600 mb-1.5">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] text-gray-600 mb-1.5">Years of experience</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g. 10"
                    className={inputClass}
                  />
                </div>
              </div>
            </Surface>

            {/* Contact */}
            <Surface flat padding="none" className="p-5 space-y-4">
              <h3 className="text-[15px] font-semibold text-gray-900">Contact info (shown on profile)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] text-gray-600 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </Surface>

            {/* Specialties */}
            <Surface flat padding="none" className="p-5">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-gray-700" strokeWidth={1.8} /> Specialties
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-[13px] text-gray-700"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSpecialties(specialties.filter((x) => x !== s))}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  placeholder="e.g. Luxury Homes, First-Time Buyers"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-[var(--surface)] text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Surface>

            {/* Areas served */}
            <Surface flat padding="none" className="p-5">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-700" strokeWidth={1.8} /> Areas served
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {areas.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-[13px] text-gray-700"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => setAreas(areas.filter((x) => x !== a))}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                  placeholder="e.g. Visalia, Fresno County"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addArea}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-[var(--surface)] text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Surface>
      </div>
    </DashboardPage>
  );
}
