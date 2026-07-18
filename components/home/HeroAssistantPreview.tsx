'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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

function useTypewriterPrompts(prompts: readonly string[]) {
  const [text, setText] = useState(prompts[0]);
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setText(prompts[0]);
      return;
    }

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
  }, [text, deleting, index, prompts]);

  return text;
}

export default function HeroAssistantPreview() {
  const typedPrompt = useTypewriterPrompts(HERO_PROMPTS);

  return (
    <div className="relative w-full min-w-[640px] min-h-[620px]">
      {/* Blurred property backdrop — extends past the frame like Taito */}
      <div className="absolute -inset-3 sm:-inset-4 rounded-[2rem] overflow-hidden" aria-hidden>
        <Image
          src="/demo-house.png"
          alt=""
          fill
          sizes="800px"
          className="object-cover scale-110 blur-[32px] saturate-[0.9]"
          priority
        />
        <div className="absolute inset-0 bg-[#F5F5F5]/20" />
      </div>

      {/* Product frame — Taito-style outline */}
      <div className="relative z-10 flex h-[620px] flex-col overflow-hidden rounded-2xl border border-gray-300/90 bg-white shadow-[0_24px_64px_-12px_rgba(24,24,27,0.14),0_0_0_1px_rgba(24,24,27,0.04)] ring-1 ring-gray-900/[0.06]">
        <div className="flex min-h-0 flex-1">
          {/* App sidebar */}
          <aside className="flex w-[168px] shrink-0 flex-col border-r border-gray-200 bg-[#f5f5f4] py-4 px-2.5">
            <div className="px-1 mb-5">
              <Image
                src="/logo-sidebar.png"
                alt="Oikaro"
                width={120}
                height={32}
                className="h-7 w-auto object-contain object-left"
              />
            </div>
            {SIDEBAR_NAV.map((group) => (
              <div key={group.label} className="mb-3.5 last:mb-0">
                <p className="px-2 mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-600">
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
                          active ? 'bg-brand-200 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{item.name}</span>
                        {'badge' in item && item.badge ? (
                          <span className="ml-auto rounded-full bg-brand-500 px-1.5 font-mono text-[8px] font-semibold text-white">
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

          {/* AI Assistant — chat list collapsed; full-width chat panel */}
          <div className="flex min-w-0 flex-1 flex-col bg-[#fafafa]">
            <div className="shrink-0 border-b border-gray-200 px-5 py-3.5">
              <p className="text-[14px] font-semibold text-gray-900">AI Assistant</p>
              <p className="text-[11px] text-gray-600 mt-0.5">0 / 75 AI messages used this month</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col mx-4 my-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex flex-1 flex-col items-center justify-center px-8 py-8 text-center">
                <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-gray-900">
                  How can I help you today?
                </h3>
                <p className="mt-2 max-w-md text-[13px] leading-relaxed text-gray-600">
                  Ask about listings, follow-ups, social posts, or upload a photo or PDF for analysis.
                </p>
                <div className="mt-8 grid w-full max-w-lg grid-cols-2 gap-2.5">
                  {STARTER_PROMPTS.map((prompt) => (
                    <div
                      key={prompt}
                      className="rounded-[10px] border border-gray-200 bg-white px-3.5 py-3 text-left text-[12px] leading-snug text-gray-700"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-150 p-4">
                <div className="relative min-h-[96px] rounded-xl border border-gray-200 bg-white px-4 pt-3.5 pb-12">
                  <p className="text-[13px] leading-relaxed text-gray-800 whitespace-normal break-words text-left">
                    {typedPrompt}
                    <span className="ml-0.5 inline-block h-[14px] w-px animate-pulse bg-gray-900 align-text-bottom" />
                  </p>
                  <Paperclip
                    className="absolute bottom-3.5 left-3.5 h-4 w-4 text-gray-600"
                    strokeWidth={1.8}
                  />
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
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
