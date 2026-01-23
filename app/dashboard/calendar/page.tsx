// Calendar page - Manage calendar integrations and events
// Connect Google Calendar and Outlook, view and create events

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import CalendarView from '@/components/CalendarView';
import EventForm from '@/components/EventForm';
import { Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { CalendarEvent } from '@/types';

/**
 * Calendar page component
 * Main calendar view with integration management
 */
export default function CalendarPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [connections, setConnections] = useState({
    google: {
      connected: false,
      email: '',
    },
  });

  // Load connection status on mount
  React.useEffect(() => {
    loadConnections();
    
    // Sync immediately on page load (silent)
    handleRefresh(true);
    
    // Auto-sync every 5 minutes
    const syncInterval = setInterval(() => {
      handleRefresh(true); // Silent sync
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, []);

  /**
   * Load calendar connections from database
   */
  const loadConnections = async () => {
    try {
      const response = await fetch('/api/calendar/connections');
      const data = await response.json();
      
      if (data.success && data.data) {
        const googleConn = data.data.find((c: any) => c.provider === 'google');
        
        setConnections({
          google: {
            connected: !!googleConn?.is_active,
            email: googleConn?.email || '',
          },
        });
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  /**
   * Create a new calendar event
   */
  const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
    setIsCreatingEvent(true);
    
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEventModal(false);
        // Reload calendar events
        window.location.reload();
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Create event error:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  /**
   * Connect to Google Calendar
   */
  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    
    try {
      // Call OAuth API route
      const response = await fetch('/api/calendar/google/connect', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success && data.data?.authUrl) {
        // Redirect to Google OAuth page
        window.location.href = data.data.authUrl;
      } else {
        alert('Failed to connect to Google Calendar. Please try again.');
      }
    } catch (error) {
      console.error('Google Calendar connection error:', error);
      alert('Failed to connect to Google Calendar. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect calendar
   */
  const handleDisconnect = async (provider: 'google') => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    try {
      const response = await fetch(`/api/calendar/${provider}/disconnect`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload connections
        loadConnections();
        alert('Calendar disconnected successfully!');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect calendar.');
    }
  };

  /**
   * Refresh calendar events
   * @param silent - Whether to show loading state
   */
  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    
    try {
      // Fetch latest events from connected calendars
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Events will be refreshed in CalendarView component
        if (!silent) {
          setTimeout(() => setRefreshing(false), 1000);
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
      if (!silent) setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <Header 
        title="Calendar" 
        subtitle="Manage your schedule and calendar integrations"
      />

      {/* Page content */}
      <div className="p-6 text-white">
        <div className="space-y-6">
          {/* Calendar connections */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Calendar Connections</h2>
                <p className="text-sm text-gray-400">
                  Connect your calendars to sync events automatically
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRefresh()}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>

            {/* Google Calendar connection */}
            <div className="border border-white/10 rounded-lg p-4 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                {/* Left side - Calendar info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Google Calendar</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {connections.google.connected ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <p className="text-sm text-gray-400">{connections.google.email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Not connected</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - Action button */}
                <div className="flex-shrink-0">
                  {connections.google.connected ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDisconnect('google')}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={handleConnectGoogle}
                      disabled={isConnecting}
                    >
                      Connect Calendar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Info message */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Events created in this app will automatically sync to your connected calendars,
                and events from your calendars will appear here.
              </p>
            </div>
          </Card>

          {/* Calendar view */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Your Schedule</h2>
              <Button size="sm" onClick={() => setShowEventModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </div>

            {/* Calendar component */}
            <CalendarView />
          </Card>
        </div>
      </div>

      {/* Event Creation Modal */}
      {showEventModal && (
        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title="Create New Event"
        >
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowEventModal(false)}
            isLoading={isCreatingEvent}
          />
        </Modal>
      )}
    </div>
  );
}


