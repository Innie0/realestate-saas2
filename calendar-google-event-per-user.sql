-- Let the same Google Calendar be connected to more than one Oikaro account.
-- Google event IDs were unique across ALL users, so connecting a calendar that
-- another Oikaro account had already synced failed to save its events.
-- Now they're unique per user instead.

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_google_event_id_key;
DROP INDEX IF EXISTS calendar_events_google_event_id_key;
DROP INDEX IF EXISTS calendar_events_google_event_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_user_google_event_unique
ON calendar_events (user_id, google_event_id)
WHERE google_event_id IS NOT NULL;

-- Same for Outlook
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_outlook_event_id_key;
DROP INDEX IF EXISTS calendar_events_outlook_event_id_key;
DROP INDEX IF EXISTS calendar_events_outlook_event_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_user_outlook_event_unique
ON calendar_events (user_id, outlook_event_id)
WHERE outlook_event_id IS NOT NULL;
