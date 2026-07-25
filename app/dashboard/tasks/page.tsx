'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import DataLoadingState from '@/components/dashboard/DataLoadingState';
import { TasksPageContentSkeleton } from '@/components/dashboard/page-loading';
import { Sparkles, Send, Loader2, Paperclip, X, Plus, MessageSquare, Trash2, FileText, Pin, Edit3, Check, MoreVertical, PanelLeft, PanelLeftClose } from 'lucide-react';
import { Conversation, ConversationMessage } from '@/types';
import { useApi } from '@/lib/swr';
import { useTour } from '@/hooks/useTour';
import { consumeHeroPrompt } from '@/lib/landing-hero-prompts';
import clsx from 'clsx';

const STARTER_PROMPTS = [
  'Write a compelling listing description for a 3-bed home',
  'Draft a follow-up email for a buyer who toured yesterday',
  'Create a project for 123 Main St, 3 bed 2 bath',
  'Remind me to follow up with a client next Friday',
] as const;

const AI_THREAD_SIDEBAR_KEY = 'oikaro-ai-thread-sidebar';

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const deepLinkConversation = searchParams.get('conversation');
  const deepLinkPrompt = searchParams.get('prompt');

  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    mutate: mutateConversations,
  } = useApi<Conversation[]>('/api/conversations');
  const { response: usageResponse } = useApi('/api/usage');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // PDF upload state
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  
  // Rename state
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [threadSidebarOpen, setThreadSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AI_THREAD_SIDEBAR_KEY);
      if (stored === 'open') setThreadSidebarOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const setThreadSidebar = useCallback((open: boolean) => {
    setThreadSidebarOpen(open);
    try {
      localStorage.setItem(AI_THREAD_SIDEBAR_KEY, open ? 'open' : 'collapsed');
    } catch {
      // ignore
    }
  }, []);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCacheRef = useRef<Record<string, ConversationMessage[]>>({});
  const fetchAbortRef = useRef<AbortController | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  const skipSmoothScrollRef = useRef(false);
  const prefetchStartedRef = useRef(false);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Set page title
  useEffect(() => {
    document.title = 'AI Assistant - Oikaro';
  }, []);

  useEffect(() => {
    if (deepLinkPrompt) {
      setInputMessage(deepLinkPrompt);
      return;
    }
    const pending = consumeHeroPrompt();
    if (pending) setInputMessage(pending);
  }, [deepLinkPrompt]);

  useTour({
    tourKey: 'tour_ai_assistant',
    ready: !isLoadingConversations,
    steps: [
      {
        element: '[data-tour="ai-new-chat"]',
        popover: {
          title: 'Start a new chat',
          description: 'Create a fresh conversation anytime. Your past threads stay in the sidebar.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="ai-chat"]',
        popover: {
          title: 'Ask anything',
          description: 'Draft listing copy, follow-up emails, or upload a photo or PDF for analysis. Pick a suggestion to seed your message.',
          side: 'left',
        },
      },
      {
        element: '[data-tour="ai-input"]',
        popover: {
          title: 'Send a message',
          description: 'Type your question, attach a file with the paperclip, and press Enter to send.',
          side: 'top',
        },
      },
    ],
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom(skipSmoothScrollRef.current);
    skipSmoothScrollRef.current = false;
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
  };

  const prefetchConversationMessages = useCallback(async (conversations: Conversation[]) => {
    const uncached = conversations.filter((c) => !messageCacheRef.current[c.id]).slice(0, 40);
    await Promise.all(
      uncached.map(async (conv) => {
        try {
          const response = await fetch(`/api/conversations?conversation_id=${conv.id}`);
          const result = await response.json();
          if (result.success) {
            messageCacheRef.current[conv.id] = result.data.messages || [];
            if (currentConversationIdRef.current === conv.id) {
              skipSmoothScrollRef.current = true;
              setMessages(result.data.messages || []);
              setIsLoadingMessages(false);
            }
          }
        } catch {
          /* non-fatal prefetch */
        }
      })
    );
  }, []);

  // Prefetch message threads once conversations are cached
  useEffect(() => {
    if (conversations.length > 0 && !prefetchStartedRef.current) {
      prefetchStartedRef.current = true;
      void prefetchConversationMessages(conversations);
    }
  }, [conversations, prefetchConversationMessages]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const cached = messageCacheRef.current[conversationId];
    if (cached) {
      skipSmoothScrollRef.current = true;
      setMessages(cached);
      setIsLoadingMessages(false);
      return;
    }

    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setIsLoadingMessages(true);

    try {
      const response = await fetch(`/api/conversations?conversation_id=${conversationId}`, {
        signal: controller.signal,
      });
      const result = await response.json();

      if (controller.signal.aborted) return;

      if (result.success) {
        const loaded = result.data.messages || [];
        messageCacheRef.current[conversationId] = loaded;
        if (currentConversationIdRef.current === conversationId) {
          skipSmoothScrollRef.current = true;
          setMessages(loaded);
        }
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      if (!controller.signal.aborted && currentConversationIdRef.current === conversationId) {
        setIsLoadingMessages(false);
      }
    }
  }, []);

  const selectConversation = (conversationId: string) => {
    if (conversationId === currentConversationId) return;
    setError(null);
    setCurrentConversationId(conversationId);
    const cached = messageCacheRef.current[conversationId];
    if (cached) {
      skipSmoothScrollRef.current = true;
      setMessages(cached);
      setIsLoadingMessages(false);
    } else {
      setMessages([]);
      setIsLoadingMessages(true);
    }
  };

  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || !deepLinkConversation || isLoadingConversations) return;
    if (conversations.some((c) => c.id === deepLinkConversation)) {
      deepLinkHandledRef.current = true;
      selectConversation(deepLinkConversation);
    }
  }, [deepLinkConversation, conversations, isLoadingConversations]);

  // Fetch messages when conversation changes (background refresh if uncached)
  useEffect(() => {
    if (currentConversationId) {
      void fetchMessages(currentConversationId);
    } else {
      setMessages([]);
      setIsLoadingMessages(false);
    }
  }, [currentConversationId, fetchMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous attachments
    setSelectedImage(null);
    setImagePreview(null);
    setImageName(null);
    setSelectedPdf(null);
    setPdfName(null);
    setError(null);

    if (file.type === 'application/pdf') {
      if (file.size > 20 * 1024 * 1024) {
        setError('PDF size must be less than 20MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPdf(reader.result as string);
        setPdfName(file.name);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setImagePreview(base64String);
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
      return;
    }

    setError('Please select an image or PDF file');
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageName(null);
    setSelectedPdf(null);
    setPdfName(null);
  };

  const handleNewConversation = () => {
    fetchAbortRef.current?.abort();
    setCurrentConversationId(null);
    setMessages([]);
    setIsLoadingMessages(false);
    setInputMessage('');
    handleRemoveImage();
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      });

      const result = await response.json();

        if (result.success) {
        void mutateConversations(
          (current) =>
            current?.data
              ? { ...current, data: current.data.filter((c) => c.id !== conversationId) }
              : current,
          { revalidate: false },
        );
        delete messageCacheRef.current[conversationId];
        if (currentConversationId === conversationId) {
          handleNewConversation();
        }
      } else {
        setError(result.error || 'Failed to delete conversation');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  const handleTogglePin = async (conversationId: string, currentPinned: boolean) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversation_id: conversationId,
          pinned: !currentPinned 
        }),
      });

      const result = await response.json();

      if (result.success) {
        void mutateConversations(
          (current) =>
            current?.data
              ? {
                  ...current,
                  data: sortConversations(
                    current.data.map((c) =>
                      c.id === conversationId ? { ...c, pinned: !currentPinned } : c,
                    ),
                  ),
                }
              : current,
          { revalidate: false },
        );
      } else {
        setError(result.error || 'Failed to pin conversation');
      }
    } catch (err) {
      console.error('Error pinning conversation:', err);
      setError('Failed to pin conversation');
    }
  };

  const handleStartRename = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId);
    setEditingTitle(currentTitle || 'New conversation');
  };

  const handleCancelRename = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleSaveRename = async (conversationId: string) => {
    if (!editingTitle.trim()) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversation_id: conversationId,
          title: editingTitle.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        void mutateConversations(
          (current) =>
            current?.data
              ? {
                  ...current,
                  data: current.data.map((c) =>
                    c.id === conversationId ? { ...c, title: editingTitle.trim() } : c,
                  ),
                }
              : current,
          { revalidate: false },
        );
        setEditingConversationId(null);
        setEditingTitle('');
      } else {
        setError(result.error || 'Failed to rename conversation');
      }
    } catch (err) {
      console.error('Error renaming conversation:', err);
      setError('Failed to rename conversation');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(inputMessage);
  };

  const submitMessage = async (rawText: string) => {
    if (!rawText.trim() && !selectedImage && !selectedPdf) return;

    setIsLoading(true);
    setError(null);

    const tempUserMessage: ConversationMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: currentConversationId || 'temp',
      user_id: 'current',
      role: 'user',
      content: rawText.trim(),
      image_url: selectedImage,
      image_name: imageName || pdfName,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const next = [...prev, tempUserMessage];
      if (currentConversationId) {
        messageCacheRef.current[currentConversationId] = next;
      }
      return next;
    });

    const messageText = rawText.trim();
    const capturedImage = selectedImage;
    const capturedImageName = imageName;
    const capturedPdf = selectedPdf;
    const capturedPdfName = pdfName;
    setInputMessage('');
    handleRemoveImage();

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_id: currentConversationId,
          imageData: capturedImage,
          imageName: capturedImageName,
          pdfData: capturedPdf,
          pdfName: capturedPdfName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { conversation_id, messages: updatedMessages } = result.data;

        if (!currentConversationId) {
          setCurrentConversationId(conversation_id);
          void mutateConversations();
        }

        setMessages(updatedMessages);
        if (conversation_id) {
          messageCacheRef.current[conversation_id] = updatedMessages;
        }
      } else {
        setError(result.error || 'Failed to send message');
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterPrompt = (text: string) => {
    if (isLoading) return;
    setInputMessage(text);
  };

  const usageData = usageResponse?.data as Record<string, { current: number; limit: number }> | undefined;
  const aiUsage = usageData?.ai_messages;

  const usageSubtitle = aiUsage
    ? aiUsage.limit === -1
      ? 'Unlimited AI messages on your plan'
      : `${aiUsage.current}/${aiUsage.limit} AI messages used this month`
    : 'Chat with AI about listings, leads, and daily agent tasks';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const sortedConversations = sortConversations(conversations);
  const showEmptyState = !currentConversationId && messages.length === 0 && !isLoadingMessages;

  return (
    <DashboardPage title="AI Assistant" subtitle={usageSubtitle} inline className="!pb-4">
      {isLoadingConversations ? (
        <TasksPageContentSkeleton />
      ) : (
      <div
        className={clsx(
          'grid gap-4 h-[calc(100dvh-7.5rem)] min-h-[560px]',
          threadSidebarOpen ? 'grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-1',
        )}
      >
        {/* Thread sidebar — collapsible */}
        {threadSidebarOpen && (
        <aside className="flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">Chats</span>
            <button
              type="button"
              onClick={() => setThreadSidebar(false)}
              className="p-1.5 rounded-[8px] text-gray-600 hover:bg-[var(--canvas)] hover:text-gray-900 transition-colors"
              aria-label="Hide chat list"
              title="Hide chat list"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleNewConversation}
            data-tour="ai-new-chat"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-gray-900 hover:bg-[var(--canvas)] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>

          <div className="flex-1 overflow-y-auto overflow-x-hidden mt-3 min-h-0 -mx-1 px-1">
            {isLoadingConversations ? (
              <div className="space-y-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[52px] bg-[var(--canvas)] border border-[var(--border)] rounded-[8px] animate-pulse" />
                ))}
              </div>
            ) : sortedConversations.length === 0 ? (
              <p className="text-[12.5px] text-gray-600 px-2 py-4 text-center leading-relaxed">
                No chats yet — start a new conversation above.
              </p>
            ) : (
              <div>
                {sortedConversations.map((conv) => {
                  const selected = currentConversationId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={clsx(
                        'group relative px-2.5 py-2.5 rounded-[8px] cursor-pointer transition-colors',
                        selected ? 'bg-brand-50 border border-brand-200/70' : 'hover:bg-[var(--canvas)] border border-transparent',
                      )}
                      onClick={() => selectConversation(conv.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 mt-0.5">
                          {conv.pinned ? (
                            <Pin className="w-4 h-4 text-gray-600 fill-gray-600" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          {editingConversationId === conv.id ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(conv.id);
                                  if (e.key === 'Escape') handleCancelRename();
                                }}
                                className="w-full text-[12.5px] bg-[var(--surface)] border border-[var(--border)] rounded-[8px] px-2 py-1 text-gray-900 focus:outline-none focus:border-brand-400"
                                autoFocus
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveRename(conv.id)}
                                  className="p-1 hover:bg-emerald-50 rounded transition-colors"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelRename}
                                  className="p-1 hover:bg-rose-50 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p
                                className={clsx(
                                  'text-[13px] leading-snug line-clamp-2 text-gray-900',
                                  selected && 'font-semibold',
                                )}
                                title={conv.title || 'New conversation'}
                              >
                                {conv.title || 'New conversation'}
                              </p>
                              <p className="text-[12px] text-gray-600 mt-0.5">
                                {formatDate(conv.updated_at)}
                              </p>
                            </>
                          )}
                        </div>
                        {editingConversationId !== conv.id && (
                          <div className="absolute right-1.5 top-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                              }}
                              className="p-1 hover:bg-gray-200/60 rounded-[6px] transition-all opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                            {openMenuId === conv.id && (
                              <div
                                className="absolute right-0 top-7 z-50 w-40 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleStartRename(conv.id, conv.title || '');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-gray-900 hover:bg-gray-50 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleTogglePin(conv.id, conv.pinned);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-gray-900 hover:bg-gray-50 transition-colors"
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                  {conv.pinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteConversation(conv.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
        )}

        {/* Main panel */}
        <div className="flex flex-col min-h-0 min-w-0">
          {!threadSidebarOpen && (
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setThreadSidebar(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-gray-700 hover:bg-[var(--canvas)] transition-colors"
                aria-label="Show chat list"
              >
                <PanelLeft className="w-4 h-4" />
                Chats
              </button>
              <button
                type="button"
                onClick={handleNewConversation}
                data-tour="ai-new-chat"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-gray-900 hover:bg-[var(--canvas)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New chat
              </button>
            </div>
          )}
        <div className="flex flex-col flex-1 border border-[var(--border)] rounded-[10px] bg-[var(--surface)] overflow-hidden min-h-0 min-w-0" data-tour="ai-chat">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[var(--border)] bg-[var(--canvas)]/60 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-brand-200/80 bg-brand-50">
                <Sparkles className="w-4 h-4 text-brand-600" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[15px] font-medium tracking-[-0.02em] text-gray-900 truncate">
                  {currentConversationId
                    ? sortedConversations.find((c) => c.id === currentConversationId)?.title || 'Conversation'
                    : 'New conversation'}
                </p>
                <p className="text-[12px] text-gray-600 truncate">Listing copy, follow-ups, and daily agent tasks</p>
              </div>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-[var(--canvas)]/30">
            {isLoadingMessages ? (
              <DataLoadingState
                title="Loading messages"
                description="Pulling your conversation history."
                className="py-16"
              />
            ) : showEmptyState ? (
              <div className="flex flex-col items-center justify-center h-full px-6 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-brand-200/80 bg-brand-50 mb-5">
                  <Sparkles className="w-5 h-5 text-brand-600" strokeWidth={1.75} />
                </div>
                <h2 className="font-display text-[22px] font-medium tracking-[-0.02em] text-gray-900">
                  How can I help you today?
                </h2>
                <p className="text-[13.5px] text-gray-700 mt-2 max-w-md leading-relaxed">
                  Ask about listings, follow-ups, social posts, or upload a photo or PDF for analysis.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl mt-8">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleStarterPrompt(prompt)}
                      disabled={isLoading}
                      className="text-left text-[13px] leading-snug px-4 py-3.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-gray-700 hover:bg-[var(--canvas)] hover:border-brand-200/70 transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 p-5 sm:p-6 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-[8px] border border-brand-200/70 bg-brand-50 flex items-center justify-center mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-600" strokeWidth={1.75} />
                      </div>
                    )}
                    <div className={clsx('max-w-[85%]', msg.role === 'user' ? 'ml-auto' : '')}>
                      <div
                        className={clsx(
                          'rounded-[10px] px-4 py-3 text-[13.5px] leading-relaxed',
                          msg.role === 'user'
                            ? 'bg-brand-500 text-[var(--brand-foreground)]'
                            : 'bg-[var(--surface)] text-gray-900 border border-[var(--border)] shadow-sm',
                        )}
                      >
                        {msg.image_url && !msg.image_name?.toLowerCase().endsWith('.pdf') && (
                          <div className="mb-3">
                            <img
                              src={msg.image_url}
                              alt={msg.image_name || 'Uploaded image'}
                              className="max-w-xs rounded-[8px] border border-gray-200"
                            />
                            {msg.image_name && (
                              <p className={clsx('text-xs mt-1 flex items-center gap-1', msg.role === 'user' ? 'text-white/70' : 'text-gray-600')}>
                                <FileText className="w-3 h-3" />
                                {msg.image_name}
                              </p>
                            )}
                          </div>
                        )}
                        {msg.image_name?.toLowerCase().endsWith('.pdf') && (
                          <div className={clsx(
                            'mb-3 flex items-center gap-2 px-3 py-2 rounded-[8px] border w-fit',
                            msg.role === 'user'
                              ? 'border-white/20 bg-[var(--surface)]/10'
                              : 'border-gray-200 bg-gray-50',
                          )}>
                            <FileText className={clsx('w-4 h-4 flex-shrink-0', msg.role === 'user' ? 'text-white/80' : 'text-gray-600')} />
                            <span className={clsx('text-xs truncate max-w-[200px]', msg.role === 'user' ? 'text-white/90' : 'text-gray-600')}>
                              {msg.image_name}
                            </span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-[8px] border border-brand-200/70 bg-brand-50 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" strokeWidth={1.75} />
                    </div>
                    <div className="rounded-[10px] px-4 py-3 border border-[var(--border)] bg-[var(--surface)]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                        <span className="text-[13px] text-gray-700">Thinking…</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 sm:px-5 pb-2 shrink-0">
              <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2.5">
                <p className="text-[13px] text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-[var(--border)] px-4 sm:px-5 py-3.5 shrink-0 bg-[var(--canvas)]/50" data-tour="ai-input">
            <form onSubmit={handleSendMessage} className="space-y-2.5">
              {imagePreview && (
                <div className="mb-2.5 border border-[var(--border)] rounded-[10px] p-3 bg-[var(--surface)]">
                  <div className="flex items-start gap-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-[8px] border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 truncate">{imageName}</p>
                      <p className="text-[12px] text-gray-600 mt-0.5">Image ready to analyze</p>
                    </div>
                    <button type="button" onClick={handleRemoveImage} className="p-1.5 hover:bg-gray-200 rounded-[8px] transition-colors flex-shrink-0">
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              )}

              {selectedPdf && (
                <div className="mb-2.5 border border-[var(--border)] rounded-[10px] p-3 bg-[var(--surface)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-[var(--surface)] border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 truncate font-medium">{pdfName}</p>
                      <p className="text-[12px] text-gray-600 mt-0.5">PDF ready — AI will read and analyze this</p>
                    </div>
                    <button type="button" onClick={handleRemoveImage} className="p-1.5 hover:bg-gray-200 rounded-[8px] transition-colors flex-shrink-0">
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-2 py-2 focus-within:border-brand-400 transition-colors">
                <label
                  className="cursor-pointer p-2 text-gray-600 hover:text-brand-600 hover:bg-[var(--canvas)] rounded-[8px] transition-colors shrink-0"
                  title="Attach image or PDF"
                >
                  <Paperclip className="w-[18px] h-[18px]" />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ask about a listing, draft a follow-up, or attach a file…"
                  className="flex-1 min-h-[42px] max-h-32 bg-transparent px-1 py-2 text-[13.5px] text-gray-900 placeholder:text-gray-600 focus:outline-none resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || (!inputMessage.trim() && !selectedImage && !selectedPdf)}
                  className="h-9 w-9 flex items-center justify-center rounded-[8px] bg-brand-500 text-[var(--brand-foreground)] hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-[11.5px] text-gray-600 text-center pt-1">
                AI responses are for informational purposes only and do not constitute financial advice.
              </p>
            </form>
          </div>
        </div>
        </div>
      </div>
      )}
    </DashboardPage>
  );
}
