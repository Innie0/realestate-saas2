// @ts-nocheck
// Transaction Calendar Sync
// Syncs transaction important dates to the web app calendar and Google Calendar

import { createGoogleCalendarEvent, refreshGoogleToken, deleteGoogleCalendarEvent } from './google-calendar';

interface TransactionDate {
  date: string;
  type: string;
  title: string;
  description: string;
}

interface Transaction {
  id: string;
  property_address: string;
  property_city?: string;
  property_state?: string;
  buyer_name: string;
  seller_name: string;
  offer_date?: string;
  acceptance_date?: string;
  inspection_date?: string;
  inspection_deadline?: string;
  appraisal_date?: string;
  appraisal_deadline?: string;
  financing_deadline?: string;
  title_deadline?: string;
  closing_date?: string;
  possession_date?: string;
}

/**
 * Extract all important dates from a transaction
 */
export function extractTransactionDates(transaction: Transaction): TransactionDate[] {
  const dates: TransactionDate[] = [];
  const address = transaction.property_address;
  const location = [transaction.property_city, transaction.property_state].filter(Boolean).join(', ');
  
  // Offer Date
  if (transaction.offer_date) {
    dates.push({
      date: transaction.offer_date,
      type: 'offer',
      title: `📝 Offer Date - ${address}`,
      description: `Offer submitted for ${address}${location ? ` in ${location}` : ''}.\nBuyer: ${transaction.buyer_name}\nSeller: ${transaction.seller_name}`,
    });
  }
  
  // Acceptance Date
  if (transaction.acceptance_date) {
    dates.push({
      date: transaction.acceptance_date,
      type: 'acceptance',
      title: `✅ Contract Acceptance - ${address}`,
      description: `Offer accepted for ${address}.\nBuyer: ${transaction.buyer_name}\nSeller: ${transaction.seller_name}`,
    });
  }
  
  // Inspection Date
  if (transaction.inspection_date) {
    dates.push({
      date: transaction.inspection_date,
      type: 'inspection',
      title: `🔍 Home Inspection - ${address}`,
      description: `Scheduled home inspection for ${address}.`,
    });
  }
  
  // Inspection Deadline
  if (transaction.inspection_deadline) {
    dates.push({
      date: transaction.inspection_deadline,
      type: 'inspection_deadline',
      title: `⚠️ Inspection Deadline - ${address}`,
      description: `Inspection contingency deadline for ${address}. All inspection items must be resolved.`,
    });
  }
  
  // Appraisal Date
  if (transaction.appraisal_date) {
    dates.push({
      date: transaction.appraisal_date,
      type: 'appraisal',
      title: `📊 Appraisal - ${address}`,
      description: `Property appraisal scheduled for ${address}.`,
    });
  }
  
  // Appraisal Deadline
  if (transaction.appraisal_deadline) {
    dates.push({
      date: transaction.appraisal_deadline,
      type: 'appraisal_deadline',
      title: `⚠️ Appraisal Deadline - ${address}`,
      description: `Appraisal contingency deadline for ${address}.`,
    });
  }
  
  // Financing Deadline
  if (transaction.financing_deadline) {
    dates.push({
      date: transaction.financing_deadline,
      type: 'financing_deadline',
      title: `💰 Financing Deadline - ${address}`,
      description: `Loan approval deadline for ${address}. Financing must be secured.`,
    });
  }
  
  // Title Deadline
  if (transaction.title_deadline) {
    dates.push({
      date: transaction.title_deadline,
      type: 'title_deadline',
      title: `📜 Title Deadline - ${address}`,
      description: `Title review deadline for ${address}. All title issues must be resolved.`,
    });
  }
  
  // Closing Date
  if (transaction.closing_date) {
    dates.push({
      date: transaction.closing_date,
      type: 'closing',
      title: `🏠 CLOSING DAY - ${address}`,
      description: `Closing day for ${address}!\nBuyer: ${transaction.buyer_name}\nSeller: ${transaction.seller_name}\n\nBring government-issued ID and be ready to sign documents.`,
    });
  }
  
  // Possession Date
  if (transaction.possession_date) {
    dates.push({
      date: transaction.possession_date,
      type: 'possession',
      title: `🔑 Possession Date - ${address}`,
      description: `Buyer takes possession of ${address}.`,
    });
  }
  
  return dates;
}

/**
 * Create calendar events for transaction dates
 * Returns the created event IDs for later reference
 */
