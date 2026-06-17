'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { Sparkles, Send, Loader2, Paperclip, X, Plus, MessageSquare, Trash2, FileText, Pin, Edit3, Check, MoreVertical } from 'lucide-react';
import { Conversation, ConversationMessage } from '@/types';
import { useApi } from '@/lib/swr';

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export default function TasksPage() {
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    mutate: mutateConversations,
  } = useApi<Conversation[]>('/api/conversations');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('U');
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // PDF upload state
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Rename state
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
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
    document.title = 'AI Assistant - Realestic';
  }, []);

  // Fetch user info on page load
  useEffect(() => {
    fetchUserInfo();
  }, []);

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

  const fetchUserInfo = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to get full name from user metadata
        const fullName = user.user_metadata?.full_name || user.email || '';
        
        // Generate initials
        if (fullName) {
          const names = fullName.split(' ').filter(Boolean);
          if (names.length >= 2) {
            // Take first letter of first two names
            setUserInitials((names[0][0] + names[1][0]).toUpperCase());
          } else if (names.length === 1) {
            // Take first two letters of single name
            setUserInitials(names[0].slice(0, 2).toUpperCase());
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

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
    
    if (!inputMessage.trim() && !selectedImage && !selectedPdf) return;

    setIsLoading(true);
    setError(null);

    // Optimistically add user message to UI
    const tempUserMessage: ConversationMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: currentConversationId || 'temp',
      user_id: 'current',
      role: 'user',
      content: inputMessage.trim(),
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

    const messageText = inputMessage.trim();
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
          imageData: selectedImage,
          imageName: imageName,
          pdfData: capturedPdf,
          pdfName: capturedPdfName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { conversation_id, messages: updatedMessages } = result.data;
        
        // Update conversation ID if it's a new conversation
        if (!currentConversationId) {
          setCurrentConversationId(conversation_id);
          void mutateConversations();
        }
        
        // Update messages with actual data from server
        setMessages(updatedMessages);
        if (conversation_id) {
          messageCacheRef.current[conversation_id] = updatedMessages;
        }
      } else {
        setError(result.error || 'Failed to send message');
        // Remove optimistic message on error
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

  return (
    <div className="h-screen flex flex-col">
      <Header 
        title="AI Assistant" 
        subtitle="Chat with AI about your real estate tasks"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation History */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0`}>
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <Button
              onClick={handleNewConversation}
              className="w-full justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-0">
            {isLoadingConversations ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      currentConversationId === conv.id
                        ? 'bg-gray-100 border border-gray-300'
                        : 'hover:bg-gray-50 border border-transparent'
                    } ${conv.pinned ? 'border-l-2 border-l-gray-900' : ''}`}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                        {conv.pinned && <Pin className="w-3 h-3 text-gray-900 fill-white" />}
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingConversationId === conv.id ? (
                          // Edit Mode
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(conv.id);
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              className="w-full text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                              autoFocus
                            />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveRename(conv.id)}
                                className="p-1 hover:bg-green-500/20 rounded transition-all"
                                title="Save"
                              >
                                <Check className="w-3 h-3 text-green-400" />
                              </button>
                              <button
                                onClick={handleCancelRename}
                                className="p-1 hover:bg-red-500/20 rounded transition-all"
                                title="Cancel"
                              >
                                <X className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <p 
                              className="text-xs text-gray-900 leading-snug line-clamp-2" 
                              title={conv.title || 'New conversation'}
                            >
                              {conv.title || 'New conversation'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(conv.updated_at)}
                            </p>
                          </>
                        )}
                      </div>
                      {editingConversationId !== conv.id && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-all opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === conv.id && (
                            <div 
                              className="absolute right-0 top-8 z-50 w-40 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  handleStartRename(conv.id, conv.title || '');
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-900 hover:bg-gray-100 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Rename
                              </button>
                              <button
                                onClick={() => {
                                  handleTogglePin(conv.id, conv.pinned);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-900 hover:bg-gray-100 transition-colors"
                              >
                                <Pin className="w-3.5 h-3.5" />
                                {conv.pinned ? 'Unpin' : 'Pin'}
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteConversation(conv.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#F5F5F5] min-w-0">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-20 left-2 z-10 p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-gray-600" />
          </button>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-h-0">
            <div className="max-w-3xl mx-auto">
              {isLoadingMessages ? (
                <div className="space-y-4 py-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex gap-4 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                    >
                      {i % 2 !== 0 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                      )}
                      <div
                        className={`h-16 rounded-2xl bg-gray-200 animate-pulse ${
                          i % 2 === 0 ? 'w-2/5' : 'w-3/5'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border border-gray-200 mb-4">
                      <Sparkles className="w-8 h-8 text-gray-900/60" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-gray-500">
                      Ask me anything about your real estate tasks
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-brand-600" />
                        </div>
                      )}
                      
                      <div className={`flex-1 max-w-2xl ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-brand-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          {/* Image attachment */}
                          {msg.image_url && !msg.image_name?.toLowerCase().endsWith('.pdf') && (
                            <div className="mb-3">
                              <img
                                src={msg.image_url}
                                alt={msg.image_name || 'Uploaded image'}
                                className="max-w-xs rounded-lg border border-gray-200"
                              />
                              {msg.image_name && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {msg.image_name}
                                </p>
                              )}
                            </div>
                          )}
                          {/* PDF attachment badge */}
                          {msg.image_name?.toLowerCase().endsWith('.pdf') && (
                            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg w-fit">
                              <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 truncate max-w-[200px]">{msg.image_name}</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-black text-sm font-medium">
                          {userInitials}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-brand-600" />
                      </div>
                      <div className="flex-1 max-w-2xl">
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 pb-2 flex-shrink-0">
              <div className="max-w-3xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6 bg-[#F5F5F5] flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate">
                          <FileText className="w-3.5 h-3.5 inline mr-1" />
                          {imageName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Image ready to analyze</p>
                      </div>
                      <button type="button" onClick={handleRemoveImage} className="p-1.5 hover:bg-red-500/20 rounded transition-colors flex-shrink-0">
                        <X className="w-4 h-4 text-gray-500 hover:text-red-300" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PDF Preview */}
                {selectedPdf && (
                  <div className="border border-brand-500/30 rounded-lg p-3 bg-brand-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate font-medium">{pdfName}</p>
                        <p className="text-xs text-brand-500 mt-0.5">PDF ready — AI will read and analyze this</p>
                      </div>
                      <button type="button" onClick={handleRemoveImage} className="p-1.5 hover:bg-red-500/20 rounded transition-colors flex-shrink-0">
                        <X className="w-4 h-4 text-gray-500 hover:text-red-300" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Box */}
                <div className="relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-24 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-gray-300 resize-none"
                    rows={1}
                    disabled={isLoading}
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors group" title="Attach image or PDF">
                      <Paperclip className="w-5 h-5 text-gray-500 group-hover:text-brand-600 transition-colors" />
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isLoading || (!inputMessage.trim() && !selectedImage && !selectedPdf)}
                      className="p-2 bg-white hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-black animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-black" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  AI responses are for informational purposes only and do not constitute financial advice
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
