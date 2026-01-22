-- ============================================
-- Region Enum Migration
-- Standardizes regions to official Mastercard 5-region structure
-- ============================================
-- Run this FIRST before the product region update migration

-- ============================================
-- PART 1: Create the region enum type
-- ============================================

-- Check if enum already exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_region') THEN
        CREATE TYPE public.product_region AS ENUM (
            'North America',
            'Europe',
            'Asia/Pacific',
            'Latin America & Caribbean',
            'Middle East & Africa'
        );
    END IF;
END
$$;

-- ============================================
-- PART 2: Add region_new column with enum type
-- ============================================

-- Add new column with enum type (if not exists)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS region_new public.product_region;

-- ============================================
-- PART 3: Migrate existing region data
-- ============================================

-- Map existing text regions to enum values
UPDATE public.products
SET region_new = CASE 
    WHEN region = 'North America' THEN 'North America'::public.product_region
    WHEN region = 'EMEA' THEN 'Europe'::public.product_region
    WHEN region = 'Europe' THEN 'Europe'::public.product_region
    WHEN region = 'APAC' THEN 'Asia/Pacific'::public.product_region
    WHEN region = 'Asia/Pacific' THEN 'Asia/Pacific'::public.product_region
    WHEN region = 'Asia Pacific' THEN 'Asia/Pacific'::public.product_region
    WHEN region = 'Africa' THEN 'Middle East & Africa'::public.product_region
    WHEN region = 'Middle East & Africa' THEN 'Middle East & Africa'::public.product_region
    WHEN region = 'MEA' THEN 'Middle East & Africa'::public.product_region
    WHEN region = 'LATAM' THEN 'Latin America & Caribbean'::public.product_region
    WHEN region = 'Latin America' THEN 'Latin America & Caribbean'::public.product_region
    WHEN region = 'Latin America & Caribbean' THEN 'Latin America & Caribbean'::public.product_region
    ELSE 'North America'::public.product_region  -- Default fallback
END
WHERE region_new IS NULL;

-- ============================================
-- PART 4: Rename columns (swap old and new)
-- ============================================

-- Rename old text column to region_old (backup)
ALTER TABLE public.products 
RENAME COLUMN region TO region_old;

-- Rename new enum column to region
ALTER TABLE public.products 
RENAME COLUMN region_new TO region;

-- ============================================
-- PART 5: Set NOT NULL constraint and default
-- ============================================

-- Set default value for new inserts
ALTER TABLE public.products 
ALTER COLUMN region SET DEFAULT 'North America'::public.product_region;

-- Ensure no nulls before adding NOT NULL constraint
UPDATE public.products 
SET region = 'North America'::public.product_region 
WHERE region IS NULL;

-- Add NOT NULL constraint
ALTER TABLE public.products 
ALTER COLUMN region SET NOT NULL;

-- ============================================
-- PART 6: Create index for region queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_region ON public.products(region);

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Check distribution by region
-- SELECT region, COUNT(*) as product_count 
-- FROM public.products 
-- GROUP BY region 
-- ORDER BY product_count DESC;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- To rollback:
-- ALTER TABLE public.products DROP COLUMN region;
-- ALTER TABLE public.products RENAME COLUMN region_old TO region;
-- DROP TYPE IF EXISTS public.product_region;
