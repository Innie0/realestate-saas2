// TransactionTimeline component
// Displays a visual timeline of transaction milestones

'use client';

import React from 'react';
import { format, isPast, isToday, isFuture, differenceInDays } from 'date-fns';
import { 
  FileText, Search, Home, DollarSign, FileCheck, Key, 
  CheckCircle2, Clock, AlertCircle, Calendar 
} from 'lucide-react';
import { Transaction, TransactionTimelineEvent } from '@/types';

interface TransactionTimelineProps {
  transaction: Transaction;
  compact?: boolean; // For list view
}

export default function TransactionTimeline({ transaction, compact = false }: TransactionTimelineProps) {
  // Generate timeline events from transaction dates
  const generateTimelineEvents = (): TransactionTimelineEvent[] => {
    const events: TransactionTimelineEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const addEvent = (
      date: string | undefined,
      title: string,
      type: TransactionTimelineEvent['type'],
      description?: string
    ) => {
      if (!date) return;
      
      const eventDate = new Date(date);
      eventDate.setHours(0, 0, 0, 0);
      
      let status: TransactionTimelineEvent['status'];
      if (isToday(eventDate)) {
        status = 'today';
      } else if (isPast(eventDate)) {
        status = 'completed';
      } else {
        status = 'upcoming';
      }

      events.push({
        id: type,
        date,
        title,
        type,
        status,
        description,
      });
    };

    addEvent(transaction.offer_date, 'Offer Made', 'offer', 'Initial offer submitted');
    addEvent(transaction.acceptance_date, 'Offer Accepted', 'acceptance', 'Contract signed by all parties');
    addEvent(transaction.inspection_date, 'Inspection', 'inspection', 'Home inspection scheduled');
    addEvent(transaction.inspection_deadline, 'Inspection Deadline', 'inspection', 'Last day to negotiate repairs');
    addEvent(transaction.appraisal_date, 'Appraisal', 'appraisal', 'Property appraisal scheduled');
    addEvent(transaction.appraisal_deadline, 'Appraisal Deadline', 'appraisal', 'Appraisal contingency expires');
    addEvent(transaction.financing_deadline, 'Financing Deadline', 'financing', 'Loan approval required by this date');
    addEvent(transaction.title_deadline, 'Title Deadline', 'title', 'Title issues must be resolved');
    addEvent(transaction.closing_date, 'Closing', 'closing', 'Final closing and fund transfer');
    addEvent(transaction.possession_date, 'Possession', 'possession', 'Keys handed over to buyer');

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  };

  const events = generateTimelineEvents();

  // Get icon for event type
  const getEventIcon = (type: TransactionTimelineEvent['type']) => {
    switch (type) {
      case 'offer':
        return FileText;
      case 'acceptance':
        return FileCheck;
      case 'inspection':
        return Search;
      case 'appraisal':
        return Home;
      case 'financing':
        return DollarSign;
      case 'title':
        return FileCheck;
      case 'closing':
        return FileCheck;
      case 'possession':
        return Key;
      default:
        return Calendar;
    }
  };

  // Get status colors with gradients
  const getStatusColors = (status: TransactionTimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500',
          icon: 'text-green-400',
          line: 'bg-gradient-to-b from-green-500 to-green-600',
        };
      case 'today':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500 shadow-lg shadow-blue-500/20',
          icon: 'text-blue-400',
          line: 'bg-gradient-to-b from-blue-500 to-blue-600',
        };
      case 'overdue':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500',
          icon: 'text-red-400',
          line: 'bg-gradient-to-b from-red-500 to-red-600',
        };
      case 'upcoming':
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-600',
          icon: 'text-gray-400',
          line: 'bg-gradient-to-b from-gray-600 to-gray-700',
        };
    }
  };

  // Get status indicator
  const getStatusIndicator = (status: TransactionTimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'today':
        return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No dates set for this transaction.</p>
        <p className="text-sm">Add important dates to see the timeline.</p>
      </div>
    );
  }

  // Compact view for list cards
  if (compact) {
    const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'today');
    const nextEvent = upcomingEvents[0];

    if (!nextEvent) {
      return (
        <div className="flex items-center text-sm text-green-400">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          All milestones completed
        </div>
      );
    }

    const daysUntil = differenceInDays(new Date(nextEvent.date), new Date());

    return (
      <div className="flex items-center text-sm">
        <span className={`font-medium ${daysUntil <= 3 ? 'text-orange-400' : 'text-white'}`}>
          {nextEvent.title}
        </span>
        <span className="text-gray-400 ml-2">
          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}
        </span>
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="relative">
      {events.map((event, index) => {
        const Icon = getEventIcon(event.type);
        const colors = getStatusColors(event.status);
        const isLast = index === events.length - 1;

        return (
          <div key={event.id + event.date} className="relative flex items-start pb-8">
            {/* Vertical line */}
            {!isLast && (
              <div 
                className={`absolute left-5 top-10 w-0.5 h-full ${colors.line} z-0`}
                style={{ transform: 'translateX(-50%)' }}
              />
            )}

            {/* Icon circle */}
            <div className="relative z-10">
              {/* Solid background to hide line */}
              <div className="absolute inset-0 bg-black rounded-full" style={{ margin: '-2px' }} />
              {/* Icon circle */}
              <div 
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${colors.bg} ${colors.border}`}
              >
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
            </div>

            {/* Content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h4 className="text-sm font-semibold text-white">{event.title}</h4>
                  <span className="ml-2">{getStatusIndicator(event.status)}</span>
                </div>
                <span className={`text-sm ${event.status === 'today' ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </span>
              </div>
              {event.description && (
                <p className="mt-1 text-sm text-gray-400">{event.description}</p>
              )}
              {event.status === 'upcoming' && (
                <p className="mt-1 text-xs text-gray-500">
                  {differenceInDays(new Date(event.date), new Date())} days away
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
