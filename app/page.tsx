'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Home, TrendingUp, Shield, Sparkles, Users, Calendar, ArrowRight,
  FileText, Search, Bell, CheckCircle, ChevronDown, Clock, Zap, Star,
  Upload, ImageIcon, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

// ─── CountUp Component ────────────────────────────────────────────────────────

function CountUp({ end, suffix = '', duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Feature Tile ─────────────────────────────────────────────────────────────

function FeatureTile({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' as const }}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
      className="group relative bg-[#111111] rounded-2xl p-8 cursor-pointer overflow-hidden border border-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <motion.div className="relative z-10 mb-6 inline-block" whileHover={{ y: -4, transition: { duration: 0.2 } }}>
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
          <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
      </motion.div>
      <h3 className="relative z-10 text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="relative z-10 text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
    </motion.div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="border border-white/10 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── AI Demo Mockup ───────────────────────────────────────────────────────────

function AIDemoMockup() {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  const fullDescription = 'Stunning 4-bedroom Mediterranean estate featuring soaring ceilings, a chef\'s kitchen with marble countertops, and a resort-style backyard with infinity pool. Natural light floods every room through floor-to-ceiling windows...';

  useEffect(() => {
    if (!inView) return;
    setPhase(0);
    setTypedText('');
    setProgress(0);

    // Phase 0: Upload (0–2s)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + 2;
      });
    }, 35);

    // Phase 1: Analyzing (2s)
    const t1 = setTimeout(() => setPhase(1), 2000);

    // Phase 2: Typing (3.5s)
    const t2 = setTimeout(() => setPhase(2), 3500);

    // Phase 3: Done (7.5s)
    const t3 = setTimeout(() => setPhase(3), 7500);

    // Restart loop (10s)
    const t4 = setTimeout(() => {
      setPhase(0);
      setTypedText('');
      setProgress(0);
    }, 10000);

    return () => {
      clearInterval(progressInterval);
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, [inView]);

  useEffect(() => {
    if (phase !== 2) return;
    setTypedText('');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedText(fullDescription.slice(0, i));
      if (i >= fullDescription.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div ref={ref} className="rounded-2xl bg-[#111111] border border-white/10 p-5 aspect-video flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Uploading photo...</span>
            </div>
            <div className="flex-1 rounded-lg border border-white/5 relative overflow-hidden">
              <Image src="/demo-house.png" alt="Property" fill className="object-cover opacity-60" />
              <motion.div className="absolute inset-0 bg-black" initial={{ scaleX: 1 }} animate={{ scaleX: 1 - progress / 100 }} style={{ transformOrigin: 'right' }} />
            </div>
            <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5">
              <motion.div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="mb-3">
              <Loader2 className="w-8 h-8 text-purple-400" />
            </motion.div>
            <p className="text-sm text-white font-medium">Analyzing with AI...</p>
            <p className="text-xs text-gray-500 mt-1">Identifying features & style</p>
            <div className="flex gap-1.5 mt-4">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">Generating description...</span>
            </div>
            <div className="flex-1 rounded-lg bg-[#1a1a1a] border border-white/5 p-4 overflow-hidden">
              <p className="text-sm text-gray-300 leading-relaxed">
                {typedText}
                <motion.span className="inline-block w-0.5 h-4 bg-white ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
              </p>
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
              <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
            </motion.div>
            <p className="text-base text-white font-semibold">Description ready!</p>
            <p className="text-xs text-gray-500 mt-1">247 words generated in 4.2 seconds</p>
            <div className="flex gap-2 mt-4">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-gray-300">Copy</span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-gray-300">Refine</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CRM Demo Mockup ──────────────────────────────────────────────────────────

const clients = [
  { name: 'Sarah Johnson', status: 'Active', note: 'Interested in 4BR homes in Riverside', initials: 'SJ', color: 'bg-blue-500' },
  { name: 'Marcus Williams', status: 'Follow-up', note: 'Viewing scheduled for Saturday 2pm', initials: 'MW', color: 'bg-purple-500' },
  { name: 'Emily Chen', status: 'Closed', note: 'Closed on Oak Street property ✓', initials: 'EC', color: 'bg-green-500' },
];

const statusColors: Record<string, string> = {
  Active: 'bg-blue-500/20 text-blue-400',
  'Follow-up': 'bg-yellow-500/20 text-yellow-400',
  Closed: 'bg-green-500/20 text-green-400',
};

function CRMDemoMockup() {
  const [phase, setPhase] = useState(0);
  const [visibleClients, setVisibleClients] = useState(0);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [typedNote, setTypedNote] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    setPhase(0);
    setVisibleClients(0);
    setSelectedClient(null);
    setTypedNote('');

    // Stagger clients appearing
    const t1 = setTimeout(() => setVisibleClients(1), 400);
    const t2 = setTimeout(() => setVisibleClients(2), 900);
    const t3 = setTimeout(() => setVisibleClients(3), 1400);

    // Select a client
    const t4 = setTimeout(() => { setPhase(1); setSelectedClient(0); }, 2400);

    // Type a note
    const t5 = setTimeout(() => setPhase(2), 3200);

    // Done — show full profile
    const t6 = setTimeout(() => setPhase(3), 6500);

    // Restart
    const t7 = setTimeout(() => {
      setPhase(0);
      setVisibleClients(0);
      setSelectedClient(null);
      setTypedNote('');
    }, 10000);

    return () => [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
  }, [inView]);

  useEffect(() => {
    if (phase !== 2) return;
    const newNote = 'Budget up to $1.2M. Prefers open floor plan and large backyard.';
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedNote(newNote.slice(0, i));
      if (i >= newNote.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div ref={ref} className="rounded-2xl bg-[#111111] border border-white/10 p-5 aspect-video flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400 font-medium">Client Manager</span>
        <span className="ml-auto text-xs text-gray-600">{clients.length} clients</span>
      </div>

      <div className="flex flex-1 gap-3 min-h-0">
        {/* Client list */}
        <div className="flex flex-col gap-2 w-2/5 flex-shrink-0">
          {clients.map((client, i) => (
            <AnimatePresence key={i}>
              {visibleClients > i && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedClient === i
                      ? 'bg-white/10 border-white/20'
                      : 'bg-[#1a1a1a] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full ${client.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                    {client.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white font-medium truncate">{client.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[client.status]}`}>
                      {client.status}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedClient !== null && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 bg-[#1a1a1a] rounded-xl border border-white/5 p-3 flex flex-col gap-2 min-w-0"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${clients[selectedClient].color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {clients[selectedClient].initials}
                </div>
                <div>
                  <p className="text-xs text-white font-semibold">{clients[selectedClient].name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[clients[selectedClient].status]}`}>
                    {clients[selectedClient].status}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Last note</div>
              <p className="text-xs text-gray-400 leading-relaxed">{clients[selectedClient].note}</p>

              {phase >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">New note</div>
                  <div className="bg-[#111111] rounded-lg p-2 mt-1 border border-white/5">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {typedNote}
                      {phase === 2 && (
                        <motion.span className="inline-block w-0.5 h-3 bg-white ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
                      )}
                    </p>
                  </div>
                </motion.div>
              )}

              {phase >= 3 && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-2 mt-auto">
                  <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] text-gray-300">Save note</span>
                  <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] text-gray-300">Schedule follow-up</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Calendar Demo Mockup ─────────────────────────────────────────────────────

const calendarEvents = [
  { day: 8, time: '9:00 AM', label: 'Client Call — Johnson', color: 'bg-blue-500/30 border-blue-500/50 text-blue-300' },
  { day: 11, time: '2:00 PM', label: 'Showing — Oak Street', color: 'bg-purple-500/30 border-purple-500/50 text-purple-300' },
  { day: 15, time: '11:00 AM', label: 'Closing — Chen Deal', color: 'bg-green-500/30 border-green-500/50 text-green-300' },
];

const calendarDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const calendarNums = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];

function CalendarDemoMockup() {
  const [phase, setPhase] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showSynced, setShowSynced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    setPhase(0);
    setVisibleEvents(0);
    setShowNotification(false);
    setShowNewEvent(false);
    setShowSynced(false);

    const t1 = setTimeout(() => setVisibleEvents(1), 600);
    const t2 = setTimeout(() => setVisibleEvents(2), 1200);
    const t3 = setTimeout(() => setVisibleEvents(3), 1800);
    const t4 = setTimeout(() => setShowNewEvent(true), 3000);
    const t5 = setTimeout(() => setShowNotification(true), 4500);
    const t6 = setTimeout(() => setShowNotification(false), 7000);
    const t7 = setTimeout(() => setShowSynced(true), 7200);
    const t8 = setTimeout(() => {
      setPhase(0);
      setVisibleEvents(0);
      setShowNotification(false);
      setShowNewEvent(false);
      setShowSynced(false);
    }, 10500);

    return () => [t1,t2,t3,t4,t5,t6,t7,t8].forEach(clearTimeout);
  }, [inView]);

  const eventDays = calendarEvents.map(e => e.day);

  return (
    <div ref={ref} className="rounded-2xl bg-[#111111] border border-white/10 p-5 aspect-video flex flex-col overflow-hidden relative">
      {/* Notification pop-up */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="absolute top-3 right-3 z-20 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl flex items-start gap-2 w-56"
          >
            <Bell className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-white font-semibold">Reminder</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Showing — Oak Street in 1 hour</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">April 2026</span>
        </div>
        <AnimatePresence>
          {showSynced && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, type: 'spring' }} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400">Synced with Google</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1 flex-shrink-0">
        {calendarDays.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-600 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarNums.map(n => {
          const eventIdx = calendarEvents.findIndex(e => e.day === n);
          const hasEvent = eventIdx !== -1 && visibleEvents > eventIdx;
          const isNewEvent = n === 19 && showNewEvent;
          const isToday = n === 5;

          return (
            <motion.div
              key={n}
              className={`relative rounded-lg flex flex-col items-center justify-start pt-1 pb-1 text-[10px] font-medium min-h-0 cursor-pointer transition-colors ${
                isToday ? 'bg-white text-black' :
                hasEvent || isNewEvent ? 'bg-white/5' : 'hover:bg-white/5 text-gray-500'
              }`}
            >
              <span className={isToday ? 'text-black' : hasEvent || isNewEvent ? 'text-white' : ''}>{n}</span>
              {hasEvent && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-0.5 w-full px-0.5`}
                >
                  <div className={`h-1 rounded-full ${calendarEvents[eventIdx].color.split(' ')[0]}`} />
                </motion.div>
              )}
              {isNewEvent && (
                <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.4 }} className="mt-0.5 w-full px-0.5">
                  <div className="h-1 rounded-full bg-yellow-500/60" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Event list */}
      <div className="mt-3 space-y-1.5 flex-shrink-0">
        {calendarEvents.map((event, i) => visibleEvents > i && (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] ${event.color}`}
          >
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">Apr {event.day} · {event.time}</span>
            <span className="text-white/60 truncate">— {event.label}</span>
          </motion.div>
        ))}
        {showNewEvent && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-yellow-500/50 bg-yellow-500/20 text-yellow-300 text-[10px]">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">Apr 19 · 3:00 PM</span>
            <span className="text-white/60 truncate">— New Listing Walkthrough</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const isAdmin = session.user.email === 'callon786@outlook.com';
          if (isAdmin) { router.push('/dashboard'); return; }

          const { data: userData } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', session.user.id)
            .single();

          const hasActiveSubscription =
            userData?.subscription_status === 'active' ||
            userData?.subscription_status === 'trialing';

          if (hasActiveSubscription) router.push('/dashboard');
        }
      } catch {}
    };
    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* Dot grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }} />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-50 border-b border-white/10 backdrop-blur-md bg-black/50"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-center sm:justify-between">
            <motion.div
              className="flex items-center absolute left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 lg:left-8"
              whileHover={{ scale: 1.02 }}
            >
              <Image src="/logo.png" alt="Realestic" width={240} height={72} priority className="sm:hidden h-12 w-auto object-contain" />
              <Image src="/logo-landing.png" alt="Realestic" width={1400} height={420} priority className="hidden sm:block h-80 w-auto" />
            </motion.div>
            <div className="flex-1" />
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/auth/login">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Sign In
                </motion.button>
              </Link>
              <Link href="/auth/signup">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,255,255,0.2)' }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors">
                  Get Started
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-32 lg:px-8 lg:pt-32 lg:pb-40">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-gray-300 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                AI-Powered Real Estate Platform
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Work Smarter</span>
              <br />
              <span className="text-white">Close Faster</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-6 sm:mt-8 text-base sm:text-lg text-gray-400 leading-relaxed max-w-xl">
              Transform your workflow as a real estate agent with intelligent tools designed for you.
              Manage leads, schedule showings, and close more deals with our AI-powered platform.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255,0.3)' }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto group px-8 py-4 text-base font-semibold bg-white text-black rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white border border-white/30 rounded-xl backdrop-blur-sm transition-all">
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Floating cards */}
          <motion.div variants={itemVariants} className="hidden lg:block relative">
            <div className="relative w-full h-[500px]">
              <motion.div initial={{ opacity: 0, y: 50, rotate: -5 }} animate={{ opacity: 1, y: 0, rotate: -5 }} transition={{ duration: 0.8, delay: 0.5 }} whileHover={{ y: -10, rotate: 0, scale: 1.02, transition: { duration: 0.15 } }} className="absolute top-0 right-0 w-72 rounded-2xl p-6 shadow-2xl border border-white/10" style={{ backgroundColor: '#0d1117' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-green-400" /></div>
                  <span className="text-sm font-medium text-gray-300">Monthly Growth</span>
                </div>
                <div className="text-3xl font-bold text-white">+24%</div>
                <div className="text-sm text-gray-500 mt-1">vs last month</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 50, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 3 }} transition={{ duration: 0.8, delay: 0.7 }} whileHover={{ y: -10, rotate: 0, scale: 1.02, transition: { duration: 0.15 } }} className="absolute top-32 left-0 w-64 rounded-2xl p-6 shadow-2xl border border-white/10" style={{ backgroundColor: '#0d1117' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg"><Home className="w-5 h-5 text-blue-400" /></div>
                  <span className="text-sm font-medium text-gray-300">Active Listings</span>
                </div>
                <div className="text-3xl font-bold text-white">47</div>
                <div className="text-sm text-gray-500 mt-1">Properties</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 50, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ duration: 0.8, delay: 0.9 }} whileHover={{ y: -10, rotate: 0, scale: 1.02, transition: { duration: 0.15 } }} className="absolute bottom-10 right-10 w-80 rounded-2xl p-6 shadow-2xl border border-white/10" style={{ backgroundColor: '#0d1117' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg"><Sparkles className="w-5 h-5 text-purple-400" /></div>
                  <span className="text-sm font-medium text-gray-300">AI Generated</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">"Stunning 4BR home with panoramic views, chef's kitchen, and resort-style backyard..."</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/10 bg-white/5 backdrop-blur-sm py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10, suffix: 'x', label: 'Faster Listing Descriptions' },
              { value: 5, suffix: '+', label: 'Hours Saved Per Week' },
              { value: 3, suffix: ' min', label: 'To Write a Full Listing' },
              { value: 100, suffix: '%', label: 'Built for Real Estate' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-gray-300 mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              Simple Setup
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Get started in minutes</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">No complicated setup. No learning curve. Just sign up and start saving time.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {[
              { step: '01', icon: CheckCircle, title: 'Create your account', description: 'Sign up in under 60 seconds with your email or Google account. No credit card required for your free trial.' },
              { step: '02', icon: Home, title: 'Add your properties & clients', description: 'Import or manually add your listings and clients. Organize everything in one clean dashboard.' },
              { step: '03', icon: Sparkles, title: 'Let AI do the heavy lifting', description: 'Generate listing descriptions, get reminders, and manage your entire pipeline — all with AI assistance.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 mb-6 relative">
                  <item.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Deep-Dive ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-32">

          {[
            {
              icon: Sparkles,
              tag: 'AI Content',
              title: 'Write stunning listing descriptions in seconds',
              description: 'Upload your property photos, enter a few details, and our AI instantly crafts a professional, compelling listing description. Refine it to exactly the word count and tone you want. No more staring at a blank page.',
              highlights: ['Generates in under 10 seconds', 'Customize tone and length', 'Works from photos + details'],
              flip: false,
            },
            {
              icon: Users,
              tag: 'CRM',
              title: 'Keep every client perfectly organized',
              description: 'All your clients, their preferences, notes, and history — in one clean place. Never lose track of a follow-up again. Add notes, track status, and see your entire pipeline at a glance.',
              highlights: ['Client notes & history', 'Status tracking', 'Instant search'],
              flip: true,
            },
            {
              icon: Calendar,
              tag: 'Scheduling',
              title: 'Never miss an appointment or deadline',
              description: 'Syncs with Google Calendar and Microsoft Outlook. Set automated reminders for showings, closings, and follow-ups. Stay on top of every transaction from offer to close.',
              highlights: ['Google & Outlook sync', 'Automated reminders', 'Transaction timelines'],
              flip: false,
            },
            {
              icon: Search,
              tag: 'Property Lookup',
              title: 'Get property details instantly',
              description: 'Look up any property address and pull key details fast — no more jumping between five different websites. Save time on every listing you work.',
              highlights: ['Instant property data', 'Save time on research', 'All in one place'],
              flip: true,
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
              className={`grid lg:grid-cols-2 gap-16 items-center ${feature.flip ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className={feature.flip ? 'lg:order-2' : ''}>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-gray-300 mb-6">
                  <feature.icon className="w-3.5 h-3.5" />
                  {feature.tag}
                </span>
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">{feature.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.highlights.map((h, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: j * 0.1 }}
                      className="flex items-center gap-3 text-gray-300"
                    >
                      <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                      {h}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className={feature.flip ? 'lg:order-1' : ''}>
                {i === 0 ? (
                  <AIDemoMockup />
                ) : i === 1 ? (
                  <CRMDemoMockup />
                ) : i === 2 ? (
                  <CalendarDemoMockup />
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                    className="rounded-2xl bg-[#111111] border border-white/10 p-8 aspect-video flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/10 mb-4">
                        <feature.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                      </div>
                      <p className="text-gray-500 text-sm">{feature.tag} Preview</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">succeed</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Powerful features designed to streamline your workflow and help you close more deals</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureTile icon={Home} title="Property Management" description="Streamline your listings with AI-powered descriptions, professional photo organization, and one-click publishing." delay={0} />
            <FeatureTile icon={Sparkles} title="AI Content Generation" description="Generate compelling listing descriptions, social media posts, and email templates in seconds with AI." delay={0.1} />
            <FeatureTile icon={Users} title="Client Management" description="Keep track of all your clients, their preferences, and communication history in one place." delay={0.2} />
            <FeatureTile icon={Calendar} title="Smart Scheduling" description="Sync with Google Calendar, manage showings, and never miss an important appointment." delay={0.3} />
            <FeatureTile icon={FileText} title="Transaction Tracking" description="Manage every deal from offer to close with checklists, timelines, and document storage." delay={0.4} />
            <FeatureTile icon={Shield} title="Secure & Reliable" description="Enterprise-grade security protecting your valuable client data with encrypted storage and backups." delay={0.5} />
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Frequently asked questions</h2>
            <p className="text-gray-400 text-lg">Everything you need to know about Realestic.</p>
          </motion.div>
          <div className="space-y-3">
            <FAQItem question="Is there a free trial?" answer="Yes! Every new account comes with a 7-day free trial on both the Starter and Pro plans. No credit card is required to try it out — you'll only be charged after your trial ends if you choose to continue." delay={0} />
            <FAQItem question="How does the AI listing description work?" answer="You provide your property details (bedrooms, bathrooms, square footage, features) and optionally upload photos. The AI analyzes everything and writes a professional, compelling listing description in seconds. You can then refine it — adjust the tone, length, or focus — until it's exactly what you want." delay={0.05} />
            <FAQItem question="Does it work for commercial real estate too?" answer="Absolutely. Realestic works for any type of real estate — residential, commercial, rental, and land. The AI adapts to the type of property you're working with." delay={0.1} />
            <FAQItem question="Can I cancel anytime?" answer="Yes, you can cancel your subscription at any time with no cancellation fees. If you cancel, you'll continue to have access until the end of your current billing period." delay={0.15} />
            <FAQItem question="Is my data secure?" answer="Yes. All data is encrypted in transit and at rest. We use enterprise-grade infrastructure and never sell your data to third parties. Your client information stays private and protected." delay={0.2} />
            <FAQItem question="What's the difference between Starter and Pro?" answer="The Starter plan ($14.99/month) is perfect for individual agents with limits on projects, AI messages, and property lookups per month. The Pro plan ($39.99/month) gives you unlimited access to everything — ideal for busy agents or small teams." delay={0.25} />
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-gray-300 mb-8">
              <Star className="w-4 h-4 text-yellow-400" />
              7-Day Free Trial — No Credit Card Required
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Stop wasting time.<br />
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Start closing more deals.
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Join real estate agents already using Realestic to save hours every week and win more listings.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(255,255,255,0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-10 py-4 text-lg font-semibold bg-white text-black rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-4 text-lg font-semibold text-white border border-white/30 rounded-xl transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">No setup fees. Cancel anytime.</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2026 Realestic. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
