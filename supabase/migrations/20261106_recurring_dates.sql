-- date_options: optional JSON array of {date, time, endTime} for recurring/multi-date events
-- If present and has 2+ entries, the booking flow lets the user pick a date.
ALTER TABLE events ADD COLUMN IF NOT EXISTS date_options jsonb DEFAULT NULL;
