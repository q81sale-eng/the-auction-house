-- ════════════════════════════════════════════════════════════════════════════
-- Watch Reference Catalog — seed data
-- ────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase SQL editor to populate the watch_reference_catalog
-- table that powers the cascading Brand → Model → Reference dropdowns
-- inside Admin → Price Index ("مؤشر الساعات") "Add Entry" form.
--
-- Safe to re-run: clears existing rows first.
-- ════════════════════════════════════════════════════════════════════════════

-- Make sure the table exists. If it doesn't, create it.
CREATE TABLE IF NOT EXISTS watch_reference_catalog (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  brand_slug TEXT NOT NULL,
  model TEXT NOT NULL,
  model_slug TEXT NOT NULL,
  reference TEXT NOT NULL,
  material TEXT,
  case_size TEXT,
  bracelet TEXT,
  dial_color TEXT,
  year_from INTEGER,
  year_to INTEGER,
  movement TEXT,
  water_resistance TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE watch_reference_catalog DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wrc_brand ON watch_reference_catalog(brand_slug);
CREATE INDEX IF NOT EXISTS idx_wrc_model ON watch_reference_catalog(brand_slug, model_slug);

-- Wipe and re-seed
TRUNCATE TABLE watch_reference_catalog RESTART IDENTITY;

-- ────────────────────────────────────────────────────────────────────────────
-- ROLEX
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO watch_reference_catalog (brand, brand_slug, model, model_slug, reference, material, case_size) VALUES
-- Submariner
('Rolex','rolex','Submariner','submariner','124060','Stainless Steel','41'),
('Rolex','rolex','Submariner','submariner','126610LN','Stainless Steel','41'),
('Rolex','rolex','Submariner','submariner','126610LV','Stainless Steel','41'),
('Rolex','rolex','Submariner','submariner','126613LN','Steel & Yellow Gold','41'),
('Rolex','rolex','Submariner','submariner','126613LB','Steel & Yellow Gold','41'),
('Rolex','rolex','Submariner','submariner','126618LN','Yellow Gold','41'),
('Rolex','rolex','Submariner','submariner','126618LB','Yellow Gold','41'),
('Rolex','rolex','Submariner','submariner','126619LB','White Gold','41'),
('Rolex','rolex','Submariner','submariner','116610LN','Stainless Steel','40'),
('Rolex','rolex','Submariner','submariner','116610LV','Stainless Steel','40'),
('Rolex','rolex','Submariner','submariner','114060','Stainless Steel','40'),
-- Daytona
('Rolex','rolex','Daytona','daytona','116500LN','Stainless Steel','40'),
('Rolex','rolex','Daytona','daytona','126500LN','Stainless Steel','40'),
('Rolex','rolex','Daytona','daytona','116508','Yellow Gold','40'),
('Rolex','rolex','Daytona','daytona','116518LN','Yellow Gold','40'),
('Rolex','rolex','Daytona','daytona','126508','Yellow Gold','40'),
('Rolex','rolex','Daytona','daytona','116515LN','Everose Gold','40'),
('Rolex','rolex','Daytona','daytona','126515LN','Everose Gold','40'),
('Rolex','rolex','Daytona','daytona','116519LN','White Gold','40'),
('Rolex','rolex','Daytona','daytona','126519LN','White Gold','40'),
('Rolex','rolex','Daytona','daytona','116523','Steel & Yellow Gold','40'),
-- GMT-Master II
('Rolex','rolex','GMT-Master II','gmt-master-ii','126710BLNR','Stainless Steel','40'),
('Rolex','rolex','GMT-Master II','gmt-master-ii','126710BLRO','Stainless Steel','40'),
('Rolex','rolex','GMT-Master II','gmt-master-ii','126711CHNR','Steel & Everose Gold','40'),
('Rolex','rolex','GMT-Master II','gmt-master-ii','126713GRNR','Steel & Yellow Gold','40'),
('Rolex','rolex','GMT-Master II','gmt-master-ii','126715CHNR','Everose Gold','40'),
('Rolex','rolex','GMT-Master II','gmt-master-ii','126719BLRO','White Gold','40'),
('Rolex','rolex','GMT-Master II','gmt-master-ii','116710BLNR','Stainless Steel','40'),
('Rolex','rolex','GMT-Master II','gmt-master-ii','116710LN','Stainless Steel','40'),
-- Datejust
('Rolex','rolex','Datejust','datejust','126200','Stainless Steel','36'),
('Rolex','rolex','Datejust','datejust','126234','Steel & White Gold','36'),
('Rolex','rolex','Datejust','datejust','126233','Steel & Yellow Gold','36'),
('Rolex','rolex','Datejust','datejust','126231','Steel & Everose Gold','36'),
('Rolex','rolex','Datejust','datejust','126300','Stainless Steel','41'),
('Rolex','rolex','Datejust','datejust','126334','Steel & White Gold','41'),
('Rolex','rolex','Datejust','datejust','126333','Steel & Yellow Gold','41'),
('Rolex','rolex','Datejust','datejust','126331','Steel & Everose Gold','41'),
-- Day-Date
('Rolex','rolex','Day-Date','day-date','228238','Yellow Gold','40'),
('Rolex','rolex','Day-Date','day-date','228235','Everose Gold','40'),
('Rolex','rolex','Day-Date','day-date','228239','White Gold','40'),
('Rolex','rolex','Day-Date','day-date','128238','Yellow Gold','36'),
('Rolex','rolex','Day-Date','day-date','128235','Everose Gold','36'),
('Rolex','rolex','Day-Date','day-date','128239','White Gold','36'),
-- Explorer
('Rolex','rolex','Explorer','explorer','224270','Stainless Steel','40'),
('Rolex','rolex','Explorer','explorer','214270','Stainless Steel','39'),
('Rolex','rolex','Explorer','explorer','124270','Stainless Steel','36'),
('Rolex','rolex','Explorer','explorer','124273','Steel & Yellow Gold','36'),
-- Explorer II
('Rolex','rolex','Explorer II','explorer-ii','226570','Stainless Steel','42'),
('Rolex','rolex','Explorer II','explorer-ii','216570','Stainless Steel','42'),
-- Yacht-Master
('Rolex','rolex','Yacht-Master','yacht-master','126622','Stainless Steel & Platinum','40'),
('Rolex','rolex','Yacht-Master','yacht-master','268622','Stainless Steel & Platinum','37'),
('Rolex','rolex','Yacht-Master','yacht-master','226658','Yellow Gold','42'),
('Rolex','rolex','Yacht-Master','yacht-master','226659','White Gold','42'),
('Rolex','rolex','Yacht-Master','yacht-master','116655','Everose Gold','40'),
-- Sky-Dweller
('Rolex','rolex','Sky-Dweller','sky-dweller','326934','Steel & White Gold','42'),
('Rolex','rolex','Sky-Dweller','sky-dweller','326933','Steel & Yellow Gold','42'),
('Rolex','rolex','Sky-Dweller','sky-dweller','326935','Everose Gold','42'),
('Rolex','rolex','Sky-Dweller','sky-dweller','336934','Steel & White Gold','42'),
('Rolex','rolex','Sky-Dweller','sky-dweller','336935','Everose Gold','42');

-- ────────────────────────────────────────────────────────────────────────────
-- PATEK PHILIPPE
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO watch_reference_catalog (brand, brand_slug, model, model_slug, reference, material, case_size) VALUES
-- Nautilus
('Patek Philippe','patek-philippe','Nautilus','nautilus','5711/1A-010','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','5711/1A-014','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','5712/1A-001','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','5726/1A-014','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','5726A-014','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','5740/1G-001','White Gold','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','5990/1A-011','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','5980/1A-001','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Nautilus','nautilus','7118/1A-010','Stainless Steel','35'),
-- Aquanaut
('Patek Philippe','patek-philippe','Aquanaut','aquanaut','5167A-001','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Aquanaut','aquanaut','5167R-001','Rose Gold','40'),
('Patek Philippe','patek-philippe','Aquanaut','aquanaut','5168G-001','White Gold','42'),
('Patek Philippe','patek-philippe','Aquanaut','aquanaut','5164A-001','Stainless Steel','40'),
('Patek Philippe','patek-philippe','Aquanaut','aquanaut','5267/200A-010','Stainless Steel','35'),
-- Calatrava
('Patek Philippe','patek-philippe','Calatrava','calatrava','6119G','White Gold','39'),
('Patek Philippe','patek-philippe','Calatrava','calatrava','6119R','Rose Gold','39'),
('Patek Philippe','patek-philippe','Calatrava','calatrava','5226G-001','White Gold','40'),
('Patek Philippe','patek-philippe','Calatrava','calatrava','5227G-010','White Gold','39'),
('Patek Philippe','patek-philippe','Calatrava','calatrava','5227R-001','Rose Gold','39'),
('Patek Philippe','patek-philippe','Calatrava','calatrava','5196G-001','White Gold','37'),
-- Grand Complications
('Patek Philippe','patek-philippe','Grand Complications','grand-complications','5270G-019','White Gold','41'),
('Patek Philippe','patek-philippe','Grand Complications','grand-complications','5270P-001','Platinum','41'),
('Patek Philippe','patek-philippe','Grand Complications','grand-complications','5204P-001','Platinum','40'),
('Patek Philippe','patek-philippe','Grand Complications','grand-complications','5236P-001','Platinum','41'),
-- Twenty~4
('Patek Philippe','patek-philippe','Twenty-4','twenty-4','7300/1200A-001','Stainless Steel','36'),
('Patek Philippe','patek-philippe','Twenty-4','twenty-4','4910/1200A-010','Stainless Steel','25'),
-- Perpetual Calendar
('Patek Philippe','patek-philippe','Perpetual Calendar','perpetual-calendar','5327G-001','White Gold','39'),
('Patek Philippe','patek-philippe','Perpetual Calendar','perpetual-calendar','5327J-001','Yellow Gold','39'),
('Patek Philippe','patek-philippe','Perpetual Calendar','perpetual-calendar','5236P-001','Platinum','41');

-- ────────────────────────────────────────────────────────────────────────────
-- AUDEMARS PIGUET
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO watch_reference_catalog (brand, brand_slug, model, model_slug, reference, material, case_size) VALUES
-- Royal Oak
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15500ST','Stainless Steel','41'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15510ST','Stainless Steel','41'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15400ST','Stainless Steel','41'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15710ST','Stainless Steel','42'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','26331ST','Stainless Steel','41'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','26331OR','Pink Gold','41'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15202ST','Stainless Steel','39'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15202IP','Steel & Platinum','39'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15202BC','White Gold','39'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15202OR','Pink Gold','39'),
('Audemars Piguet','audemars-piguet','Royal Oak','royal-oak','15500OR','Pink Gold','41'),
-- Royal Oak Offshore
('Audemars Piguet','audemars-piguet','Royal Oak Offshore','royal-oak-offshore','26420SO','Stainless Steel','43'),
('Audemars Piguet','audemars-piguet','Royal Oak Offshore','royal-oak-offshore','26405CE','Black Ceramic','44'),
('Audemars Piguet','audemars-piguet','Royal Oak Offshore','royal-oak-offshore','26470ST','Stainless Steel','42'),
('Audemars Piguet','audemars-piguet','Royal Oak Offshore','royal-oak-offshore','26420TI','Titanium','43'),
('Audemars Piguet','audemars-piguet','Royal Oak Offshore','royal-oak-offshore','26238CE','Black Ceramic','42'),
('Audemars Piguet','audemars-piguet','Royal Oak Offshore','royal-oak-offshore','26420RO','Pink Gold','43'),
-- Royal Oak Concept
('Audemars Piguet','audemars-piguet','Royal Oak Concept','royal-oak-concept','26630TI','Titanium','44'),
('Audemars Piguet','audemars-piguet','Royal Oak Concept','royal-oak-concept','26621TI','Titanium','44'),
-- Code 11.59
('Audemars Piguet','audemars-piguet','Code 11.59','code-11-59','15210BC','White Gold','41'),
('Audemars Piguet','audemars-piguet','Code 11.59','code-11-59','15210CR','Pink Gold','41'),
('Audemars Piguet','audemars-piguet','Code 11.59','code-11-59','26393BC','White Gold','41'),
('Audemars Piguet','audemars-piguet','Code 11.59','code-11-59','26393CR','Pink Gold','41');

