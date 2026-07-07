-- Self-service showing/meeting booking link.
-- Run in Supabase SQL Editor if not already applied.
--
-- Adds availability configuration to agent_settings so agents can share a
-- public link (/book/<agentId>) that lets leads pick an open slot and book
-- a showing without any back-and-forth. Bookings land in calendar_events
-- (synced to Google Calendar like any other event) and create a lead in
-- the CRM, reusing existing infrastructure.

ALTER TABLE agent_settings
  ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS booking_duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS booking_notice_hours INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS booking_window_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS booking_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  ADD COLUMN IF NOT EXISTS booking_start_time TEXT DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS booking_end_time TEXT DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS booking_timezone TEXT DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS booking_location TEXT;

-- booking_days uses 0 = Sunday ... 6 = Saturday (default Mon-Fri).

-- Link calendar events back to the CRM lead they were booked for.
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
