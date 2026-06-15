'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  ArrowLeft, Save, Loader2, User, Link2, Copy, Check,
  Plus, X, Eye,
} from 'lucide-react';

export default function ProfileEditorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newArea, setNewArea] = useState('');

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
          setEnabled(result.data.profile_enabled || false);
          setHeadline(result.data.profile_headline || '');
          setBio(result.data.profile_bio || '');
          setPhotoUrl(result.data.profile_photo_url || '');
          setSpecialties(result.data.profile_specialties || []);
          setAreas(result.data.profile_areas || []);
          setPhone(result.data.profile_phone || '');
          setEmail(result.data.profile_email || '');
        }
        setProfileUrl(result.profileUrl || '');
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
    try {
      const res = await fetch('/api/agent-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_enabled: enabled,
          profile_headline: headline,
          profile_bio: bio,
          profile_photo_url: photoUrl,
          profile_specialties: specialties,
          profile_areas: areas,
          profile_phone: phone,
          profile_email: email,
        }),
      });
      const result = await res.json();
      if (result.success) setSaved(true);
    } catch (e) {
      console.error('Error saving profile:', e);
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

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500';

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
    <div className="min-h-screen">
      <Header title="Agent Profile" subtitle="Edit your public profile page" />

      <div className="p-4 sm:p-6 text-gray-900 max-w-2xl">

        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/leads" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </Link>
          <div className="flex items-center gap-2">
            {enabled && profileUrl && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:text-brand-600 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-900 hover:bg-gray-100 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="space-y-6">

          {/* Enable toggle */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Public Profile</h3>
                <p className="text-xs text-gray-500 mt-0.5">Make your profile visible at your personal URL</p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-white' : 'bg-gray-100'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${enabled ? 'left-[22px] bg-gray-100' : 'left-0.5 bg-gray-500'}`} />
              </button>
            </div>
            {enabled && profileUrl && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  readOnly
                  value={profileUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-xs focus:outline-none cursor-text min-w-0"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border flex-shrink-0 ${
                    copied ? 'bg-gray-100 text-gray-900 border-gray-300' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Basic info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" /> Basic Info
            </h3>
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
                rows={4}
                className={inputClass + ' resize-none'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                className={inputClass}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Contact Info (shown on profile)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {specialties.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  {s}
                  <button onClick={() => setSpecialties(specialties.filter(x => x !== s))} className="text-gray-600 hover:text-gray-900">
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
              <button onClick={addSpecialty} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-brand-600 transition-colors flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Areas served */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Areas Served</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {areas.map(a => (
                <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  {a}
                  <button onClick={() => setAreas(areas.filter(x => x !== a))} className="text-gray-600 hover:text-gray-900">
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
                placeholder="e.g. Miami Beach, Coral Gables"
                className={inputClass}
              />
              <button onClick={addArea} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-brand-600 transition-colors flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
