// EventForm component - Form for creating/editing calendar events
// Used in modal for adding new events

'use client';

import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import { CalendarEvent } from '@/types';

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
      alert('End time must be after start time');
      return;
    }
    
    const eventData = {
      ...formData,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
    };

    await onSubmit(eventData);
  };

  const fieldClass = "w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Event Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Event Title *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Property Showing - 123 Main St"
          required
          className={fieldClass}
        />
      </div>

      {/* Event Type */}
      <div>
        <label htmlFor="event_type" className="block text-sm font-medium text-gray-300 mb-1">
          Event Type
        </label>
        <select
          id="event_type"
          value={formData.event_type}
          onChange={(e) => setFormData({ ...formData, event_type: e.target.value as 'showing' | 'open_house' | 'meeting' | 'other' })}
          className={fieldClass}
        >
          <option value="showing">Property Showing</option>
          <option value="open_house">Open House</option>
          <option value="meeting">Meeting</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Start Time */}
      <div>
        <label htmlFor="start_time" className="block text-sm font-medium text-gray-300 mb-1">
          Start Time *
        </label>
        <input
          id="start_time"
          type="datetime-local"
          value={formData.start_time}
          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          required
          className={fieldClass}
        />
      </div>

      {/* End Time */}
      <div>
        <label htmlFor="end_time" className="block text-sm font-medium text-gray-300 mb-1">
          End Time *
        </label>
        <input
          id="end_time"
          type="datetime-local"
          value={formData.end_time}
          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          min={formData.start_time}
          required
          className={fieldClass}
        />
        {formData.start_time && formData.end_time && 
         new Date(formData.end_time) <= new Date(formData.start_time) && (
          <p className="text-xs text-red-400 mt-1">End time must be after start time</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., 123 Main St, City, State"
          className={fieldClass}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add event details..."
          rows={3}
          className={`${fieldClass} resize-none`}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-700">
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


