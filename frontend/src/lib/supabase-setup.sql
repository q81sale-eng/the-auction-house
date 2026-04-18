-- =============================================================================
-- The Auction House — Supabase Schema Setup
-- Run this entire file in your Supabase project → SQL Editor → New Query
-- =============================================================================

-- ── Profiles (mirrors auth.users) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name            TEXT,
  email           TEXT UNIQUE,
  phone           TEXT,
  country         TEXT,
  is_admin        BOOLEAN DEFAULT FALSE,
  deposit_balance DECIMAL(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Auctions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auctions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  brand           TEXT NOT NULL DEFAULT '',
  reference       TEXT,
  description     TEXT,
  condition       TEXT DEFAULT 'excellent'
                  CHECK (condition IN ('new','excellent','good','fair')),
  status          TEXT DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming','live','ended','sold','cancelled')),
  starting_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_bid     DECIMAL(10,2),
  buy_now_price   DECIMAL(10,2),
  image_url       TEXT,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  bids_count      INT DEFAULT 0,
  slug            TEXT UNIQUE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auctions_public_select" ON auctions
  FOR SELECT USING (true);

CREATE POLICY "auctions_admin_all" ON auctions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Bids ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id  UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bids_auth_select" ON bids
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bids_insert_own" ON bids
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bids_admin_all" ON bids
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Trigger: auto-create profile on registration ──────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, country)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Storage bucket for auction images ─────────────────────────────────────────
-- Run this separately if you want image uploads:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('auction-images', 'auction-images', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "auction_images_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'auction-images');
--
-- CREATE POLICY "auction_images_admin_write" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'auction-images' AND
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
--   );

-- ── Make yourself admin ───────────────────────────────────────────────────────
-- After registering your account, run this to grant admin access:
--
-- UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
