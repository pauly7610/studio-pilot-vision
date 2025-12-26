-- Fix percentage values: convert from 95.00 (percentage) to 0.95 (decimal)
-- The frontend code expects decimals and multiplies by 100 for display

UPDATE public.product_predictions
SET 
  success_probability = success_probability / 100,
  revenue_probability = revenue_probability / 100,
  failure_risk = failure_risk / 100;
