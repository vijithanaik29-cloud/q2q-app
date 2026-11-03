CREATE TABLE IF NOT EXISTS sponsor_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_email text NOT NULL,
  plan            text NOT NULL CHECK (plan IN ('community', 'pride')),
  business_name   text NOT NULL,
  tagline         text NOT NULL,
  link            text NOT NULL,
  city            text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  review_note     text,
  content_hash    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  approved_at     timestamptz,
  active_until    timestamptz
);

ALTER TABLE sponsor_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisers insert own" ON sponsor_submissions FOR INSERT WITH CHECK (auth.email() = organiser_email);
CREATE POLICY "Organisers read own" ON sponsor_submissions FOR SELECT USING (auth.email() = organiser_email OR auth.email() = 'vijithanaik29@gmail.com');
CREATE POLICY "Superadmin update" ON sponsor_submissions FOR UPDATE USING (auth.email() = 'vijithanaik29@gmail.com');
CREATE POLICY "Public read active" ON sponsor_submissions FOR SELECT USING (status = 'active');
