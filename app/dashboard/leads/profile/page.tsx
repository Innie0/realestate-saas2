'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  ArrowLeft, Save, Loader2, User, Copy, Check,
  Plus, X, Eye, Award, Globe, Briefcase,
} from 'lucide-react';

export default function ProfileEditorPage() {
  const [loading, setLoading] = useState(true);
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
    document.title = 'Agent Profile - Realestic';
    fetchProfile();
  }, []);

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
    'w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500';

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Agent Profile" subtitle="Edit your public profile page" />
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header title="Agent Profile" subtitle="Edit your public profile page" />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-3xl text-gray-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Link
              href="/dashboard/leads"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Leads
            </Link>
            <div className="flex items-center gap-2">
              {enabled && profileUrl && (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:text-brand-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </a>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {saveError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {saveError}
              </div>
            )}
            {/* Public profile toggle */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Public profile</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Share your bio, listings, and lead form at your personal URL
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                    enabled ? 'bg-brand-500' : 'bg-gray-300'
                  }`}
                  aria-pressed={enabled}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {enabled && profileUrl && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <input
                    type="text"
                    readOnly
                    value={profileUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-xs focus:outline-none cursor-text min-w-0"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border shrink-0 ${
                      copied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            {/* Basic info */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" /> Basic info
              </h3>
              {displayName && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Display name</label>
                  <input type="text" value={displayName} readOnly className={inputClass + ' bg-gray-100 text-gray-600'} />
                  <p className="text-[11px] text-gray-500 mt-1">From your account settings</p>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Licensed Realtor | First-Time Buyer Specialist"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell potential clients about yourself, your experience, and how you can help..."
                  rows={5}
                  className={inputClass + ' resize-none'}
                />
                <p className="text-[11px] text-gray-500 mt-1 text-right">{bio.length} characters</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Profile photo URL</label>
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
                    <p className="text-xs text-gray-500">Photo preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Professional details */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" /> Professional details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Brokerage</label>
                  <input
                    type="text"
                    value={brokerage}
                    onChange={(e) => setBrokerage(e.target.value)}
                    placeholder="e.g. Keller Williams"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">License #</label>
                  <input
                    type="text"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="e.g. DRE #01234567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Years of experience</label>
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
            </div>

            {/* Contact */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Contact info (shown on profile)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" /> Specialties
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSpecialties(specialties.filter((x) => x !== s))}
                      className="text-gray-400 hover:text-gray-900"
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
                  className="px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-600 hover:bg-brand-500/15 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Areas served */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-600" /> Areas served
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {areas.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => setAreas(areas.filter((x) => x !== a))}
                      className="text-gray-400 hover:text-gray-900"
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
                  className="px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-600 hover:bg-brand-500/15 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
