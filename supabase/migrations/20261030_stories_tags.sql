ALTER TABLE stories ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_story_views(story_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE stories SET views = views + 1 WHERE id = story_id;
$$;
