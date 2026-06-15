'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Plus, DoorOpen, MapPin, Clock, Download, Link2,
  Copy, Check, ArrowLeft, X, Loader2, CalendarDays,
} from 'lucide-react';

interface OpenHouse {
  id: string;
  property_address: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: 'active' | 'ended';
  created_at: string;
}

export default function OpenHousesPage() {
  const [openHouses, setOpenHouses] = useState<OpenHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    document.title = 'Open Houses - Realestic';
    fetchOpenHouses();
  }, []);

  const fetchOpenHouses = async () => {
    try {
      const res = await fetch('/api/open-houses');
      const result = await res.json();
      if (result.success) setOpenHouses(result.data);
    } catch (e) {
      console.error('Error fetching open houses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/open-houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_address: address,
          date,
          start_time: startTime,
          end_time: endTime,
          notes,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setOpenHouses(prev => [result.data, ...prev]);
        setShowCreate(false);
        setAddress('');
        setDate('');
        setNotes('');
      }
    } catch (e) {
      console.error('Error creating open house:', e);
    } finally {
      setCreating(false);
    }
  };

  const getSignInUrl = (id: string) => `${window.location.origin}/open-house/${id}`;

  const handleCopy = async (id: string) => {
    await navigator.clipboard.writeText(getSignInUrl(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQR = (id: string) => {
    const canvas = document.getElementById(`oh-qr-${id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `open-house-${id.slice(0, 8)}.png`;
    a.click();
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-brand-500';

  return (
    <div className="min-h-screen">
      <Header title="Open Houses" subtitle="Create sign-in pages for your open house events" />

      <div className="p-4 sm:p-6 text-gray-900">

        {/* Back + Create */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/leads" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </Link>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-900 hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? 'Cancel' : 'New Open House'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Property Address *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="123 Main St, City, State" className={inputClass} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Start *</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">End *</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Notes (optional)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Refreshments provided" className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-lg bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Open House
            </button>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-50 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-50 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : openHouses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <DoorOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No open houses yet</p>
            <p className="text-gray-600 text-sm">Create one to get a QR code sign-in page for visitors.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openHouses.map(oh => {
              const displayDate = new Date(oh.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              });
              const isCopied = copiedId === oh.id;
              const isEnded = oh.status === 'ended';

              return (
                <div key={oh.id} className={`bg-white border rounded-xl p-5 ${isEnded ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{oh.property_address}</h3>
                        {isEnded && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">Ended</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {displayDate}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {oh.start_time.slice(0, 5)} – {oh.end_time.slice(0, 5)}</span>
                      </div>
                      {oh.notes && <p className="text-xs text-gray-600 mt-2">{oh.notes}</p>}

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleCopy(oh.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            isCopied ? 'bg-gray-100 text-gray-900 border-gray-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-900'
                          }`}
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Copied' : 'Copy Link'}
                        </button>
                        <button
                          onClick={() => handleDownloadQR(oh.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:text-brand-600 transition-colors"
                        >
                          <Download className="w-3 h-3" /> QR
                        </button>
                        <a
                          href={getSignInUrl(oh.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
                        >
                          <Link2 className="w-3 h-3" /> Preview
                        </a>
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-xl flex-shrink-0">
                      <QRCodeCanvas
                        id={`oh-qr-${oh.id}`}
                        value={getSignInUrl(oh.id)}
                        size={80}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="M"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
