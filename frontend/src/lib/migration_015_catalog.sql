-- =============================================================================
-- Migration 015 — catalog_watches table (reference price catalog)
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalog_watches (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  slug              TEXT          UNIQUE NOT NULL,
  brand             TEXT          NOT NULL,
  model             TEXT          NOT NULL,
  reference_number  TEXT,
  year_introduced   INT,
  movement          TEXT,
  case_material     TEXT,
  case_diameter     DECIMAL(5,1),
  bracelet_material TEXT,
  dial_color        TEXT,
  water_resistance  TEXT,
  power_reserve     TEXT,
  complications     TEXT,
  description       TEXT,
  retail_price      DECIMAL(12,2) NOT NULL,
  image_url         TEXT,
  active            BOOLEAN       NOT NULL DEFAULT true,
  sort_order        INT           NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE catalog_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_public_select" ON catalog_watches;
DROP POLICY IF EXISTS "catalog_auth_all"      ON catalog_watches;

CREATE POLICY "catalog_public_select" ON catalog_watches
  FOR SELECT USING (true);

CREATE POLICY "catalog_auth_all" ON catalog_watches
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_catalog_brand  ON catalog_watches(brand, active, sort_order);
CREATE INDEX IF NOT EXISTS idx_catalog_slug   ON catalog_watches(slug);

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
