CREATE TABLE IF NOT EXISTS participants (
 id uuid PRIMARY KEY, session_hash text UNIQUE NOT NULL, name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS verifications (
 id uuid PRIMARY KEY, participant_id uuid NOT NULL REFERENCES participants(id),
 action text NOT NULL CHECK(action IN ('cup','bottle','transit')),
 points integer NOT NULL, verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(participant_id,action)
);
CREATE TABLE IF NOT EXISTS rewards (
 participant_id uuid PRIMARY KEY REFERENCES participants(id),
 destination text UNIQUE NOT NULL, transaction_xdr text NOT NULL,
 transaction_hash text UNIQUE NOT NULL, confirmed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS footprints (
 participant_id uuid PRIMARY KEY REFERENCES participants(id),
 kg double precision NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
-- These tables are accessible only through the server's database connection.
REVOKE ALL ON participants, verifications, rewards, footprints FROM PUBLIC;
-- Supabase may grant named API roles default table access; remove those grants too.
DO $$
DECLARE api_role text;
BEGIN
 FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
   EXECUTE format('REVOKE ALL ON participants, verifications, rewards, footprints FROM %I', api_role);
  END IF;
 END LOOP;
END $$;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE footprints ENABLE ROW LEVEL SECURITY;
-- Connect using the table-owner role (or a trusted backend role with BYPASSRLS).
-- No public RLS policies: all access goes through authenticated server routes.

-- Email accounts: compatible with existing anonymous participants.
ALTER TABLE participants ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS password_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS participants_email_unique ON participants(lower(email)) WHERE email IS NOT NULL;
CREATE TABLE IF NOT EXISTS participant_sessions (
 token_hash text PRIMARY KEY,
 participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days'
);
CREATE INDEX IF NOT EXISTS participant_sessions_owner ON participant_sessions(participant_id);
CREATE TABLE IF NOT EXISTS wallet_jobs (
 participant_id uuid PRIMARY KEY REFERENCES participants(id),
 public_key text UNIQUE, encrypted_secret text,
 transaction_xdr text, transaction_hash text UNIQUE,
 confirmed_at timestamptz, last_error text,
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_attempts (
 bucket text PRIMARY KEY, count integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL
);
REVOKE ALL ON participant_sessions,wallet_jobs,auth_attempts FROM PUBLIC;
ALTER TABLE participant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE api_role text;
BEGIN
 FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=api_role) THEN
   EXECUTE format('REVOKE ALL ON participant_sessions,wallet_jobs,auth_attempts FROM %I',api_role);
  END IF;
 END LOOP;
END $$;

-- Save the participant's latest origin-to-destination journey, not event attendance.
-- Nullable columns preserve legacy estimates that had no route information.
ALTER TABLE footprints ADD COLUMN IF NOT EXISTS origin text;
ALTER TABLE footprints ADD COLUMN IF NOT EXISTS destination text;
ALTER TABLE footprints ADD COLUMN IF NOT EXISTS one_way_km double precision;
ALTER TABLE footprints ADD COLUMN IF NOT EXISTS round_trip boolean;
ALTER TABLE footprints ADD COLUMN IF NOT EXISTS mode text;
ALTER TABLE footprints ADD COLUMN IF NOT EXISTS cups integer;
ALTER TABLE footprints ADD COLUMN IF NOT EXISTS bottles integer;
-- Routes can be saved without distance. Unknown total emissions are NULL, not zero.
ALTER TABLE footprints ALTER COLUMN kg DROP NOT NULL;