export async function syncTransactionToCalendar(
  supabase: any,
  userId: string,
  transaction: Transaction
): Promise<{ success: boolean; eventsCreated: number; error?: string }> {
  try {
    console.log('📅 Starting transaction calendar sync for:', transaction.property_address);
    console.log('📅 Transaction dates:', {
      offer_date: transaction.offer_date,
      acceptance_date: transaction.acceptance_date,
      inspection_date: transaction.inspection_date,
      inspection_deadline: transaction.inspection_deadline,
      appraisal_date: transaction.appraisal_date,
      appraisal_deadline: transaction.appraisal_deadline,
      financing_deadline: transaction.financing_deadline,
      title_deadline: transaction.title_deadline,
      closing_date: transaction.closing_date,
      possession_date: transaction.possession_date,
    });
    
    const dates = extractTransactionDates(transaction);
    
    if (dates.length === 0) {
      console.log('⚠️ No dates found to sync! Make sure you added dates when creating the transaction.');
      return { success: true, eventsCreated: 0 };
    }
    
    console.log(`📅 Found ${dates.length} dates to sync:`, dates.map(d => d.title));
    
    let eventsCreated = 0;
    
    // Get user's calendar connections for Google Calendar sync
    const { data: connections, error: connError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (connError) {
      console.log('ℹ️ No calendar connections found or error:', connError.message);
    }
    
    const googleConnection = connections?.find((c: any) => c.provider === 'google');
    let googleAccessToken = googleConnection?.access_token;
    
    // Always try to refresh Google token if we have a refresh token
    // This handles expired tokens properly
    if (googleConnection && googleConnection.refresh_token) {
      const now = new Date();
      const expiryDate = googleConnection.token_expiry ? new Date(googleConnection.token_expiry) : new Date(0);
      
      // Refresh if token is expired OR will expire in next 10 minutes
      if (expiryDate.getTime() <= now.getTime() || expiryDate.getTime() - now.getTime() < 10 * 60 * 1000) {
        console.log('🔄 Refreshing Google access token for transaction sync...');
        try {
          const refreshResult = await refreshGoogleToken(googleConnection.refresh_token);
          
          if (refreshResult.success && refreshResult.access_token) {
            googleAccessToken = refreshResult.access_token;
            console.log('✅ Google token refreshed successfully');
            
            // Update token in database
            await supabase
              .from('calendar_connections')
              .update({
                access_token: googleAccessToken,
                token_expiry: refreshResult.expiry_date ? new Date(refreshResult.expiry_date).toISOString() : new Date().toISOString(),
              })
              .eq('id', googleConnection.id);
          } else {
            console.error('❌ Failed to refresh Google token:', refreshResult.error);
            console.log('⚠️ Please disconnect and reconnect Google Calendar in your Calendar settings.');
            googleAccessToken = null;
            
            // Mark connection as inactive so user knows to reconnect
            await supabase
              .from('calendar_connections')
              .update({ is_active: false })
              .eq('id', googleConnection.id);
            console.log('ℹ️ Marked Google Calendar connection as inactive. Please reconnect in Calendar settings.');
          }
        } catch (refreshError: any) {
          console.error('❌ Error refreshing Google token:', refreshError.message);
          console.log('⚠️ Please disconnect and reconnect Google Calendar in your Calendar settings.');
          googleAccessToken = null;
          
          // Mark as inactive on any refresh error
          try {
            await supabase
              .from('calendar_connections')
              .update({ is_active: false })
              .eq('id', googleConnection.id);
          } catch (e) {
            // Ignore update error
          }
        }
      }
    } else if (!googleConnection) {
      console.log('ℹ️ No Google Calendar connection found. Connect in Calendar settings to sync to Google Calendar.');
    }
    
    // Create calendar events for each date
    for (const dateInfo of dates) {
      // Create event times - parse date correctly
      const eventDate = new Date(dateInfo.date + 'T00:00:00');
      const startTime = new Date(eventDate);
      startTime.setHours(9, 0, 0, 0); // 9 AM
      const endTime = new Date(eventDate);
      endTime.setHours(10, 0, 0, 0); // 10 AM (1 hour event)
      
      // For closing, make it a longer event
      if (dateInfo.type === 'closing') {
        endTime.setHours(12, 0, 0, 0); // 3 hour event for closing
      }
      
      console.log(`📅 Creating event for ${dateInfo.type}: ${dateInfo.title} on ${dateInfo.date}`);
      
      // Try to create event in web app calendar
      let calendarEvent = null;
      let calendarError = null;
      
      // Build the event data - explicitly set google_event_id to null
      const eventData: any = {
        user_id: userId,
        title: dateInfo.title,
        description: dateInfo.description + `\n\n[Transaction: ${transaction.id}]`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: 'other', // Start with 'other' to avoid constraint issues
        google_event_id: null, // Explicitly set to null to avoid constraint issues
        outlook_event_id: null,
      };
      
      // Try to insert the calendar event
      const insertResult = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single();
      
      if (insertResult.error) {
        console.error('❌ Calendar insert error:', insertResult.error.message);
        console.error('❌ Error code:', insertResult.error.code);
        
        // If it's a duplicate key error, skip this event (already exists)
        if (insertResult.error.code === '23505') {
          console.log('⚠️ Event already exists, skipping...');
          continue;
        }
        
        calendarError = insertResult.error;
      } else {
        calendarEvent = insertResult.data;
        console.log('✅ Calendar event created:', calendarEvent?.id, '-', dateInfo.title);
      }
      
      if (calendarError) {
        console.error(`❌ Error creating calendar event for ${dateInfo.type}:`, calendarError.message);
        continue;
      }
      
      eventsCreated++;
      console.log(`✅ Created web app calendar event: ${dateInfo.title}`);
      
      // Sync to Google Calendar if connected and token is valid
      if (googleAccessToken) {
        try {
          console.log(`📤 Pushing to Google Calendar: ${dateInfo.title}`);
          const googleResult = await createGoogleCalendarEvent(googleAccessToken, {
            title: dateInfo.title,
            description: dateInfo.description,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          });
          
          if (googleResult.success && googleResult.event_id) {
            // Update the calendar event with Google Calendar ID
            if (calendarEvent?.id) {
              await supabase
                .from('calendar_events')
                .update({ google_event_id: googleResult.event_id })
                .eq('id', calendarEvent.id);
            }
            
            console.log(`✅ Synced to Google Calendar: ${dateInfo.title}`);
          } else {
            console.error(`❌ Failed to sync to Google Calendar: ${googleResult.error}`);
          }
        } catch (googleError: any) {
          console.error('❌ Google Calendar sync error:', googleError.message);
        }
      } else if (googleConnection) {
        console.log('⚠️ Google Calendar connected but token is invalid. Please reconnect Google Calendar.');
      }
    }
    
    console.log(`📅 Transaction calendar sync complete: ${eventsCreated} events created`);
    return { success: true, eventsCreated };
  } catch (error: any) {
    console.error('❌ Transaction calendar sync error:', error.message);
    return { success: false, eventsCreated: 0, error: error.message };
  }
}

/**
 * Delete all calendar events for a transaction
 */
export async function deleteTransactionCalendarEvents(
  supabase: any,
  userId: string,
  transactionId: string
): Promise<{ success: boolean; eventsDeleted: number }> {
  try {
    // Get all calendar events for this transaction
    let events: any[] = [];
    
    // Try to fetch by transaction_id first
    const { data: txEvents, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_id', transactionId);
    
    if (fetchError) {
      // If transaction_id column doesn't exist, try to find events by description
      if (fetchError.message?.includes('transaction_id')) {
        console.log('ℹ️ transaction_id column not found, searching by description...');
        const { data: descEvents } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', userId)
          .ilike('description', `%Transaction ID: ${transactionId}%`);
        events = descEvents || [];
      } else {
        console.error('Error fetching transaction calendar events:', fetchError);
        return { success: false, eventsDeleted: 0 };
      }
    } else {
      events = txEvents || [];
    }
    
    if (events.length === 0) {
      return { success: true, eventsDeleted: 0 };
    }
    
    let eventsDeleted = 0;
    
    // Get Google Calendar connection for deletion
    const { data: connections } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();
    
    let googleAccessToken = connections?.access_token;
    
    // Refresh token if needed
    if (connections && connections.token_expiry) {
      const expiryDate = new Date(connections.token_expiry);
      const now = new Date();
      
      if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        const refreshResult = await refreshGoogleToken(connections.refresh_token || '');
        if (refreshResult.success) {
          googleAccessToken = refreshResult.access_token;
        }
      }
    }
    
    // Delete each event
    for (const event of events) {
      // Delete from Google Calendar if synced
      if (event.google_event_id && googleAccessToken) {
        try {
          await deleteGoogleCalendarEvent(googleAccessToken, event.google_event_id);
          console.log(`✅ Deleted from Google Calendar: ${event.title}`);
        } catch (googleError) {
          console.error('Error deleting from Google Calendar:', googleError);
        }
      }
      
      // Delete from web app calendar
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id);
      
      if (!deleteError) {
        eventsDeleted++;
      }
    }
    
    return { success: true, eventsDeleted };
  } catch (error) {
    console.error('Delete transaction calendar events error:', error);
    return { success: false, eventsDeleted: 0 };
  }
}

/**
 * Update calendar events when transaction dates change
 */
export async function updateTransactionCalendarEvents(
  supabase: any,
  userId: string,
  transaction: Transaction
): Promise<{ success: boolean; eventsUpdated: number }> {
  // Delete existing events and recreate them
  await deleteTransactionCalendarEvents(supabase, userId, transaction.id);
  
  // Create new events
  const result = await syncTransactionToCalendar(supabase, userId, transaction);
  
  return {
    success: result.success,
    eventsUpdated: result.eventsCreated,
  };
}
