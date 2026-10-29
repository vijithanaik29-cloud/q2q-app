-- Enable RLS on all tables with user data
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_applications ENABLE ROW LEVEL SECURITY;

-- BOOKINGS
-- No anon or authenticated SELECT/UPDATE/DELETE - all reads/writes go through
-- edge functions that use the service role key. This means even someone with
-- the public anon key cannot list or read any booking.
-- (No policies needed: RLS enabled + no policies = nothing accessible via anon.)

-- ORGANIZER APPLICATIONS
-- Anyone can submit an application (public form).
-- Nobody can read applications via the anon key - only edge functions / admin.
CREATE POLICY "public_submit_application"
  ON organizer_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
