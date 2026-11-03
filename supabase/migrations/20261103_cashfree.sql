-- Replace Razorpay order column with Cashfree equivalent
alter table bookings add column if not exists cf_order_id text;
