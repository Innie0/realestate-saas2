// TransactionTimeline component
// Displays a visual timeline of transaction milestones

'use client';

import React from 'react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { 
  FileText, Search, Home, DollarSign, FileCheck, Key, 
  CheckCircle2, Calendar 
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

  const getMilestoneStyles = (status: TransactionTimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
          line: 'bg-emerald-500',
        };
      case 'today':
        return {
          icon: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
          line: 'bg-brand-500',
        };
      case 'overdue':
        return {
          icon: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
          line: 'bg-rose-400',
        };
      default:
        return {
          icon: 'bg-gray-100 text-gray-600',
          line: 'bg-gray-150',
        };
    }
  };

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

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-[13.5px] text-gray-700">No dates set for this transaction.</p>
        <p className="text-[12.5px] mt-1">Add important dates to see the timeline.</p>
      </div>
    );
  }

  // Compact view for list cards
  if (compact) {
    const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'today');
    const nextEvent = upcomingEvents[0];

    if (!nextEvent) {
      return (
        <div className="flex items-center text-[13px] text-emerald-700">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          All milestones completed
        </div>
      );
    }

    const daysUntil = differenceInDays(new Date(nextEvent.date), new Date());

    return (
      <div className="flex items-center text-[13px]">
        <span className={`font-medium ${daysUntil <= 3 ? 'text-amber-700' : 'text-gray-900'}`}>
          {nextEvent.title}
        </span>
        <span className="text-gray-600 ml-2">
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
        const styles = getMilestoneStyles(event.status);
        const isLast = index === events.length - 1;

        return (
          <div key={event.id + event.date} className="relative flex items-start pb-7 last:pb-0">
            {/* Vertical line — green below completed milestones */}
            {!isLast && (
              <div
                className={`absolute left-[17px] top-[34px] w-px bottom-0 ${styles.line}`}
                style={{ transform: 'translateX(-50%)' }}
              />
            )}

            {/* Icon circle */}
            <div
              className={`relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full ${styles.icon}`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
            </div>

            {/* Content */}
            <div className="ml-3.5 flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-[14.5px] font-semibold text-gray-900">{event.title}</h4>
                  {event.description && (
                    <p className="text-[12.5px] text-gray-600 mt-0.5">{event.description}</p>
                  )}
                  {event.status === 'upcoming' && (
                    <p className="text-[12px] text-gray-600 mt-0.5">
                      {differenceInDays(new Date(event.date), new Date())} days away
                    </p>
                  )}
                </div>
                <span className="text-[12.5px] font-medium text-gray-700 shrink-0">
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
