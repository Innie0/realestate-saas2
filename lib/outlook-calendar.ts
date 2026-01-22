// Outlook Calendar API helper functions
// Handles Microsoft OAuth authentication and calendar event operations

import { Client } from '@microsoft/microsoft-graph-client';

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/outlook/callback';

/**
 * Generate Microsoft OAuth authorization URL
 * @returns Authorization URL for user to visit
 */
export function getOutlookAuthUrl() {
  const scopes = ['Calendars.ReadWrite', 'offline_access'];
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${MICROSOFT_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&response_mode=query`;

  return authUrl;
}

/**
 * Exchange authorization code for access token
 * @param code - Authorization code from OAuth callback
 * @returns Access token, refresh token, and expiry info
 */
export async function exchangeOutlookCode(code: string) {
  try {
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code: code,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code',
    });
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        error: data.error_description || 'Failed to exchange authorization code',
      };
    }
    
    return {
      success: true,
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: Date.now() + (data.expires_in * 1000),
      },
    };
  } catch (error: any) {
    console.error('Outlook token exchange error:', error);
    return {
      success: false,
      error: error.message || 'Failed to exchange authorization code',
    };
  }
}

/**
 * Refresh Microsoft access token
 * @param refreshToken - Refresh token
 * @returns New access token
 */
export async function refreshOutlookToken(refreshToken: string) {
  try {
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        error: data.error_description || 'Failed to refresh access token',
      };
    }
    
    return {
      success: true,
      access_token: data.access_token,
      expiry_date: Date.now() + (data.expires_in * 1000),
    };
  } catch (error: any) {
    console.error('Outlook token refresh error:', error);
    return {
      success: false,
      error: error.message || 'Failed to refresh access token',
    };
  }
}

/**
 * Create Microsoft Graph client with access token
 */
function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Get calendar events from Outlook Calendar
 * @param accessToken - User's access token
 * @param startDate - Start date for events
 * @param endDate - End date for events
 * @returns List of calendar events
 */
export async function getOutlookCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
) {
  const client = getGraphClient(accessToken);
  
  try {
    const response = await client
      .api('/me/calendar/events')
      .filter(`start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`)
      .orderby('start/dateTime')
      .select('id,subject,bodyPreview,start,end,location')
      .get();
    
    const events = response.value || [];
    
    return {
      success: true,
      events: events.map((event: any) => ({
        id: event.id,
        title: event.subject || 'Untitled Event',
        description: event.bodyPreview,
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        location: event.location?.displayName,
      })),
    };
  } catch (error: any) {
    console.error('Get Outlook Calendar events error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch calendar events',
    };
  }
}

/**
 * Create event in Outlook Calendar
 * @param accessToken - User's access token
 * @param eventData - Event details
 * @returns Created event ID
 */
export async function createOutlookCalendarEvent(
  accessToken: string,
  eventData: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    attendees?: string[];
  }
) {
  const client = getGraphClient(accessToken);
  
  try {
    const event = {
      subject: eventData.title,
      body: {
        contentType: 'text',
        content: eventData.description || '',
      },
      start: {
        dateTime: eventData.start_time,
        timeZone: 'Pacific Standard Time', // You can make this dynamic
      },
      end: {
        dateTime: eventData.end_time,
        timeZone: 'Pacific Standard Time',
      },
      location: {
        displayName: eventData.location || '',
      },
      attendees: eventData.attendees?.map(email => ({
        emailAddress: { address: email },
        type: 'required',
      })),
    };
    
    const response = await client
      .api('/me/calendar/events')
      .post(event);
    
    return {
      success: true,
      event_id: response.id,
    };
  } catch (error: any) {
    console.error('Create Outlook Calendar event error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create calendar event',
    };
  }
}

/**
 * Delete event from Outlook Calendar
 * @param accessToken - User's access token
 * @param eventId - Event ID to delete
 * @returns Success status
 */
export async function deleteOutlookCalendarEvent(
  accessToken: string,
  eventId: string
) {
  const client = getGraphClient(accessToken);
  
  try {
    await client
      .api(`/me/calendar/events/${eventId}`)
      .delete();
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Delete Outlook Calendar event error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete calendar event',
    };
  }
}


