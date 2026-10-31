'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, UserRound } from 'lucide-react';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { useApi } from '@/lib/swr';
import { useToast } from '@/components/providers/ToastProvider';
import type { ProfileListingStatus, PropertyInfo } from '@/types';

const OPTIONS = [
  { value: 'hidden', label: 'Not shown' },
  { value: 'active', label: 'Show as For sale' },
  { value: 'pending', label: 'Show as Pending' },
  { value: 'sold', label: 'Show as Sold' },
];

interface Props {
  projectId: string;
  status: ProfileListingStatus | null | undefined;
  propertyInfo: PropertyInfo | undefined;
  onSaved: (changes: { profile_status?: ProfileListingStatus | null; property_info?: PropertyInfo }) => void;
}

/** Lets the agent put this listing on their public agent profile (off unless they choose). */
export default function ProjectProfileListingCard({ projectId, status, propertyInfo, onSaved }: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState(propertyInfo?.listing_url ?? '');
  const { response: profileResponse } = useApi('/api/agent-profile');
  const profileUrl = (profileResponse?.profileUrl as string) || '';
  const profileOn = (profileResponse?.data as { profile_enabled?: boolean } | null)?.profile_enabled === true;

  const save = async (body: Record<string, unknown>, done: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Could not save');
      }
      onSaved(body as never);
      toast.success(done);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const saveLink = () => {
    const trimmed = link.trim();
    if (trimmed === (propertyInfo?.listing_url ?? '')) return;
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast.error('Paste the full link, starting with https://');
      return;
    }
    void save({ property_info: { ...(propertyInfo ?? {}), listing_url: trimmed || undefined } }, 'Listing link saved');
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gray-100 text-gray-900">
          <UserRound className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-gray-900">Agent profile</h2>
          <p className="text-[13px] text-gray-600">
            Show this home on your public profile with its photos, price, and details.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="On my profile"
          options={OPTIONS}
          value={status ?? 'hidden'}
          disabled={saving}
          onChange={(value) => {
            const next = value === 'hidden' ? null : (value as ProfileListingStatus);
            void save({ profile_status: next }, next ? 'Shown on your agent profile' : 'Removed from your agent profile');
          }}
        />
        <div>
          <label htmlFor="listing-link" className="mb-1.5 block text-sm font-medium text-gray-700">
            Zillow / Redfin link (optional)
          </label>
          <input
            id="listing-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onBlur={saveLink}
            placeholder="https://www.zillow.com/homedetails/…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {status && profileUrl && (
        <p className="mt-3 text-[12.5px] text-gray-600">
          {profileOn ? (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
              View your profile <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <>
              Your profile is turned off.{' '}
              <Link href="/dashboard/leads/profile" className="font-medium text-brand-600 hover:underline">
                Turn it on
              </Link>{' '}
              so visitors can see this home.
            </>
          )}
        </p>
      )}
    </Card>
  );
}
