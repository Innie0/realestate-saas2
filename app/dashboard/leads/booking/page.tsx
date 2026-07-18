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
import { supabase } from '@/lib/supabase';
import { TIMEZONE_OPTIONS } from '@/lib/timezone';
import {
  ArrowLeft, Save, Check, Copy, Eye,
  Clock, CalendarDays, MapPin,
} from 'lucide-react';

const WEEKDAYS = [
  { value: 0, short: 'Sun' },
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90];

export default function BookingSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState(30);
  const [noticeHours, setNoticeHours] = useState(4);
  const [windowDays, setWindowDays] = useState(14);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [location, setLocation] = useState('');

  useEffect(() => {
    document.title = 'Booking Link - Oikaro';
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
      fetchSettings();
    };
    void init();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName: string = user.user_metadata?.full_name || '';
      const nameSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = nameSlug ? `${nameSlug}--${user.id}` : user.id;
      setBookingUrl(`${window.location.origin}/book/${slug}`);
    });
  }, [router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/agent-settings');
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        setEnabled(d.booking_enabled === true);
        setDuration(d.booking_duration_minutes || 30);
        setNoticeHours(d.booking_notice_hours ?? 4);
        setWindowDays(d.booking_window_days || 14);
        setDays(Array.isArray(d.booking_days) && d.booking_days.length > 0 ? d.booking_days : [1, 2, 3, 4, 5]);
        setStartTime(d.booking_start_time || '09:00');
        setEndTime(d.booking_end_time || '17:00');
        setTimezone(d.booking_timezone || 'America/New_York');
        setLocation(d.booking_location || '');
      }
    } catch (e) {
      console.error('Error fetching booking settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (value: number) => {
    setDays((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/agent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_enabled: enabled,
          booking_duration_minutes: duration,
          booking_notice_hours: noticeHours,
          booking_window_days: windowDays,
          booking_days: days,
          booking_start_time: startTime,
          booking_end_time: endTime,
          booking_timezone: timezone,
          booking_location: location,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSaved(true);
        toast.success('Booking settings saved');
      } else {
        toast.error(result.error || 'Could not save settings. Please try again.');
      }
    } catch (e) {
      console.error('Error saving booking settings:', e);
      toast.error('Could not save settings. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleCopy = async () => {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      title="Booking link"
      subtitle="Let leads pick an open time and book a showing themselves"
      size="narrow"
      inline
      actions={
        <>
          {enabled && bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:text-gray-900 transition-colors"
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
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-450 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to leads
      </Link>

      <div className="space-y-4">
        {/* Enable + link */}
        <Surface flat padding="none" className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Accept bookings</h3>
              <p className="text-[12.5px] text-gray-450 mt-0.5">
                Turn on your public link so leads can self-schedule a showing
              </p>
            </div>
            <Switch checked={enabled} onChange={() => setEnabled(!enabled)} label="" />
          </div>
          {enabled && bookingUrl && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-150">
              <input
                type="text"
                readOnly
                value={bookingUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 font-mono text-gray-600 text-[12px] focus:outline-none cursor-text min-w-0 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all border shrink-0 ${
                  copied
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </Surface>

        {/* Availability */}
        <Surface flat padding="none" className="p-5 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-500" strokeWidth={1.8} /> Available days
          </h3>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ value, short }) => {
              const selected = days.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={`w-12 py-2 rounded-lg border text-[12.5px] font-medium transition-all ${
                    selected
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {short}
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[12.5px] text-gray-450 mb-1.5">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-450 mb-1.5">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-450 mb-1.5">Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-450 mb-1.5">Showing length</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
          </div>
        </Surface>

        {/* Booking rules */}
        <Surface flat padding="none" className="p-5 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" strokeWidth={1.8} /> Booking rules
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] text-gray-450 mb-1.5">Minimum notice</label>
              <select value={noticeHours} onChange={(e) => setNoticeHours(Number(e.target.value))} className={inputClass}>
                <option value={0}>No minimum</option>
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>1 day</option>
                <option value={48}>2 days</option>
              </select>
              <p className="text-[11.5px] text-gray-450 mt-1">How far in advance a lead must book</p>
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-450 mb-1.5">Booking window</label>
              <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))} className={inputClass}>
                <option value={7}>1 week ahead</option>
                <option value={14}>2 weeks ahead</option>
                <option value={30}>1 month ahead</option>
                <option value={60}>2 months ahead</option>
              </select>
              <p className="text-[11.5px] text-gray-450 mt-1">How far ahead leads can schedule</p>
            </div>
          </div>
        </Surface>

        {/* Location */}
        <Surface flat padding="none" className="p-5 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" strokeWidth={1.8} /> Default location
          </h3>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Meet at the property, or your office address"
            className={inputClass}
          />
          <p className="text-[11.5px] text-gray-450">
            Shown to leads when booking. You can always update the exact property address later on the calendar event.
          </p>
        </Surface>
      </div>
    </DashboardPage>
  );
}
