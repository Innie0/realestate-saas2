'use client';

import { Client } from '@/types';
import { Mail, Phone, User, Calendar, StickyNote, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Card from './ui/Card';

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
    <Link href={`/dashboard/clients/${client.id}`} className="block">
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer relative h-full"
      >
        <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Client name */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-400/30">
              <User className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">{client.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                client.status === 'active' 
                  ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                  : client.status === 'inactive'
                  ? 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                  : 'bg-red-500/20 text-red-400 border border-red-400/30'
              }`}>
                {client.status}
              </span>
            </div>
          </div>

          {/* Contact information */}
          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                <span>{client.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming reminders badge */}
        {client.upcoming_reminders_count !== undefined && client.upcoming_reminders_count > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium border border-orange-400/30">
            <Calendar className="w-3 h-3" />
            <span>{client.upcoming_reminders_count}</span>
          </div>
        )}
      </div>

      {/* Notes carousel */}
      {notes.length > 0 && currentNote && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-400/30 relative backdrop-blur-sm">
          <div className="flex items-start gap-2 mb-1">
            <StickyNote className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-sm text-gray-300 line-clamp-2">{currentNote.note}</p>
              <p className="text-xs text-gray-500 mt-1">
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
                className="p-1 hover:bg-blue-400/20 rounded transition-colors"
                title="Previous note"
              >
                <ChevronLeft className="w-4 h-4 text-blue-400" />
              </button>
              <button
                onClick={handleNextNote}
                className="p-1 hover:bg-blue-400/20 rounded transition-colors"
                title="Next note"
              >
                <ChevronRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Created date and quick actions */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Added {new Date(client.created_at).toLocaleDateString()}
        </p>
        
        {/* Quick action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleAddNote}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors group"
            title="Add note"
          >
            <StickyNote className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
          </button>
          <button
            onClick={handleAddReminder}
            className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors group"
            title="Add reminder"
          >
            <Bell className="w-4 h-4 text-gray-400 group-hover:text-orange-400" />
          </button>
        </div>
      </div>
    </Card>
    </Link>
  );
}






