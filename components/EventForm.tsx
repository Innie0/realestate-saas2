// EventForm component - Form for creating/editing calendar events
// Used in modal for adding new events

'use client';

import React, { useState } from 'react';
import Button from './ui/Button';
import Select from './ui/Select';
import { CalendarEvent } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';

interface EventFormProps {
  onSubmit: (eventData: Partial<CalendarEvent>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CalendarEvent>;
  isLoading?: boolean;
}

export default function EventForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: EventFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_time: initialData?.start_time 
      ? new Date(initialData.start_time).toISOString().slice(0, 16)
      : '',
    end_time: initialData?.end_time
      ? new Date(initialData.end_time).toISOString().slice(0, 16)
      : '',
    location: initialData?.location || '',
    event_type: initialData?.event_type || 'other',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert local datetime to ISO string
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    
    // Validate that end time is after start time
    if (endDate <= startDate) {
      toast.error('End time must be after start time');
      return;
    }
    
    const eventData = {
      ...formData,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      // Carry through a linked project id (e.g. opened from a project's Linked tab)
      // without exposing an editable field for it.
      ...(initialData?.project_id ? { project_id: initialData.project_id } : {}),
    };

    await onSubmit(eventData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {initialData?.project_id && (
        <div className="px-4 py-2.5 rounded-lg bg-teal-50 text-teal-700 text-[13px]">
          Linked to a listing project — this event will show up on that project&apos;s Linked tab.
        </div>
      )}

      {/* Event Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">
          Event Title *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Property Showing - 123 Main St"
          required
          style={{ backgroundColor: 'white' }}
          className="w-full px-3 py-2 text-gray-900 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <Select
        id="event_type"
        label="Event Type"
        value={formData.event_type}
        onChange={(event_type) =>
          setFormData({
            ...formData,
            event_type: event_type as 'showing' | 'open_house' | 'meeting' | 'other',
          })
        }
        triggerClassName="w-full px-3 py-2 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        options={[
          { value: 'showing', label: 'Property Showing' },
          { value: 'open_house', label: 'Open House' },
          { value: 'meeting', label: 'Meeting' },
          { value: 'other', label: 'Other' },
        ]}
      />

      {/* Start Time */}
      <div>
        <label htmlFor="start_time" className="block text-sm font-medium text-gray-600 mb-1">
          Start Time *
        </label>
        <input
          id="start_time"
          type="datetime-local"
          value={formData.start_time}
          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          required
          style={{ backgroundColor: 'white' }}
          className="w-full px-3 py-2 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {/* End Time */}
      <div>
        <label htmlFor="end_time" className="block text-sm font-medium text-gray-600 mb-1">
          End Time *
        </label>
        <input
          id="end_time"
          type="datetime-local"
          value={formData.end_time}
          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          min={formData.start_time}
          required
          style={{ backgroundColor: 'white' }}
          className="w-full px-3 py-2 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        {formData.start_time && formData.end_time && 
         new Date(formData.end_time) <= new Date(formData.start_time) && (
          <p className="text-xs text-red-400 mt-1">End time must be after start time</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-600 mb-1">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., 123 Main St, City, State"
          style={{ backgroundColor: 'white' }}
          className="w-full px-3 py-2 text-gray-900 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add event details..."
          rows={3}
          style={{ backgroundColor: 'white' }}
          className="w-full px-3 py-2 text-gray-900 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}


