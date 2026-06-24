CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ume_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Session',
  current_module text NOT NULL DEFAULT 'basic',
  draft_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calculation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES ume_sessions(id) ON DELETE SET NULL,
  module text NOT NULL,
  expression text NOT NULL,
  result text NOT NULL,
  precision_note text,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  module text NOT NULL,
  formula text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'dark-neon',
  accuracy_target numeric NOT NULL DEFAULT 99.0,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_rate_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code text NOT NULL,
  currency_code text NOT NULL,
  source_name text NOT NULL,
  amount_vnd numeric NOT NULL CHECK (amount_vnd > 0),
  currency_amount numeric NOT NULL CHECK (currency_amount >= 0),
  bonus_amount numeric NOT NULL DEFAULT 0 CHECK (bonus_amount >= 0),
  is_active boolean NOT NULL DEFAULT true,
  note text,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculation_history_user_created
  ON calculation_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ume_sessions_user_updated
  ON ume_sessions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_rate_tables_lookup
  ON game_rate_tables(game_code, currency_code, is_active);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS ume_sessions_set_updated_at ON ume_sessions;
CREATE TRIGGER ume_sessions_set_updated_at
BEFORE UPDATE ON ume_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS saved_formulas_set_updated_at ON saved_formulas;
CREATE TRIGGER saved_formulas_set_updated_at
BEFORE UPDATE ON saved_formulas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS game_rate_tables_set_updated_at ON game_rate_tables;
CREATE TRIGGER game_rate_tables_set_updated_at
BEFORE UPDATE ON game_rate_tables
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  background_url text NOT NULL DEFAULT '/wolf-bg.jpg',
  music_url text NOT NULL DEFAULT '',
  music_title text NOT NULL DEFAULT '',
  music_enabled boolean NOT NULL DEFAULT false,
  volume numeric NOT NULL DEFAULT 0.45 CHECK (volume >= 0 AND volume <= 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings(id)
VALUES('global')
ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS music_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text NOT NULL DEFAULT 'Người dùng',
  song_title text NOT NULL,
  music_url text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_music_change_requests_status_created
  ON music_change_requests(status, created_at DESC);

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON site_settings;
CREATE TRIGGER site_settings_set_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
