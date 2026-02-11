'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { Sparkles, Send, Loader2, Paperclip, X, Plus, MessageSquare, Trash2, FileText, Pin } from 'lucide-react';
import { Conversation, ConversationMessage } from '@/types';

export default function TasksPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('U');
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user info and conversations on page load
  useEffect(() => {
    fetchUserInfo();
    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      fetchMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch('/api/conversations');
      const result = await response.json();

      if (result.success) {
        setConversations(result.data);
      } else {
        setError(result.error || 'Failed to load conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations?conversation_id=${conversationId}`);
      const result = await response.json();

      if (result.success) {
        setMessages(result.data.messages || []);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

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
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageName(null);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
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
        setConversations(prev => prev.filter(c => c.id !== conversationId));
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
        // Update local state
        setConversations(prev => 
          prev.map(c => 
            c.id === conversationId 
              ? { ...c, pinned: !currentPinned }
              : c
          ).sort((a, b) => {
            // Sort: pinned first, then by updated_at
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          })
        );
      } else {
        setError(result.error || 'Failed to pin conversation');
      }
    } catch (err) {
      console.error('Error pinning conversation:', err);
      setError('Failed to pin conversation');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() && !selectedImage) return;

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
      image_name: imageName,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);
    
    const messageText = inputMessage.trim();
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
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { conversation_id, messages: updatedMessages } = result.data;
        
        // Update conversation ID if it's a new conversation
        if (!currentConversationId) {
          setCurrentConversationId(conversation_id);
          fetchConversations(); // Refresh conversation list
        }
        
        // Update messages with actual data from server
        setMessages(updatedMessages);
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
    <div className="min-h-screen flex flex-col">
      <Header 
        title="AI Assistant" 
        subtitle="Chat with AI about your real estate tasks"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation History */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-900/50 backdrop-blur-sm border-r border-white/10 transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="p-4 border-b border-white/10">
            <Button
              onClick={handleNewConversation}
              className="w-full justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingConversations ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-800/50 rounded-lg animate-pulse" />
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
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5 border border-transparent'
                    } ${conv.pinned ? 'border-l-2 border-l-purple-500' : ''}`}
                    onClick={() => setCurrentConversationId(conv.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                        {conv.pinned && <Pin className="w-3 h-3 text-purple-400 fill-purple-400" />}
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {conv.title || 'New conversation'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(conv.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(conv.id, conv.pinned);
                          }}
                          className="p-1 hover:bg-purple-500/20 rounded transition-all"
                          title={conv.pinned ? 'Unpin conversation' : 'Pin conversation'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${conv.pinned ? 'text-purple-400 fill-purple-400' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="p-1 hover:bg-red-500/20 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900/30 to-gray-900/50">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-20 left-2 z-10 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg border border-white/10 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-gray-300" />
          </button>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-gray-400">
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
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`flex-1 max-w-2xl ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                              : 'bg-gray-800/50 backdrop-blur-sm border border-white/10 text-gray-100'
                          }`}
                        >
                          {msg.image_url && (
                            <div className="mb-3">
                              <img 
                                src={msg.image_url} 
                                alt={msg.image_name || 'Uploaded image'} 
                                className="max-w-xs rounded-lg border border-white/10"
                              />
                              {msg.image_name && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {msg.image_name}
                                </p>
                              )}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-sm font-medium">
                          {userInitials}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 max-w-2xl">
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            <span className="text-sm text-gray-400">Thinking...</span>
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
            <div className="px-6 pb-2">
              <div className="max-w-3xl mx-auto">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-white/10 p-6 bg-gray-900/50 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="border border-white/20 rounded-lg p-3 bg-white/5">
                    <div className="flex items-start gap-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded border border-white/10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">
                          <FileText className="w-3.5 h-3.5 inline mr-1" />
                          {imageName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Ready to analyze
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-300" />
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
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-4 pr-24 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none"
                    rows={1}
                    disabled={isLoading}
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg transition-colors group">
                      <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                      className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-blue-600"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-yellow-400/80 text-center">
                  ⚠️ AI responses are for informational purposes only and do not constitute financial advice
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
