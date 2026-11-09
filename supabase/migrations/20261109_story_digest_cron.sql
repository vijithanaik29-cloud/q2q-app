-- ── Daily story digest cron job ──────────────────────────────────────────────
-- Prerequisites (enable once in Supabase dashboard → Extensions):
--   • pg_cron
--   • pg_net
--
-- This schedules a daily email digest at 9 AM IST (3:30 AM UTC).
-- Remove the old job first in case this migration is re-applied.

SELECT cron.unschedule('daily-story-digest') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-story-digest'
);

SELECT cron.schedule(
  'daily-story-digest',
  '30 3 * * *',   -- 09:00 IST daily
  $$
  SELECT net.http_post(
    url     := 'https://qrjtswrvjygokeuabzvv.supabase.co/functions/v1/daily-story-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyanRzd3J2anlnb2tldWFienZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjI0MzIsImV4cCI6MjEwODgzODQzMn0.fkmRbFI8tR4PIveeVOPJglk_uA9Ry4fawi62pZt02UQ'
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
