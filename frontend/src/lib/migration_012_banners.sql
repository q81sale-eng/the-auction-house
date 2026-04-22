-- =============================================================================
-- Migration 012 — banners table (PromoSlider managed from admin)
-- =============================================================================

CREATE TABLE IF NOT EXISTS banners (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  eyebrow     TEXT,
  title       TEXT          NOT NULL,
  subtitle    TEXT,
  cta_text    TEXT,
  cta_url     TEXT          NOT NULL DEFAULT '/',
  image_url   TEXT,
  bg_color    TEXT          DEFAULT 'linear-gradient(135deg,#0d0d0d 0%,#1c1508 50%,#0d0d0d 100%)',
  sort_order  INT           NOT NULL DEFAULT 0,
  active      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_select"  ON banners;
DROP POLICY IF EXISTS "banners_auth_all"       ON banners;

-- Anyone can read active banners
CREATE POLICY "banners_public_select" ON banners
  FOR SELECT USING (true);

-- Authenticated users (admins) can manage banners
CREATE POLICY "banners_auth_all" ON banners
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_banners_sort ON banners(active, sort_order);

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'banners' ORDER BY ordinal_position;
