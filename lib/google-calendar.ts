// Google Calendar API helper functions
// Handles OAuth authentication and calendar event operations

import { google } from 'googleapis';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/google/callback';

/**
 * Create OAuth2 client
 */
export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate Google OAuth authorization URL
 * @returns Authorization URL for user to visit
 */
export function getGoogleAuthUrl() {
  const oauth2Client = getGoogleOAuthClient();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email', // Get user's Google email
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for access token
 * @param code - Authorization code from OAuth callback
 * @returns Access token, refresh token, and expiry info
 */
export async function exchangeGoogleCode(code: string) {
  const oauth2Client = getGoogleOAuthClient();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      success: true,
      tokens: {
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || '',
        expiry_date: tokens.expiry_date || 0,
      },
    };
  } catch (error: any) {
    console.error('Google token exchange error:', error);
    return {
      success: false,
      error: error.message || 'Failed to exchange authorization code',
    };
  }
}

/**
 * Get user's Google account information (email, name, etc.)
 * @param accessToken - User's access token
 * @returns User profile information
 */
export async function getGoogleUserInfo(accessToken: string) {
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const response = await oauth2.userinfo.get();
    
    return {
      success: true,
      email: response.data.email || '',
      name: response.data.name || '',
      picture: response.data.picture || '',
    };
  } catch (error: any) {
    console.error('Get Google user info error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get user information',
    };
  }
}

/**
 * Refresh Google access token
 * @param refreshToken - Refresh token
 * @returns New access token
 */
export async function refreshGoogleToken(refreshToken: string) {
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      success: true,
      access_token: credentials.access_token || '',
      expiry_date: credentials.expiry_date || 0,
    };
  } catch (error: any) {
    console.error('Google token refresh error:', error);
    return {
      success: false,
      error: error.message || 'Failed to refresh access token',
    };
  }
}

/**
 * Get calendar events from Google Calendar
 * @param accessToken - User's access token
 * @param startDate - Start date for events
 * @param endDate - End date for events
 * @returns List of calendar events
 */
export async function getGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
) {
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items || [];
    
    return {
      success: true,
      events: events.map(event => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description,
        start_time: event.start?.dateTime || event.start?.date || '',
        end_time: event.end?.dateTime || event.end?.date || '',
        location: event.location,
      })),
    };
  } catch (error: any) {
    console.error('Get Google Calendar events error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch calendar events',
    };
  }
}

/**
 * Create event in Google Calendar
 * @param accessToken - User's access token
 * @param eventData - Event details
 * @returns Created event ID
 */
export async function createGoogleCalendarEvent(
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
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.start_time,
        timeZone: 'America/Los_Angeles', // You can make this dynamic
      },
      end: {
        dateTime: eventData.end_time,
        timeZone: 'America/Los_Angeles',
      },
      location: eventData.location,
      attendees: eventData.attendees?.map(email => ({ email })),
    };
    
    console.log('📤 Sending to Google Calendar:', {
      summary: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime,
      hasLocation: !!event.location,
      attendeesCount: event.attendees?.length || 0,
    });
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    console.log('✅ Google Calendar response:', {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      status: response.status,
    });
    
    return {
      success: true,
      event_id: response.data.id,
    };
  } catch (error: any) {
    console.error('❌ Create Google Calendar event error:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
    });
    return {
      success: false,
      error: error.message || 'Failed to create calendar event',
    };
  }
}

/**
 * Delete event from Google Calendar
 * @param accessToken - User's access token
 * @param eventId - Event ID to delete
 * @returns Success status
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
) {
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Delete Google Calendar event error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete calendar event',
    };
  }
}


