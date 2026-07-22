'use client';

import { Client } from '@/types';
import { Mail, Phone, Calendar, StickyNote, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Card } from './ui/Card';
import {
  STAGE_BADGE,
  getClientAvatarClass,
  getClientInitials,
  getClientStage,
} from '@/lib/client-crm-display';

interface ClientCardProps {
  client: Client & { 
    upcoming_reminders_count?: number;
    latest_note?: { id: string; note: string; created_at: string } | null;
    notes_count?: number;
    all_notes?: Array<{ id: string; note: string; created_at: string }>;
  };
  onAddNote?: (e: React.MouseEvent) => void;
  onAddReminder?: (e: React.MouseEvent) => void;
}

/**
 * ClientCard component
 * Displays a client's basic information in a card format
 */
export default function ClientCard({ client, onAddNote, onAddReminder }: ClientCardProps) {
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const notes = client.all_notes || (client.latest_note ? [client.latest_note] : []);
  const stage = getClientStage(client);
  const stageStyle = STAGE_BADGE[stage];

  const handleAddNote = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onAddNote) onAddNote(e);
  };

  const handleAddReminder = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onAddReminder) onAddReminder(e);
  };

  const handlePrevNote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentNoteIndex((prev) => (prev > 0 ? prev - 1 : notes.length - 1));
  };

  const handleNextNote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentNoteIndex((prev) => (prev < notes.length - 1 ? prev + 1 : 0));
  };

  const currentNote = notes[currentNoteIndex];

  return (
    <Link href={`/dashboard/clients/${client.id}`} className="block h-full">
      <Card
        className="cursor-pointer relative h-full min-h-[260px] p-5 sm:p-[22px] transition-colors hover:bg-muted/40"
      >
        <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Client name */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getClientAvatarClass(client.name)}`}>
              {getClientInitials(client.name) || '?'}
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-gray-900 truncate">{client.name}</h3>
              <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${stageStyle.className}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dotClassName}`} />
                {stageStyle.label}
              </span>
            </div>
          </div>

          {/* Contact information */}
          <div className="space-y-1.5">
            {client.email && (
              <div className="flex items-center gap-2 text-[12.5px] text-gray-700">
                <Mail className="w-3.5 h-3.5 text-gray-600" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-[12.5px] text-gray-700">
                <Phone className="w-3.5 h-3.5 text-gray-600" />
                <span>{client.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming reminders badge */}
        {client.upcoming_reminders_count !== undefined && client.upcoming_reminders_count > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium shrink-0">
            <Calendar className="w-3 h-3" />
            <span>{client.upcoming_reminders_count}</span>
          </div>
        )}
      </div>

      {/* Notes carousel */}
      {notes.length > 0 && currentNote && (
        <div className="mt-4 p-3 bg-gray-50 rounded-[10px] border border-gray-150 relative">
          <div className="flex items-start gap-2 mb-1">
            <StickyNote className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-[12.5px] text-gray-700 line-clamp-2">{currentNote.note}</p>
              <p className="text-[11px] text-gray-600 mt-1">
                {new Date(currentNote.created_at).toLocaleDateString()}
                {notes.length > 1 && (
                  <span className="ml-2">• {currentNoteIndex + 1} of {notes.length}</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Navigation arrows - only show if multiple notes */}
          {notes.length > 1 && (
            <div className="absolute top-1/2 -translate-y-1/2 right-2 flex gap-1">
              <button
                onClick={handlePrevNote}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Previous note"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleNextNote}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Next note"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Created date and quick actions */}
      <div className="mt-4 pt-4 border-t border-gray-150 flex items-center justify-between">
        <p className="text-[11.5px] text-gray-600">
          Added {new Date(client.created_at).toLocaleDateString()}
        </p>
        
        {/* Quick action buttons */}
        <div className="flex gap-1">
          <button
            onClick={handleAddNote}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            title="Add note"
          >
            <StickyNote className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
          </button>
          <button
            onClick={handleAddReminder}
            className="p-2 hover:bg-amber-50 rounded-lg transition-colors group"
            title="Add reminder"
          >
            <Bell className="w-4 h-4 text-gray-600 group-hover:text-amber-700" />
          </button>
        </div>
      </div>
      </Card>
    </Link>
  );
}
