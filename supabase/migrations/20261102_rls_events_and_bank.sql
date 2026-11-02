-- ─── Events table RLS (H3) ───────────────────────────────────────────────────
-- Events are created by authenticated organisers and read by everyone.
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can read events
CREATE POLICY "events_public_select"
  ON events FOR SELECT
  USING (true);

-- Authenticated organisers can insert their own events
CREATE POLICY "events_organiser_insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (organizer_id = auth.uid());

-- Organisers can only update/delete their own events
CREATE POLICY "events_organiser_update"
  ON events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "events_organiser_delete"
  ON events FOR DELETE
  TO authenticated
  USING (organizer_id = auth.uid());


-- ─── organizer_bank_details RLS (H1) ─────────────────────────────────────────
-- Bank account details must be private to each organiser — no cross-reads.
CREATE TABLE IF NOT EXISTS organizer_bank_details (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name  text,
  account_no text,
  ifsc       text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizer_bank_details ENABLE ROW LEVEL SECURITY;

-- Organisers can only read their own bank details
CREATE POLICY "bank_details_owner_select"
  ON organizer_bank_details FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Organisers can insert only their own row
CREATE POLICY "bank_details_owner_insert"
  ON organizer_bank_details FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Organisers can update only their own row
CREATE POLICY "bank_details_owner_update"
  ON organizer_bank_details FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
