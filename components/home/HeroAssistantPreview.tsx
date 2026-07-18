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
  Plus,
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
    let delay = deleting ? 22 : 48;

    if (!deleting && text === current) {
      delay = 2200;
    } else if (deleting && text === '') {
      delay = 400;
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
    <div className="relative w-full min-h-[500px] rounded-[1.75rem] overflow-hidden p-4 sm:p-5">
      <Image
        src="/demo-house.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 560px, 100vw"
        className="object-cover scale-110 blur-[28px] saturate-[0.85]"
        aria-hidden
        priority
      />
      <div className="absolute inset-0 bg-[#F5F5F5]/25" aria-hidden />

      <div className="relative z-10 flex h-[480px] rounded-xl border border-white/60 bg-white shadow-overlay overflow-hidden">
        {/* App sidebar */}
        <aside className="hidden sm:flex w-[148px] shrink-0 flex-col border-r border-gray-200 bg-[#f5f5f4] py-3 px-2">
          <div className="px-1.5 mb-4">
            <Image
              src="/logo-sidebar.png"
              alt="Oikaro"
              width={120}
              height={32}
              className="h-6 w-auto object-contain object-left"
            />
          </div>
          {SIDEBAR_NAV.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
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
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ${
                        active ? 'bg-brand-200 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      <Icon className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                      <span className="truncate">{item.name}</span>
                      {'badge' in item && item.badge ? (
                        <span className="ml-auto rounded-full bg-brand-500 px-1 font-mono text-[8px] font-semibold text-white">
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

        {/* Chat workspace */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#fafafa] p-3">
          <div className="mb-2 shrink-0">
            <p className="text-[13px] font-semibold text-gray-900">AI Assistant</p>
            <p className="text-[10px] text-gray-600">0 / 75 AI messages used this month</p>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,88px)_minmax(0,1fr)] gap-2">
            <div className="hidden min-h-0 flex-col md:flex">
              <div className="flex items-center justify-center gap-1 rounded-[8px] border border-gray-200 bg-white px-2 py-1.5 text-[9px] font-medium text-gray-900">
                <Plus className="h-3 w-3" />
                New Chat
              </div>
              <p className="mt-2 px-0.5 text-center text-[8px] leading-snug text-gray-600">
                No chats yet
              </p>
            </div>

            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white">
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-5 text-center">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-gray-900 sm:text-[17px]">
                  How can I help you today?
                </h3>
                <p className="mt-1.5 max-w-[280px] text-[10px] leading-snug text-gray-600 sm:text-[11px]">
                  Ask about listings, follow-ups, social posts, or upload a photo or PDF for analysis.
                </p>
                <div className="mt-4 grid w-full max-w-md grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <div
                      key={prompt}
                      className="rounded-[8px] border border-gray-200 bg-white px-2.5 py-2 text-left text-[9px] leading-snug text-gray-700 sm:text-[10px]"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-150 p-2.5">
                <div className="flex items-end gap-2 rounded-[10px] border border-gray-200 bg-white px-2.5 py-2">
                  <Paperclip className="mb-0.5 h-3.5 w-3.5 shrink-0 text-gray-600" strokeWidth={1.8} />
                  <p className="min-h-[18px] flex-1 truncate text-left text-[10px] text-gray-700 sm:text-[11px]">
                    {typedPrompt}
                    <span className="ml-px inline-block h-[12px] w-px animate-pulse bg-gray-900 align-middle" />
                  </p>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Send className="h-3 w-3" strokeWidth={2} />
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
