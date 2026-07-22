'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, Clock, MapPin, Loader2, ChevronLeft } from 'lucide-react';
import { formatDateLabel, formatTimeInZone } from '@/lib/timezone';

interface DaySlots {
  date: string;
  slots: string[];
}

interface AvailabilityResponse {
  success: boolean;
  agentName?: string;
  durationMinutes?: number;
  timezone?: string;
  location?: string | null;
  availability?: DaySlots[];
  error?: string;
}

interface BookingSchedulerProps {
  agentId: string;
  agentName: string;
}

export default function BookingScheduler({ agentId, agentName }: BookingSchedulerProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/booking/${agentId}`)
      .then((res) => res.json())
      .then((result: AvailabilityResponse) => {
        if (cancelled) return;
        if (!result.success) {
          setLoadError(result.error || 'This booking link is not available.');
        } else {
          setData(result);
          const firstDay = result.availability?.[0];
          if (firstDay) setSelectedDate(firstDay.date);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Something went wrong. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const timezone = data?.timezone || 'America/New_York';
  const availability = data?.availability || [];
  const selectedDay = useMemo(
    () => availability.find((d) => d.date === selectedDate) || null,
    [availability, selectedDate],
  );

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!selectedSlot) {
      setSubmitError('Please select a time.');
      return;
    }
    if (!form.name.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setSubmitError('Please provide an email or phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/booking/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, startTime: selectedSlot }),
      });
      const result = await res.json();
      if (result.success) {
        setConfirmed(true);
      } else {
        setSubmitError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (loadError || availability.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">No times available</h2>
        <p className="text-sm text-gray-700 max-w-xs mx-auto">
          {loadError || `${agentName.split(' ')[0]} doesn't have any open slots right now. Please reach out directly.`}
        </p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-6">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
        {selectedSlot && (
          <p className="text-gray-700 text-sm font-medium mb-1">
            {formatDateLabel(selectedSlot.slice(0, 10))} at {formatTimeInZone(selectedSlot, timezone)}
          </p>
        )}
        <p className="text-gray-700 text-sm max-w-xs mx-auto mt-2">
          {agentName.split(' ')[0]} has been notified and will see you then.
          {form.email ? ' A confirmation was sent to your email.' : ''}
        </p>
      </div>
    );
  }

  // Step 2: contact details, once a slot is picked
  if (selectedSlot) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedSlot(null)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-brand-600 transition-colors mb-5"
        >
          <ChevronLeft className="w-4 h-4" /> Choose a different time
        </button>

        <div className="mb-6 rounded-lg bg-brand-500/5 border border-brand-500/20 px-4 py-3 flex items-center gap-2 text-sm text-brand-800">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            {formatDateLabel(selectedSlot.slice(0, 10))} at {formatTimeInZone(selectedSlot, timezone)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Full name <span className="text-gray-700">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Jane Smith"
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="jane@example.com"
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 -mt-1">At least one contact method required.</p>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Anything the agent should know? <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              rows={3}
              placeholder="e.g. the property address, or questions you have"
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-sm"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg px-6 py-3.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed bg-brand-500 text-[var(--brand-foreground)] hover:bg-brand-600 focus:ring-brand-500/40"
          >
            {submitting ? 'Confirming...' : 'Confirm showing'}
          </button>
        </form>
      </div>
    );
  }

  // Step 1: pick a date + time
  return (
    <div>
      {data?.location && (
        <div className="mb-5 flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="w-4 h-4 shrink-0 text-brand-600" />
          {data.location}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {availability.map((day) => {
          const selected = day.date === selectedDate;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={`flex flex-col items-center shrink-0 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all min-w-[76px] ${
                selected
                  ? 'border-brand-500 bg-brand-500/10 text-brand-800'
                  : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:text-gray-900'
              }`}
            >
              <span className="text-xs uppercase tracking-wide">
                {formatDateLabel(day.date).split(',')[0]}
              </span>
              <span className="text-base">{formatDateLabel(day.date).split(', ')[1]}</span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {selectedDay.slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-brand-500 hover:bg-brand-500/5 hover:text-brand-800 transition-all"
            >
              {formatTimeInZone(slot, timezone)}
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-700 mt-6">
        Times shown in {timezone.replace('_', ' ').split('/').pop()} time
        {data?.durationMinutes ? ` · ${data.durationMinutes} min` : ''}
      </p>
    </div>
  );
}
