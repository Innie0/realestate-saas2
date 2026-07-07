'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import WordmarkLogo from '@/components/branding/WordmarkLogo';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Home, TrendingUp, Shield, Sparkles, Users, Calendar, ArrowRight,
  FileText, Search, Bell, CheckCircle, ChevronDown, Clock, Zap, Star,
  Upload, ImageIcon, Loader2, Link2, Inbox, DoorOpen, Flame, Thermometer,
  Snowflake, BarChart2, QrCode, MapPin, UserPlus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PricingFeatureList from '@/components/PricingFeatureList';
import {
  STARTER_PLAN_DESCRIPTION,
  PRO_PLAN_DESCRIPTION,
  getPlanDisplayPrice,
  getPricingFootnote,
  isAnyAnnualBillingAvailable,
} from '@/lib/pricing';
import { MARKETING_FAQ_ITEMS } from '@/lib/marketing-faq';

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

/** Gentle infinite float — staggered per card like Atlas hero UI chips */
function heroCardFloat(duration: number, delay: number, y = 14, x = 0) {
  return {
    animate: {
      y: [0, -y, 0],
      ...(x !== 0 ? { x: [0, x, 0] } : {}),
    },
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      delay,
    },
  };
}

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
      className="group relative bg-white rounded-2xl p-8 cursor-pointer overflow-hidden border border-gray-200"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <motion.div className="relative z-10 mb-6 inline-block" whileHover={{ y: -4, transition: { duration: 0.2 } }}>
        <div className="p-3 bg-gray-100 rounded-xl backdrop-blur-sm border border-gray-200">
          <Icon className="h-8 w-8 text-gray-900" strokeWidth={1.5} />
        </div>
      </motion.div>
      <h3 className="relative z-10 text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="relative z-10 text-gray-500 leading-relaxed group-hover:text-brand-600 transition-colors">{description}</p>
    </motion.div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({
  question,
  answer,
  delay = 0,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  delay?: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="border border-gray-200 rounded-2xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-900 font-medium">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-500 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {MARKETING_FAQ_ITEMS.map((item, index) => (
        <FAQItem
          key={item.question}
          question={item.question}
          answer={item.answer}
          delay={index * 0.05}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
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
    <div ref={ref} className="rounded-2xl bg-white border border-gray-200 p-5 min-h-[280px] sm:aspect-video sm:min-h-0 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium">Uploading photo...</span>
            </div>
            <div className="flex-1 rounded-lg border border-gray-100 relative overflow-hidden">
              <Image src="/demo-house.png" alt="Property" fill className="object-cover opacity-60" />
              <motion.div className="absolute inset-0 bg-[#F5F5F5]" initial={{ scaleX: 1 }} animate={{ scaleX: 1 - progress / 100 }} style={{ transformOrigin: 'right' }} />
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
              <motion.div className="h-full bg-brand-500 rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="mb-3">
              <Loader2 className="w-8 h-8 text-brand-500" />
            </motion.div>
            <p className="text-sm text-gray-900 font-medium">Analyzing with AI...</p>
            <p className="text-xs text-gray-500 mt-1">Identifying features & style</p>
            <div className="flex gap-1.5 mt-4">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span className="text-xs text-brand-500 font-medium">Generating description...</span>
            </div>
            <div className="flex-1 rounded-lg bg-gray-100 border border-gray-100 p-4 overflow-hidden">
              <p className="text-sm text-gray-600 leading-relaxed">
                {typedText}
                <motion.span className="inline-block w-0.5 h-4 bg-brand-500 ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
              </p>
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
              <CheckCircle className="w-12 h-12 text-brand-500 mb-3" />
            </motion.div>
            <p className="text-base text-gray-900 font-semibold">Description ready!</p>
            <p className="text-xs text-gray-500 mt-1">247 words generated in 4.2 seconds</p>
            <div className="flex gap-2 mt-4">
              <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600">Copy</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600">Refine</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CRM Demo Mockup ──────────────────────────────────────────────────────────

const clients = [
  { name: 'Sarah Johnson', status: 'Active', note: 'Interested in 4BR homes in Riverside', initials: 'SJ', color: 'bg-brand-500' },
  { name: 'Marcus Williams', status: 'Follow-up', note: 'Viewing scheduled for Saturday 2pm', initials: 'MW', color: 'bg-brand-500' },
  { name: 'Emily Chen', status: 'Closed', note: 'Closed on Oak Street property ✓', initials: 'EC', color: 'bg-brand-500' },
];

const statusColors: Record<string, string> = {
  Active: 'bg-brand-500/20 text-brand-600',
  'Follow-up': 'bg-brand-400/20 text-brand-500',
  Closed: 'bg-brand-600/20 text-brand-700',
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
    <div ref={ref} className="rounded-2xl bg-white border border-gray-200 p-5 min-h-[280px] sm:aspect-video sm:min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500 font-medium">Client Manager</span>
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
                      ? 'bg-gray-100 border-gray-300'
                      : 'bg-gray-100 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full ${client.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                    {client.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-900 font-medium truncate">{client.name}</p>
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
              className="flex-1 bg-gray-100 rounded-xl border border-gray-100 p-3 flex flex-col gap-2 min-w-0"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${clients[selectedClient].color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {clients[selectedClient].initials}
                </div>
                <div>
                  <p className="text-xs text-gray-900 font-semibold">{clients[selectedClient].name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[clients[selectedClient].status]}`}>
                    {clients[selectedClient].status}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Last note</div>
              <p className="text-xs text-gray-500 leading-relaxed">{clients[selectedClient].note}</p>

              {phase >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">New note</div>
                  <div className="bg-white rounded-lg p-2 mt-1 border border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {typedNote}
                      {phase === 2 && (
                        <motion.span className="inline-block w-0.5 h-3 bg-brand-500 ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
                      )}
                    </p>
                  </div>
                </motion.div>
              )}

              {phase >= 3 && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-2 mt-auto">
                  <span className="px-2 py-1 rounded-lg bg-gray-100 border border-gray-200 text-[10px] text-gray-600">Save note</span>
                  <span className="px-2 py-1 rounded-lg bg-gray-100 border border-gray-200 text-[10px] text-gray-600">Schedule follow-up</span>
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
  { day: 8, time: '9:00 AM', label: 'Client Call — Johnson', color: 'bg-brand-500/30 border-brand-500/50 text-brand-400' },
  { day: 11, time: '2:00 PM', label: 'Showing — Oak Street', color: 'bg-brand-500/30 border-brand-500/50 text-brand-400' },
  { day: 15, time: '11:00 AM', label: 'Closing — Chen Deal', color: 'bg-brand-500/30 border-brand-500/50 text-brand-300' },
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
    <div ref={ref} className="rounded-2xl bg-white border border-gray-200 p-5 min-h-[280px] sm:aspect-video sm:min-h-0 flex flex-col overflow-hidden relative">
      {/* Notification pop-up */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="absolute top-3 right-3 z-20 bg-gray-100 border border-gray-200 rounded-xl p-3 shadow-2xl flex items-start gap-2 w-56"
          >
            <Bell className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-900 font-semibold">Reminder</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Showing — Oak Street in 1 hour</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500 font-medium">April 2026</span>
        </div>
        <AnimatePresence>
          {showSynced && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, type: 'spring' }} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-500/10 border border-brand-500/30">
              <CheckCircle className="w-3 h-3 text-brand-500" />
              <span className="text-[10px] text-brand-500">Synced with Google</span>
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
                isToday ? 'bg-brand-500 text-white' :
                hasEvent || isNewEvent ? 'bg-gray-50' : 'hover:bg-gray-50 text-gray-500'
              }`}
            >
              <span className={isToday ? 'text-white' : hasEvent || isNewEvent ? 'text-gray-900' : ''}>{n}</span>
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
                  <div className="h-1 rounded-full bg-brand-400/60" />
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
            <span className="text-gray-500 truncate">— {event.label}</span>
          </motion.div>
        ))}
        {showNewEvent && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-brand-500/50 bg-brand-500/20 text-brand-300 text-[10px]">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">Apr 19 · 3:00 PM</span>
            <span className="text-gray-500 truncate">— New Listing Walkthrough</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Property Research Demo (lookup + CMA) ────────────────────────────────────

function PropertyLookupDemoMockup() {
  const [phase, setPhase] = useState(0);
  const [typedAddress, setTypedAddress] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [visibleDetails, setVisibleDetails] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'cma'>('overview');
  const [visibleComps, setVisibleComps] = useState(0);
  const [showCmaValue, setShowCmaValue] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  const address = '123 W Main Street, Austin, TX';

  useEffect(() => {
    if (!inView) return;
    setPhase(0);
    setTypedAddress('');
    setShowResults(false);
    setVisibleDetails(0);
    setActiveTab('overview');
    setVisibleComps(0);
    setShowCmaValue(false);

    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 3000);
    const t3 = setTimeout(() => { setPhase(3); setShowResults(true); }, 4200);
    const t4 = setTimeout(() => setVisibleDetails(1), 4500);
    const t5 = setTimeout(() => setVisibleDetails(2), 4900);
    const t6 = setTimeout(() => setVisibleDetails(3), 5300);
    const t7 = setTimeout(() => setVisibleDetails(4), 5700);
    const t8 = setTimeout(() => { setActiveTab('cma'); setPhase(4); }, 7200);
    const t9 = setTimeout(() => setVisibleComps(1), 7600);
    const t10 = setTimeout(() => setVisibleComps(2), 8000);
    const t11 = setTimeout(() => setVisibleComps(3), 8400);
    const t12 = setTimeout(() => setShowCmaValue(true), 9000);
    const t13 = setTimeout(() => {
      setPhase(0); setTypedAddress(''); setShowResults(false);
      setVisibleDetails(0); setActiveTab('overview');
      setVisibleComps(0); setShowCmaValue(false);
    }, 13000);

    return () => [t1,t2,t3,t4,t5,t6,t7,t8,t9,t10,t11,t12,t13].forEach(clearTimeout);
  }, [inView]);

  useEffect(() => {
    if (phase !== 1) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedAddress(address.slice(0, i));
      if (i >= address.length) clearInterval(timer);
    }, 55);
    return () => clearInterval(timer);
  }, [phase]);

  const details = [
    { label: 'Beds', value: '4', icon: '🛏' },
    { label: 'Baths', value: '3', icon: '🚿' },
    { label: 'Sq Ft', value: '3,500', icon: '📐' },
    { label: 'Year Built', value: '2008', icon: '🏗' },
  ];

  const comps = [
    { address: '118 W Main St', price: '$498k', sqft: '3,420', distance: '0.2 mi' },
    { address: '131 Oak Lane', price: '$512k', sqft: '3,680', distance: '0.4 mi' },
    { address: '99 Elm Court', price: '$475k', sqft: '3,290', distance: '0.5 mi' },
  ];

  return (
    <div ref={ref} className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col overflow-hidden" style={{ minHeight: '360px' }}>
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Search className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500 font-medium">Property Research</span>
      </div>

      <div className="relative flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5">
          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-900 flex-1 truncate">
            {typedAddress}
            {phase === 1 && (
              <motion.span className="inline-block w-0.5 h-4 bg-brand-500 ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
            )}
          </span>
          {phase >= 2 && phase < 3 && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className="w-3.5 h-3.5 text-gray-500" />
            </motion.div>
          )}
          {phase >= 3 && <CheckCircle className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
        </div>
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 flex flex-col mt-3 min-h-0">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 border border-gray-200 rounded-lg mb-3">
              {(['overview', 'cma'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : 'Market / CMA'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  <p className="text-xs text-gray-900 font-medium truncate">123 W Main Street, Austin, TX 78701</p>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {details.map((d, i) => (
                    <AnimatePresence key={i}>
                      {visibleDetails > i && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="bg-gray-100 border border-gray-100 rounded-xl p-2 text-center"
                        >
                          <div className="text-base mb-0.5">{d.icon}</div>
                          <div className="text-xs font-bold text-gray-900">{d.value}</div>
                          <div className="text-[9px] text-gray-500">{d.label}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>

                {visibleDetails >= 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="bg-gray-100 border border-gray-100 rounded-xl p-3 flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Estimated Value</p>
                      <p className="text-base font-bold text-gray-900">$1,500,000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 mb-0.5">Price / sq ft</p>
                      <p className="text-sm font-semibold text-gray-900">$429</p>
                    </div>
                  </motion.div>
                )}

                {visibleDetails >= 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="bg-gray-100 border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Owner</p>
                      <p className="text-sm font-semibold text-gray-900">James R. Mitchell</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 mb-0.5">Phone</p>
                      <p className="text-sm font-semibold text-gray-900">(555) 555-5555</p>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-3.5 h-3.5 text-brand-500" />
                  <p className="text-[10px] text-gray-500 font-medium">Comparable sales · 0.5 mi · 12 mo</p>
                </div>
                <div className="space-y-2 flex-1">
                  {comps.map((comp, i) => (
                    <AnimatePresence key={comp.address}>
                      {visibleComps > i && (
                        <motion.div
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35 }}
                          className="flex items-center justify-between bg-gray-100 border border-gray-100 rounded-xl px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{comp.address}</p>
                            <p className="text-[10px] text-gray-500">{comp.sqft} sq ft · {comp.distance}</p>
                          </div>
                          <p className="text-xs font-bold text-gray-900 flex-shrink-0 ml-2">{comp.price}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>
                <AnimatePresence>
                  {showCmaValue && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="mt-3 p-3 rounded-xl bg-brand-50 border border-brand-200"
                    >
                      <p className="text-[10px] text-brand-700 font-medium mb-0.5">Suggested price range</p>
                      <p className="text-lg font-bold text-gray-900">$475k – $512k</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Based on 3 adjusted comps</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Lead Form Demo Mockup ───────────────────────────────────────────────────

function LeadFormDemoMockup() {
  const [phase, setPhase] = useState(0);
  const [typedName, setTypedName] = useState('');
  const [showBudget, setShowBudget] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  const name = 'Jane Smith';

  useEffect(() => {
    if (!inView) return;
    setPhase(0);
    setTypedName('');
    setShowBudget(false);
    setShowNotification(false);

    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 3000);
    const t3 = setTimeout(() => setShowBudget(true), 4000);
    const t4 = setTimeout(() => setPhase(3), 5500);
    const t5 = setTimeout(() => setShowNotification(true), 6200);
    const t6 = setTimeout(() => {
      setPhase(0); setTypedName(''); setShowBudget(false); setShowNotification(false);
    }, 10500);

    return () => [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
  }, [inView]);

  useEffect(() => {
    if (phase !== 1) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedName(name.slice(0, i));
      if (i >= name.length) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div ref={ref} className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col overflow-hidden relative" style={{ minHeight: '320px' }}>
      {/* Notification pop-up */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="absolute top-3 right-3 z-20 bg-gray-100 border border-gray-200 rounded-xl p-3 shadow-2xl flex items-start gap-2 w-60"
          >
            <Bell className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-900 font-semibold">New Lead!</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Jane Smith · Buying · ASAP · $300k–$500k</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header — shareable link */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Link2 className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500 font-medium">Lead Capture Form</span>
      </div>

      {/* Branded URL */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 mb-4"
      >
        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
        <span className="text-xs text-gray-600 truncate flex-1">realestic.ai/lead/your-name</span>
        <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">Copy</span>
      </motion.div>

      {/* Form mockup */}
      <div className="flex-1 bg-gray-100 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
        {/* Name field */}
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Full name</p>
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 min-h-[28px]">
            {typedName}
            {phase === 1 && (
              <motion.span className="inline-block w-0.5 h-3 bg-brand-500 ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
            )}
          </div>
        </div>

        {/* Type buttons */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <p className="text-[10px] text-gray-500 mb-1">I&apos;m</p>
              <div className="grid grid-cols-4 gap-1.5">
                {['Buying', 'Selling', 'Renting', 'Looking'].map((t, idx) => (
                  <div key={t} className={`text-center text-[10px] py-1.5 rounded-lg border transition-all ${idx === 0 ? 'bg-brand-500 text-white border-brand-500 font-semibold' : 'border-gray-200 text-gray-500'}`}>
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Budget + Timeline */}
        <AnimatePresence>
          {showBudget && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 mb-1">Timeline</p>
                <div className="flex gap-1">
                  <span className="text-[9px] px-2 py-1 rounded-lg bg-brand-500 text-white font-semibold border border-brand-500">ASAP</span>
                  <span className="text-[9px] px-2 py-1 rounded-lg border border-gray-200 text-gray-500">1–3mo</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 mb-1">Budget</p>
                <div className="flex gap-1">
                  <span className="text-[9px] px-2 py-1 rounded-lg border border-gray-200 text-gray-500">Under $300k</span>
                  <span className="text-[9px] px-2 py-1 rounded-lg bg-brand-500 text-white font-semibold border border-brand-500">$300–500k</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-auto">
              <div className="bg-brand-500 text-white text-xs font-semibold text-center py-2 rounded-lg">
                Contact You →
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Leads Inbox Demo Mockup ──────────────────────────────────────────────────

const inboxLeads = [
  {
    name: 'Marcus Rivera',
    source: 'Open house · 456 Oak Ave',
    detail: 'Buying · $400–550k · 1–3 mo',
    temp: 'hot' as const,
    initials: 'MR',
  },
  {
    name: 'Sarah Chen',
    source: 'Lead form link',
    detail: 'Renting · Under $2k/mo',
    temp: 'warm' as const,
    initials: 'SC',
  },
  {
    name: 'David Park',
    source: 'Lead form link',
    detail: 'Looking · No budget yet',
    temp: 'cold' as const,
    initials: 'DP',
  },
];

const tempStyles = {
  hot: { label: 'Hot', icon: Flame, className: 'bg-red-100 text-red-700 border-red-200' },
  warm: { label: 'Warm', icon: Thermometer, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cold: { label: 'Cold', icon: Snowflake, className: 'bg-sky-100 text-sky-700 border-sky-200' },
};

function LeadsInboxDemoMockup() {
  const [visibleLeads, setVisibleLeads] = useState(0);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [showAddCrm, setShowAddCrm] = useState(false);
  const [addedToCrm, setAddedToCrm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    setVisibleLeads(0);
    setSelectedLead(null);
    setShowAddCrm(false);
    setAddedToCrm(false);

    const t1 = setTimeout(() => setVisibleLeads(1), 400);
    const t2 = setTimeout(() => setVisibleLeads(2), 900);
    const t3 = setTimeout(() => setVisibleLeads(3), 1400);
    const t4 = setTimeout(() => { setSelectedLead(0); setShowAddCrm(true); }, 2400);
    const t5 = setTimeout(() => setAddedToCrm(true), 3800);
    const t6 = setTimeout(() => {
      setVisibleLeads(0);
      setSelectedLead(null);
      setShowAddCrm(false);
      setAddedToCrm(false);
    }, 9500);

    return () => [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col overflow-hidden" style={{ minHeight: '340px' }}>
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Inbox className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500 font-medium">Leads Inbox</span>
        <span className="ml-auto text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">3 new</span>
      </div>

      <div className="flex flex-1 gap-3 min-h-0">
        <div className="flex flex-col gap-2 w-[45%] flex-shrink-0">
          {inboxLeads.map((lead, i) => {
            const temp = tempStyles[lead.temp];
            const TempIcon = temp.icon;
            return (
              <AnimatePresence key={lead.name}>
                {visibleLeads > i && (
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedLead === i
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {lead.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-xs font-medium text-gray-900 truncate">{lead.name}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full border font-medium ${temp.className}`}>
                            <TempIcon className="w-2.5 h-2.5" />
                            {temp.label}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500 truncate">{lead.source}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedLead !== null && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.35 }}
              className="flex-1 bg-gray-100 border border-gray-100 rounded-xl p-3 flex flex-col"
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">{inboxLeads[selectedLead].name}</p>
              <p className="text-[10px] text-gray-500 mb-3">{inboxLeads[selectedLead].detail}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-3">
                <MapPin className="w-3 h-3 text-brand-500" />
                {inboxLeads[selectedLead].source}
              </div>
              <div className="mt-auto space-y-2">
                <AnimatePresence>
                  {showAddCrm && !addedToCrm && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-1.5 bg-brand-500 text-white text-xs font-semibold py-2 rounded-lg"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add to CRM
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {addedToCrm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/15 border border-brand-500/30"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                      <span className="text-[11px] text-brand-600 font-medium">Added to Client Manager</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Open House Demo Mockup ─────────────────────────────────────────────────────

function OpenHouseDemoMockup() {
  const [phase, setPhase] = useState(0);
  const [typedName, setTypedName] = useState('');
  const [showSignedIn, setShowSignedIn] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });

  const visitorName = 'Alex Thompson';

  useEffect(() => {
    if (!inView) return;
    setPhase(0);
    setTypedName('');
    setShowSignedIn(false);
    setShowNotification(false);

    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 3200);
    const t3 = setTimeout(() => { setShowSignedIn(true); setPhase(3); }, 4200);
    const t4 = setTimeout(() => setShowNotification(true), 5000);
    const t5 = setTimeout(() => {
      setPhase(0);
      setTypedName('');
      setShowSignedIn(false);
      setShowNotification(false);
    }, 11000);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [inView]);

  useEffect(() => {
    if (phase !== 1) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedName(visitorName.slice(0, i));
      if (i >= visitorName.length) clearInterval(timer);
    }, 55);
    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div ref={ref} className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col overflow-hidden relative" style={{ minHeight: '340px' }}>
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="absolute top-3 right-3 z-20 bg-white border border-gray-200 rounded-xl p-3 shadow-2xl flex items-start gap-2 w-64"
          >
            <Bell className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-900 font-semibold">Open house sign-in</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Alex Thompson · 456 Oak Ave · Buying</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <DoorOpen className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500 font-medium">Open House Sign-In</span>
        <span className="ml-auto text-[9px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 font-medium">Pro</span>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* QR side */}
        <div className="w-[38%] flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded-xl p-3">
          <div className="w-16 h-16 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mb-2">
            <QrCode className="w-10 h-10 text-gray-800" strokeWidth={1.25} />
          </div>
          <p className="text-[9px] text-gray-500 text-center">Scan to sign in</p>
          <p className="text-[8px] text-gray-400 text-center mt-1">456 Oak Ave · Sat 1–4pm</p>
        </div>

        {/* Phone sign-in form */}
        <div className="flex-1 bg-gray-100 border border-gray-100 rounded-xl p-3 flex flex-col gap-2.5">
          <p className="text-[10px] text-gray-500 font-medium">Welcome — sign in below</p>
          <div>
            <p className="text-[9px] text-gray-500 mb-1">Full name</p>
            <div className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 min-h-[26px]">
              {typedName}
              {phase === 1 && (
                <motion.span className="inline-block w-0.5 h-3 bg-brand-500 ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
              )}
            </div>
          </div>
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <p className="text-[9px] text-gray-500 mb-1">I&apos;m</p>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-[9px] py-1 rounded-md bg-brand-500 text-white text-center font-semibold">Buying</span>
                  <span className="text-[9px] py-1 rounded-md border border-gray-200 text-gray-500 text-center">Just browsing</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {phase >= 2 && !showSignedIn && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mt-auto bg-brand-500 text-white text-[10px] font-semibold text-center py-2 rounded-lg"
              >
                Sign In
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showSignedIn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-500/15 border border-brand-500/30"
              >
                <CheckCircle className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-[10px] text-brand-600 font-medium">You&apos;re signed in!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePageClient() {
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
    <div className="min-h-screen bg-[#F5F5F5] text-gray-900 overflow-hidden">


      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-50 border-b border-gray-200 backdrop-blur-md bg-[#F5F5F5]/20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-28 items-center justify-between">
            <motion.div className="flex items-center shrink-0" whileHover={{ scale: 1.02 }}>
              <WordmarkLogo />
            </motion.div>
            <div className="flex-1" />
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                  Browse Properties
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                  Sign In
                </motion.button>
              </Link>
              <Link href="/auth/signup">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(252,92,3,0.25)' }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-600 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-brand-500" />
                AI-Powered Real Estate Platform
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">Work Smarter</span>
              <br />
              <span className="text-gray-900">Close Faster</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-6 sm:mt-8 text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl">
              Transform your workflow as a real estate agent with intelligent tools designed for you.
              Manage leads, schedule showings, and close more deals with our AI-powered platform.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255,0.3)' }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto group px-8 py-4 text-base font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-900 border border-gray-400 rounded-xl backdrop-blur-sm transition-all">
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Floating cards — continuous drift like Atlas hero chips */}
          <motion.div variants={itemVariants} className="hidden lg:block relative">
            <div className="relative w-full h-[500px]">
              <motion.div
                {...heroCardFloat(5.2, 0.8, 16, 5)}
                className="absolute top-0 right-0 w-72"
              >
                <motion.div
                  initial={{ opacity: 0, y: 50, rotate: -5 }}
                  animate={{ opacity: 1, y: 0, rotate: -5 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  whileHover={{ y: -8, rotate: 0, scale: 1.02, transition: { duration: 0.15 } }}
                  className="rounded-2xl p-6 shadow-2xl border border-gray-200 bg-white will-change-transform"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-500/20 rounded-lg"><Users className="w-5 h-5 text-brand-500" /></div>
                    <span className="text-sm font-medium text-gray-600">New Leads Today</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">4</div>
                  <div className="text-sm text-gray-500 mt-1">Via your lead form link</div>
                </motion.div>
              </motion.div>

              <motion.div
                {...heroCardFloat(4.6, 1.2, 12, -6)}
                className="absolute top-32 left-0 w-64"
              >
                <motion.div
                  initial={{ opacity: 0, y: 50, rotate: 3 }}
                  animate={{ opacity: 1, y: 0, rotate: 3 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  whileHover={{ y: -8, rotate: 0, scale: 1.02, transition: { duration: 0.15 } }}
                  className="rounded-2xl p-6 shadow-2xl border border-gray-200 bg-white will-change-transform"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-500/20 rounded-lg"><Home className="w-5 h-5 text-brand-500" /></div>
                    <span className="text-sm font-medium text-gray-600">Active Listings</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">47</div>
                  <div className="text-sm text-gray-500 mt-1">Properties</div>
                </motion.div>
              </motion.div>

              <motion.div
                {...heroCardFloat(5.8, 0.4, 18, 4)}
                className="absolute bottom-10 right-10 w-80"
              >
                <motion.div
                  initial={{ opacity: 0, y: 50, rotate: -2 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  whileHover={{ y: -8, rotate: 0, scale: 1.02, transition: { duration: 0.15 } }}
                  className="rounded-2xl p-6 shadow-2xl border border-gray-200 bg-white will-change-transform"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-500/20 rounded-lg"><Sparkles className="w-5 h-5 text-brand-500" /></div>
                    <span className="text-sm font-medium text-gray-600">AI Generated</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">&ldquo;Stunning 4BR home with panoramic views, chef&apos;s kitchen, and resort-style backyard...&rdquo;</p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-gray-200 bg-gray-50 backdrop-blur-sm py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10, suffix: 'x', label: 'Faster Listing Descriptions' },
              { value: 5, suffix: '+', label: 'Hours Saved Per Week' },
              { value: 10, suffix: '+', label: 'More Leads' },
              { value: 100, suffix: '%', label: 'Built for Real Estate' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Deep-Dive ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-32">

          {[
            {
              icon: Sparkles,
              tag: 'AI Content',
              title: 'Write stunning listing descriptions in seconds',
              description: 'Upload your property photos, enter a few details, and our AI instantly crafts a professional, compelling listing description. Refine it to exactly the word count and tone you want. No more staring at a blank page.',
              highlights: ['Generates in under 10 seconds', 'Customize tone and length', 'Works from photos + details'],
              flip: false,
              mockup: AIDemoMockup,
            },
            {
              icon: Users,
              tag: 'CRM',
              title: 'Keep every client perfectly organized',
              description: 'All your clients, their preferences, notes, and history — in one clean place. Never lose track of a follow-up again. Add notes, track status, and see your entire pipeline at a glance.',
              highlights: ['Client notes & history', 'Status tracking', 'Instant search'],
              flip: true,
              mockup: CRMDemoMockup,
            },
            {
              icon: Link2,
              tag: 'Lead Capture',
              title: 'Your personal lead form, ready to share',
              description: 'Get a custom link with your name in it — share it in your Instagram bio, email signature, or business cards. Every lead lands straight in your CRM with their timeline, budget, and area already captured.',
              highlights: ['Your name in the link', 'Leads auto-added to your CRM', 'Captures timeline, budget & area'],
              flip: false,
              mockup: LeadFormDemoMockup,
            },
            {
              icon: Inbox,
              tag: 'Leads Inbox',
              title: 'Every lead in one place, scored and ready',
              description: 'All form submissions and open house sign-ins land in your inbox — tagged Hot, Warm, or Cold so you know who to call first. Review details and add the best leads to your CRM in one click.',
              highlights: ['Hot / Warm / Cold scoring', 'Open house & form leads together', 'One-click add to CRM'],
              flip: true,
              mockup: LeadsInboxDemoMockup,
            },
            {
              icon: DoorOpen,
              tag: 'Open Houses',
              title: 'Paperless sign-in at every open house',
              description: 'Create an open house event, print or display a QR code, and let visitors sign in from their phone. Every attendee becomes a lead in your inbox — with the property and event already attached.',
              highlights: ['QR code sign-in', 'No clipboards or spreadsheets', 'Leads tagged with property & event'],
              flip: false,
              mockup: OpenHouseDemoMockup,
            },
            {
              icon: Calendar,
              tag: 'Scheduling',
              title: 'Never miss an appointment or deadline',
              description: 'Syncs with Google Calendar. Set automated reminders for showings, closings, and follow-ups. Stay on top of every transaction from offer to close.',
              highlights: ['Google Calendar sync', 'Automated reminders', 'Transaction timelines'],
              flip: true,
              mockup: CalendarDemoMockup,
            },
            {
              icon: Search,
              tag: 'Property Research',
              title: 'Property data and CMA in one search',
              description: 'Look up any address for beds, baths, owner info, and estimated value — then switch to Market / CMA to see comparable sales and a suggested price range. No more jumping between five different websites.',
              highlights: ['Instant property details', 'Comparable sales & price range', 'All in one place'],
              flip: false,
              mockup: PropertyLookupDemoMockup,
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
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-xs text-gray-600 mb-6">
                  <feature.icon className="w-3.5 h-3.5" />
                  {feature.tag}
                </span>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">{feature.title}</h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.highlights.map((h, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: j * 0.1 }}
                      className="flex items-center gap-3 text-gray-600"
                    >
                      <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0" />
                      {h}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className={feature.flip ? 'lg:order-1' : ''}>
                <feature.mockup />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
            <p className="text-gray-500 text-lg">Everything you need to know about Realestic.</p>
          </motion.div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-600 mb-6">
              <Star className="w-4 h-4 text-brand-500" />
              7-Day Free Trial on Every Plan
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Start free. No credit card setup fees. Cancel anytime.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: 'Starter',
                price: getPlanDisplayPrice('starter', 'monthly'),
                description: STARTER_PLAN_DESCRIPTION,
                plan: 'starter' as const,
                popular: false,
              },
              {
                name: 'Pro',
                price: getPlanDisplayPrice('pro', 'monthly'),
                description: PRO_PLAN_DESCRIPTION,
                plan: 'pro' as const,
                popular: true,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.popular
                    ? 'bg-white border-2 border-gray-400'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 text-sm">/ mo after trial</span>
                  </div>
                  {isAnyAnnualBillingAvailable() && (
                    <p className="text-xs text-gray-500 mt-2">
                      or {getPlanDisplayPrice(plan.plan, 'annual')}/year — save 2 months
                    </p>
                  )}
                </div>

                <Link href="/pricing" className="mb-7">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                        : 'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Start Free Trial
                  </motion.button>
                </Link>

                <div className="border-t border-gray-200 mb-5" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">What&apos;s included</p>
                <PricingFeatureList plan={plan.plan} />
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-gray-600 text-sm mt-10"
          >
            {getPricingFootnote()}
          </motion.p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32 border-t border-gray-200">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-600 mb-8">
              <Star className="w-4 h-4 text-brand-500" />
              7-Day Free Trial
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stop wasting time.<br />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">
                Start closing more deals.
              </span>
            </h2>
            <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
              Built for real estate agents who want to save hours every week and win more listings.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(255,255,255,0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-10 py-4 text-lg font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-4 text-lg font-semibold text-gray-900 border border-gray-400 rounded-xl transition-all"
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
      <footer className="relative z-10 border-t border-gray-200 bg-[#F5F5F5]/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2026 Realestic. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/" className="hover:text-brand-600 transition-colors">Browse Properties</Link>
              <Link href="/agents" className="hover:text-brand-600 transition-colors">Find an Agent</Link>
              <Link href="/about" className="hover:text-brand-600 transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-brand-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-600 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-brand-600 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
