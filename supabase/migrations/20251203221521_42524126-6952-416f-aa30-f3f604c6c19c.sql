-- Add stakeholder columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS engineering_lead text,
ADD COLUMN IF NOT EXISTS business_sponsor text;

-- Update existing products with mock stakeholder data for demo
UPDATE public.products SET 
  engineering_lead = CASE 
    WHEN name LIKE '%Payment%' THEN 'Sarah Chen'
    WHEN name LIKE '%Card%' THEN 'Michael Torres'
    WHEN name LIKE '%Data%' THEN 'Emily Rodriguez'
    WHEN name LIKE '%Partner%' THEN 'David Kim'
    ELSE 'Alex Johnson'
  END,
  business_sponsor = CASE 
    WHEN lifecycle_stage = 'commercial' THEN 'VP Marcus Williams'
    WHEN lifecycle_stage = 'pilot' THEN 'Dir. Jennifer Adams'
    WHEN lifecycle_stage = 'early_pilot' THEN 'Dir. Robert Martinez'
    ELSE 'PM Lead Lisa Thompson'
  END
WHERE engineering_lead IS NULL;