-- ────────────────────────────────────────────────────────────────────────────
-- RICHARD MILLE
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO watch_reference_catalog (brand, brand_slug, model, model_slug, reference, material, case_size) VALUES
-- RM 011
('Richard Mille','richard-mille','RM 011','rm-011','RM 011-03','Carbon TPT','50'),
('Richard Mille','richard-mille','RM 011','rm-011','RM 011-01','Titanium','50'),
('Richard Mille','richard-mille','RM 011','rm-011','RM 011-02','Rose Gold','50'),
-- RM 030
('Richard Mille','richard-mille','RM 030','rm-030','RM 030','Titanium','50'),
('Richard Mille','richard-mille','RM 030','rm-030','RM 030-01','Carbon TPT','50'),
-- RM 35
('Richard Mille','richard-mille','RM 35','rm-35','RM 35-01','NTPT Carbon','50'),
('Richard Mille','richard-mille','RM 35','rm-35','RM 35-02','NTPT Carbon','50'),
('Richard Mille','richard-mille','RM 35','rm-35','RM 35-03','Quartz TPT','50'),
-- RM 67
('Richard Mille','richard-mille','RM 67','rm-67','RM 67-01','Titanium','38'),
('Richard Mille','richard-mille','RM 67','rm-67','RM 67-02','Quartz TPT','38'),
-- RM 27
('Richard Mille','richard-mille','RM 27','rm-27','RM 27-03','Quartz TPT','47'),
('Richard Mille','richard-mille','RM 27','rm-27','RM 27-04','Carbon TPT','47'),
-- RM 055
('Richard Mille','richard-mille','RM 055','rm-055','RM 055','White Ceramic','50'),
-- RM 029
('Richard Mille','richard-mille','RM 029','rm-029','RM 029','Titanium','48'),
-- RM 65-01
('Richard Mille','richard-mille','RM 65-01','rm-65-01','RM 65-01','Carbon TPT','50'),
-- RM 72-01
('Richard Mille','richard-mille','RM 72-01','rm-72-01','RM 72-01','Titanium','50');

