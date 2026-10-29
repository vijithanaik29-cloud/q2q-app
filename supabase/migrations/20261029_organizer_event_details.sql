ALTER TABLE organizer_applications
  ADD COLUMN IF NOT EXISTS facebook        text,
  ADD COLUMN IF NOT EXISTS food_drinks     text,
  ADD COLUMN IF NOT EXISTS seating_type   text,
  ADD COLUMN IF NOT EXISTS age_restriction text,
  ADD COLUMN IF NOT EXISTS dress_code     text,
  ADD COLUMN IF NOT EXISTS accessibility  text;
