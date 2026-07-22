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
      setOpen((prev) => !prev);
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

  if (!mounted) return null;

  return (
    <>
      {/* Feedback panel — shows regardless of dismissed state */}
      {open && (
        <div className={`fixed ${dismissed ? 'bottom-16' : 'bottom-28'} right-6 z-50 w-80 rounded-2xl border border-gray-200 bg-[var(--surface)] shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Share Feedback</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-700 hover:text-brand-600 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-gray-900 font-medium">Thanks for your feedback!</p>
              <p className="text-gray-700 text-sm mt-1">We really appreciate it.</p>
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
                        ? 'bg-gray-100 border-gray-300 text-gray-900'
                        : 'bg-transparent border-gray-100 text-gray-700 hover:text-gray-900'
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
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-300 transition-colors"
              />

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full h-9 rounded-lg bg-brand-500 text-[var(--brand-foreground)] text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

      {/* Floating button — hidden when dismissed */}
      {!dismissed && <div className="fixed bottom-14 right-6 z-50 flex items-center gap-2">
        {/* X dismiss button */}
        {!open && (
          <button
            onClick={handleDismiss}
            className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            title="Dismiss"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        )}

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-[var(--brand-foreground)] text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      </div>}
    </>
  );
}
