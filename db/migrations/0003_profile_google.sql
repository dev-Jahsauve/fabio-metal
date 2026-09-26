-- Profil utilisateur (avatar) + liaison Google.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub varchar(120);
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique ON users(google_sub) WHERE google_sub IS NOT NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
