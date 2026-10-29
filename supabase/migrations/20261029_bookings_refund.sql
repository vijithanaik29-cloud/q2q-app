-- Add refund tracking columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payout_released boolean NOT NULL DEFAULT false;

-- Index for fast lookups by event + status
CREATE INDEX IF NOT EXISTS bookings_event_status_idx ON bookings (event_id, status);
