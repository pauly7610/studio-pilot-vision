-- Update lifecycle_stage enum to match code definition
-- Code enum: concept, pilot, scaling, mature, sunset
-- Old DB enum: concept, early_pilot, pilot, commercial, sunset

-- Step 1: Add new enum values
ALTER TYPE public.lifecycle_stage ADD VALUE IF NOT EXISTS 'mature';
ALTER TYPE public.lifecycle_stage ADD VALUE IF NOT EXISTS 'scaling';

-- Step 2: Update existing data to use new enum values
-- Map 'commercial' -> 'mature'
-- Map 'early_pilot' -> 'pilot'
UPDATE public.products 
SET lifecycle_stage = 'mature' 
WHERE lifecycle_stage = 'commercial';

UPDATE public.products 
SET lifecycle_stage = 'pilot' 
WHERE lifecycle_stage = 'early_pilot';

-- Note: PostgreSQL doesn't allow removing enum values while they're referenced
-- The old values 'commercial' and 'early_pilot' will remain in the enum type
-- but won't be used. This is safe and follows PostgreSQL best practices.