-- ────────────────────────────────────────────────────────────────────────────
-- OMEGA
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO watch_reference_catalog (brand, brand_slug, model, model_slug, reference, material, case_size) VALUES
-- Speedmaster
('Omega','omega','Speedmaster','speedmaster','311.30.42.30.01.005','Stainless Steel','42'),
('Omega','omega','Speedmaster','speedmaster','310.30.42.50.01.001','Stainless Steel','42'),
('Omega','omega','Speedmaster','speedmaster','310.30.42.50.01.002','Stainless Steel','42'),
('Omega','omega','Speedmaster','speedmaster','311.30.42.30.01.006','Stainless Steel','42'),
('Omega','omega','Speedmaster','speedmaster','311.93.44.51.99.001','Ceramic','44'),
('Omega','omega','Speedmaster','speedmaster','329.30.44.51.06.001','Stainless Steel','44'),
-- Seamaster
('Omega','omega','Seamaster','seamaster','210.30.42.20.01.001','Stainless Steel','42'),
('Omega','omega','Seamaster','seamaster','210.30.42.20.03.001','Stainless Steel','42'),
('Omega','omega','Seamaster','seamaster','210.30.42.20.04.001','Stainless Steel','42'),
('Omega','omega','Seamaster','seamaster','210.32.42.20.01.001','Stainless Steel','42'),
('Omega','omega','Seamaster','seamaster','215.30.46.51.01.002','Stainless Steel','45.5'),
-- Aqua Terra
('Omega','omega','Aqua Terra','aqua-terra','220.10.41.21.10.001','Stainless Steel','41'),
('Omega','omega','Aqua Terra','aqua-terra','220.10.41.21.03.001','Stainless Steel','41'),
('Omega','omega','Aqua Terra','aqua-terra','220.10.41.21.06.001','Stainless Steel','41'),
('Omega','omega','Aqua Terra','aqua-terra','220.12.41.21.03.002','Stainless Steel','41'),
-- Constellation
('Omega','omega','Constellation','constellation','131.10.39.20.01.001','Stainless Steel','39'),
('Omega','omega','Constellation','constellation','131.13.41.21.06.001','Stainless Steel','41'),
('Omega','omega','Constellation','constellation','131.10.41.21.02.001','Stainless Steel','41'),
-- De Ville
('Omega','omega','De Ville','de-ville','424.10.40.20.02.001','Stainless Steel','39.5'),
('Omega','omega','De Ville','de-ville','432.13.40.21.02.005','Stainless Steel','40');

