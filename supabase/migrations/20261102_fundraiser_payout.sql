-- Add payout tracking fields to fundraisers table
ALTER TABLE fundraisers
  ADD COLUMN IF NOT EXISTS payout_upi     text,
  ADD COLUMN IF NOT EXISTS payout_note    text,
  ADD COLUMN IF NOT EXISTS payout_sent    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_sent_at timestamptz;
