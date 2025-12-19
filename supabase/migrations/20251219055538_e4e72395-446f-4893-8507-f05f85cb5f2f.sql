-- Add governance_tier column to products table for 3-Tier Model
ALTER TABLE public.products 
ADD COLUMN governance_tier TEXT DEFAULT 'tier_1';

-- Add budget_code column for Data Health Score calculation
ALTER TABLE public.products 
ADD COLUMN budget_code TEXT;

-- Add pii_flag column for Data Health Score calculation
ALTER TABLE public.products 
ADD COLUMN pii_flag BOOLEAN DEFAULT false;

-- Add rail_type column to product_partners for Multi-Rail Integration Tracking
ALTER TABLE public.product_partners 
ADD COLUMN rail_type TEXT DEFAULT 'card';

-- Update existing products with sample governance tiers
UPDATE public.products SET governance_tier = 'tier_3' WHERE lifecycle_stage = 'commercial';
UPDATE public.products SET governance_tier = 'tier_2' WHERE lifecycle_stage IN ('pilot', 'early_pilot');
UPDATE public.products SET governance_tier = 'tier_1' WHERE lifecycle_stage = 'concept';

-- Update some products with budget codes for demo
UPDATE public.products SET budget_code = 'MC-2024-001', pii_flag = true WHERE name LIKE '%Tap%';
UPDATE public.products SET budget_code = 'MC-2024-002', pii_flag = false WHERE name LIKE '%Crypto%';
UPDATE public.products SET budget_code = 'MC-2024-003', pii_flag = true WHERE name LIKE '%Biometric%';

-- Update product_partners with rail types
UPDATE public.product_partners SET rail_type = 'card' WHERE partner_name LIKE '%Visa%' OR partner_name LIKE '%Stripe%';
UPDATE public.product_partners SET rail_type = 'a2a' WHERE partner_name LIKE '%Plaid%';
UPDATE public.product_partners SET rail_type = 'real_time' WHERE partner_name LIKE '%FedNow%' OR partner_name LIKE '%RTP%';
UPDATE public.product_partners SET rail_type = 'crypto' WHERE partner_name LIKE '%Coinbase%' OR partner_name LIKE '%Circle%';