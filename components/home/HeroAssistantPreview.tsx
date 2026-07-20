'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Inbox,
  Search,
  Calendar,
  Megaphone,
  Sparkles,
  Paperclip,
  Send,
} from 'lucide-react';

const HERO_PROMPTS = [
  'Write a compelling listing description for a 3-bed home',
  'Look up 742 Oak Street and pull comps',
  'Draft a follow-up for a buyer who toured yesterday',
  'Create a Meta ad for my new listing',
  'Remind me to follow up with a client next Friday',
] as const;

const STARTER_PROMPTS = HERO_PROMPTS.slice(0, 4);

const SIDEBAR_NAV = [
  {
    label: 'Work',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard },
      { name: 'Projects', icon: FolderKanban },
      { name: 'Transactions', icon: FileText },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Clients', icon: Users },
      { name: 'Leads', icon: Inbox, badge: 1 },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Property Research', icon: Search },
      { name: 'Ads', icon: Megaphone },
      { name: 'Calendar', icon: Calendar },
      { name: 'AI Assistant', icon: Sparkles, active: true },
    ],
  },
] as const;

function useTypewriterPrompts(prompts: readonly string[], enabled: boolean) {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setText(prompts[0]);
      return;
    }
    const startTimer = window.setTimeout(() => setStarted(true), 300);
    return () => window.clearTimeout(startTimer);
  }, [enabled, prompts]);

  useEffect(() => {
    if (!enabled || !started) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const current = prompts[index];
    let delay = deleting ? 22 : 42;

    if (!deleting && text === current) {
      delay = 2400;
    } else if (deleting && text === '') {
      delay = 350;
    }

    const timer = window.setTimeout(() => {
      if (!deleting) {
        if (text.length < current.length) {
          setText(current.slice(0, text.length + 1));
        } else {
          setDeleting(true);
        }
      } else if (text.length > 0) {
        setText(current.slice(0, text.length - 1));
      } else {
        setDeleting(false);
        setIndex((i) => (i + 1) % prompts.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [text, deleting, index, prompts, enabled, started]);

  return enabled ? text : '';
}

type HeroAssistantPreviewProps = {
  showBackdrop?: boolean;
  /** Start typing animation once the mockup scrolls into view */
  animateWhenVisible?: boolean;
  /** Strip outer chrome — parent BrowserWindowFrame provides the frame */
  compactChrome?: boolean;
};

export default function HeroAssistantPreview({
  showBackdrop = true,
  animateWhenVisible = false,
  compactChrome = false,
}: HeroAssistantPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const typingEnabled = animateWhenVisible ? inView : true;
  const typedPrompt = useTypewriterPrompts(HERO_PROMPTS, typingEnabled);

  const shellClass = compactChrome
    ? 'theme-light relative flex min-h-[340px] h-[min(520px,65svh)] flex-col overflow-hidden bg-[var(--surface)] sm:min-h-[400px] lg:h-[520px]'
    : 'theme-light relative z-10 flex min-h-[360px] h-[min(580px,72svh)] flex-col overflow-hidden rounded-2xl border border-white/30 bg-[var(--surface)] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.15)] ring-1 ring-white/10 sm:min-h-[420px] md:min-h-[480px] lg:h-[580px] lg:min-h-0';

  return (
    <div ref={ref} className="relative mx-auto w-full">
      {showBackdrop && !compactChrome ? (
        <div className="absolute -inset-3 sm:-inset-4 rounded-[2rem] overflow-hidden" aria-hidden>
          <Image
            src="/demo-house.png"
            alt=""
            fill
            sizes="800px"
            className="object-cover scale-110 blur-[32px] saturate-[0.9]"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : null}

      <div className={shellClass}>
        <div className="flex min-h-0 flex-1">
          <aside className="hidden md:flex w-[140px] lg:w-[168px] shrink-0 flex-col border-r border-gray-200 bg-[#f5f5f4] py-3 px-2 lg:py-4 lg:px-2.5">
            <div className="px-1 mb-4 lg:mb-5">
              <Image
                src="/logo-sidebar.png"
                alt="Oikaro"
                width={120}
                height={32}
                className="h-6 w-auto object-contain object-left lg:h-7"
              />
            </div>
            {SIDEBAR_NAV.map((group) => (
              <div key={group.label} className="mb-3.5 last:mb-0">
                <p className="px-2 mb-1 text-[9px] font-medium uppercase tracking-[0.08em] text-gray-600">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = 'active' in item && item.active;
                    return (
                      <li
                        key={item.name}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] font-medium ${
                          active ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{item.name}</span>
                        {'badge' in item && item.badge ? (
                          <span className="ml-auto rounded-full bg-[#E4F76C] px-1.5 text-[8px] font-medium text-[#141412]">
                            {item.badge}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-[#fafafa]">
            <div className="shrink-0 border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-3.5">
              <p className="text-[13px] font-medium text-gray-900 sm:text-[14px]">AI Assistant</p>
              <p className="text-[10px] text-gray-600 mt-0.5 sm:text-[11px]">0 / 75 AI messages used this month</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col mx-3 my-3 rounded-lg border border-gray-200 bg-[var(--surface)] overflow-hidden sm:mx-4 sm:my-4">
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-5 text-center sm:px-8 sm:py-8">
                <h3 className="text-[17px] font-medium tracking-[-0.02em] text-gray-900 sm:text-[20px]">
                  How can I help you today?
                </h3>
                <p className="mt-2 max-w-md text-[12px] leading-relaxed text-gray-600 sm:text-[13px]">
                  Ask about listings, follow-ups, social posts, or upload a photo or PDF for analysis.
                </p>
                <div className="mt-5 grid w-full max-w-lg grid-cols-1 gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-2.5">
                  {STARTER_PROMPTS.map((prompt) => (
                    <div
                      key={prompt}
                      className="rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-2.5 text-left text-[11px] leading-snug text-gray-700 sm:px-3.5 sm:py-3 sm:text-[12px]"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-200 p-3 sm:p-4">
                <div className="relative min-h-[80px] rounded-lg border border-gray-200 bg-[var(--surface)] px-3 pt-3 pb-11 sm:min-h-[96px] sm:px-4 sm:pt-3.5 sm:pb-12">
                  <p className="text-[13px] leading-relaxed text-gray-800 whitespace-normal break-words text-left">
                    {typedPrompt || '\u00A0'}
                    {typingEnabled ? (
                      <span className="ml-0.5 inline-block h-[14px] w-px animate-pulse bg-gray-900 align-text-bottom" />
                    ) : null}
                  </p>
                  <Paperclip
                    className="absolute bottom-3.5 left-3.5 h-4 w-4 text-gray-600"
                    strokeWidth={1.8}
                  />
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white">
                    <Send className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
