'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, X, Send, ChevronDown } from 'lucide-react';

const DISMISSED_KEY = 'feedback_widget_dismissed';

type FeedbackType = 'general' | 'bug' | 'feature';

export default function FeedbackWidget() {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY) === 'true';
    setDismissed(wasDismissed);

    const handleOpenEvent = () => {
      setDismissed(false);
      setOpen(true);
    };
    window.addEventListener('open-feedback', handleOpenEvent);
    return () => window.removeEventListener('open-feedback', handleOpenEvent);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });
      setSubmitted(true);
      setMessage('');
      setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
      }, 2000);
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || dismissed) return null;

  return (
    <>
      {/* Feedback panel */}
      {open && (
        <div className="fixed bottom-28 right-6 z-50 w-80 rounded-2xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">Share Feedback</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-white font-medium">Thanks for your feedback!</p>
              <p className="text-gray-400 text-sm mt-1">We really appreciate it.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
              {/* Type selector */}
              <div className="flex gap-2">
                {(['general', 'bug', 'feature'] as FeedbackType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                      type === t
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-transparent border-white/5 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {t === 'bug' ? 'Bug' : t === 'feature' ? 'Feature' : 'General'}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? "Describe what went wrong..."
                    : type === 'feature'
                    ? "What would you like to see?"
                    : "Tell us what you think..."
                }
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-white/25 transition-colors"
              />

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating button */}
      <div className="fixed bottom-14 right-6 z-50 flex items-center gap-2">
        {/* X dismiss button */}
        {!open && (
          <button
            onClick={handleDismiss}
            className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
            title="Dismiss"
          >
            <X className="w-3 h-3 text-gray-300" />
          </button>
        )}

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black text-sm font-semibold shadow-lg hover:bg-gray-100 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      </div>
    </>
  );
}
