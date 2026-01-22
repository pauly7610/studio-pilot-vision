-- ============================================
-- Reorganize Products by Region
-- Maps products to their correct Mastercard regions
-- ============================================
-- Run this AFTER 20260122_01_region_enum.sql

-- ============================================
-- REGION MAPPING LOGIC
-- ============================================
-- North America: US, Canada, Mexico products
-- Europe: EU, UK, Western Europe products (formerly EMEA without MEA)
-- Asia/Pacific: APAC, India, Australia, Singapore, Japan, etc.
-- Latin America & Caribbean: Brazil, Argentina, Mexico South, Caribbean
-- Middle East & Africa: Africa, Middle East (formerly just 'Africa')

-- ============================================
-- PART 1: Update EMEA products to Europe
-- ============================================
-- EMEA products are primarily European-focused

UPDATE public.products
SET region = 'Europe'::public.product_region
WHERE id IN (
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',  -- Decision Intelligence Pro EU
    'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',  -- Brighterion EMEA
    'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3',  -- Agent Pay (EU-focused)
    'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4'   -- EU AI Compliance Monitor
);

-- ============================================
-- PART 2: Update APAC products to Asia/Pacific
-- ============================================

UPDATE public.products
SET region = 'Asia/Pacific'::public.product_region
WHERE id IN (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',  -- Payment Passkey APAC
    'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',  -- Brighterion India
    'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3',  -- Smart Routing Engine APAC
    'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'   -- APAC Tokenization Hub
);

-- ============================================
-- PART 3: Update Africa products to Middle East & Africa
-- ============================================

UPDATE public.products
SET region = 'Middle East & Africa'::public.product_region
WHERE id IN (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',  -- MTN MoMo Cards
    'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',  -- Orange Money Connect
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',  -- Community Pass
    'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4',  -- Merchant Risk AI Africa
    'c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5'   -- AfriGo Integration
);

-- ============================================
-- PART 4: Reassign some global products
-- ============================================
-- Cross-Border B2B Payments is global but started in North America
-- Keep as North America (HQ location)

-- ============================================
-- PART 5: Update any text-based region values
-- ============================================
-- This catches any products that might have been inserted with text regions
-- after the enum migration

UPDATE public.products
SET region = 'Europe'::public.product_region
WHERE region_old = 'EMEA' AND region = 'North America'::public.product_region;

UPDATE public.products
SET region = 'Asia/Pacific'::public.product_region
WHERE region_old = 'APAC' AND region = 'North America'::public.product_region;

UPDATE public.products
SET region = 'Middle East & Africa'::public.product_region
WHERE region_old = 'Africa' AND region = 'North America'::public.product_region;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check final distribution
-- SELECT region, COUNT(*) as product_count 
-- FROM public.products 
-- GROUP BY region 
-- ORDER BY region;

-- List products by region
-- SELECT region, name, lifecycle_stage, revenue_target
-- FROM public.products
-- ORDER BY region, name;
