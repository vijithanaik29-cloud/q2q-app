CREATE TABLE IF NOT EXISTS admin_config (
  key        text        PRIMARY KEY,
  value      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service role (edge functions) can access this table