-- ────────────────────────────────────────────────────────────────────────────
-- CARTIER
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO watch_reference_catalog (brand, brand_slug, model, model_slug, reference, material, case_size) VALUES
-- Santos
('Cartier','cartier','Santos','santos','WSSA0009','Stainless Steel','39.8'),
('Cartier','cartier','Santos','santos','WSSA0030','Stainless Steel','39.8'),
('Cartier','cartier','Santos','santos','WSSA0029','Stainless Steel','39.8'),
('Cartier','cartier','Santos','santos','WSSA0018','Stainless Steel','35.1'),
('Cartier','cartier','Santos','santos','W2SA0006','Steel & Yellow Gold','39.8'),
('Cartier','cartier','Santos','santos','WGSA0029','Yellow Gold','39.8'),
('Cartier','cartier','Santos','santos','WHSA0007','Steel & Rose Gold','39.8'),
-- Tank
('Cartier','cartier','Tank','tank','WGTA0011','White Gold','27.8'),
('Cartier','cartier','Tank','tank','WGTA0029','Yellow Gold','40'),
('Cartier','cartier','Tank','tank','W5310034','Stainless Steel','30'),
('Cartier','cartier','Tank','tank','WSTA0040','Stainless Steel','41'),
('Cartier','cartier','Tank','tank','WSTA0042','Stainless Steel','37'),
-- Ballon Bleu
('Cartier','cartier','Ballon Bleu','ballon-bleu','WSBB0040','Stainless Steel','42'),
('Cartier','cartier','Ballon Bleu','ballon-bleu','W6920095','Stainless Steel','42'),
('Cartier','cartier','Ballon Bleu','ballon-bleu','W6920046','Stainless Steel','36'),
('Cartier','cartier','Ballon Bleu','ballon-bleu','WJBB0042','Steel & Diamonds','36'),
-- Pasha
('Cartier','cartier','Pasha','pasha','WSPA0010','Stainless Steel','41'),
('Cartier','cartier','Pasha','pasha','WSPA0013','Stainless Steel','41'),
('Cartier','cartier','Pasha','pasha','WGPA0007','Yellow Gold','41'),
-- Drive
('Cartier','cartier','Drive','drive','WSNM0009','Stainless Steel','40'),
('Cartier','cartier','Drive','drive','WSNM0011','Stainless Steel','40');

-- ════════════════════════════════════════════════════════════════════════════
-- Done. Verify count:
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  brand,
  COUNT(DISTINCT model) AS models,
  COUNT(*) AS total_references
FROM watch_reference_catalog
GROUP BY brand
ORDER BY brand;
