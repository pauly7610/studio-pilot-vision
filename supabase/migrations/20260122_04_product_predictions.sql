-- ============================================
-- Product Predictions for New Regional Products
-- Adds success/revenue probability data for inaction forecasting
-- ============================================
-- Run this AFTER 20260122_03_latam_products.sql

-- ============================================
-- PRODUCT PREDICTIONS
-- ============================================
-- Schema: (product_id, success_probability, revenue_probability, failure_risk, model_version, features)
-- 
-- success_probability: 0.0-1.0 (likelihood of meeting success metric)
-- revenue_probability: 0.0-1.0 (likelihood of meeting revenue target)
-- failure_risk: 0.0-1.0 (risk of product failure/discontinuation)

INSERT INTO public.product_predictions (product_id, success_probability, revenue_probability, failure_risk, model_version, features) VALUES

-- ============================================
-- EUROPE (EMEA) Products
-- ============================================
-- Decision Intelligence Pro EU - Scaling, AI Act compliance risk
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 0.72, 0.68, 0.28, 'v2.1', 
 '{"lifecycle": "scaling", "regulatory_risk": "high", "market_demand": "strong", "competition": "moderate"}'),

-- Brighterion EMEA - Mature, stable performer
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 0.92, 0.95, 0.08, 'v2.1', 
 '{"lifecycle": "mature", "regulatory_risk": "low", "market_demand": "strong", "competition": "moderate"}'),

-- Agent Pay - Concept, high uncertainty
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 0.25, 0.20, 0.65, 'v2.1', 
 '{"lifecycle": "concept", "regulatory_risk": "very_high", "market_demand": "uncertain", "competition": "low"}'),

-- EU AI Compliance Monitor - Concept, niche market
('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 0.35, 0.30, 0.55, 'v2.1', 
 '{"lifecycle": "concept", "regulatory_risk": "medium", "market_demand": "emerging", "competition": "low"}'),

-- ============================================
-- ASIA/PACIFIC Products
-- ============================================
-- Payment Passkey APAC - Pilot, biometric adoption varies
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 0.58, 0.52, 0.35, 'v2.1', 
 '{"lifecycle": "pilot", "regulatory_risk": "medium", "market_demand": "strong", "competition": "moderate"}'),

-- Brighterion India - Scaling, strong traction
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 0.78, 0.75, 0.18, 'v2.1', 
 '{"lifecycle": "scaling", "regulatory_risk": "medium", "market_demand": "very_strong", "competition": "high"}'),

-- Smart Routing Engine - Pilot, technical complexity
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 0.48, 0.45, 0.40, 'v2.1', 
 '{"lifecycle": "pilot", "regulatory_risk": "low", "market_demand": "moderate", "competition": "high"}'),

-- APAC Tokenization Hub - Mature, flagship product
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 0.94, 0.92, 0.06, 'v2.1', 
 '{"lifecycle": "mature", "regulatory_risk": "low", "market_demand": "very_strong", "competition": "moderate"}'),

-- ============================================
-- MIDDLE EAST & AFRICA Products
-- ============================================
-- MTN MoMo Cards - Scaling, infrastructure challenges
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 0.62, 0.58, 0.35, 'v2.1', 
 '{"lifecycle": "scaling", "regulatory_risk": "medium", "market_demand": "very_strong", "competition": "low"}'),

-- Orange Money Connect - Pilot, regional expansion
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 0.45, 0.42, 0.45, 'v2.1', 
 '{"lifecycle": "pilot", "regulatory_risk": "high", "market_demand": "strong", "competition": "low"}'),

-- Community Pass - Concept, social impact focus
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 0.28, 0.22, 0.60, 'v2.1', 
 '{"lifecycle": "concept", "regulatory_risk": "medium", "market_demand": "moderate", "competition": "low"}'),

-- Merchant Risk AI Africa - Concept, market-specific
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 0.30, 0.25, 0.58, 'v2.1', 
 '{"lifecycle": "concept", "regulatory_risk": "medium", "market_demand": "strong", "competition": "low"}'),

-- AfriGo Integration - Pilot, regulatory complexity
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 0.38, 0.35, 0.52, 'v2.1', 
 '{"lifecycle": "pilot", "regulatory_risk": "very_high", "market_demand": "strong", "competition": "moderate"}'),

-- ============================================
-- LATIN AMERICA & CARIBBEAN Products
-- ============================================
-- PIX Gateway Integration - Scaling, strong momentum
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 0.85, 0.82, 0.12, 'v2.1', 
 '{"lifecycle": "scaling", "regulatory_risk": "low", "market_demand": "very_strong", "competition": "high"}'),

-- Mercado Pago Connect - Mature, strategic partnership
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 0.92, 0.88, 0.08, 'v2.1', 
 '{"lifecycle": "mature", "regulatory_risk": "medium", "market_demand": "very_strong", "competition": "moderate"}'),

-- Nubank Card Issuance - Mature, flagship partner
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 0.96, 0.94, 0.04, 'v2.1', 
 '{"lifecycle": "mature", "regulatory_risk": "low", "market_demand": "very_strong", "competition": "moderate"}'),

-- SPEI Mexico - Pilot, regulatory alignment needed
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 0.52, 0.48, 0.42, 'v2.1', 
 '{"lifecycle": "pilot", "regulatory_risk": "high", "market_demand": "strong", "competition": "moderate"}'),

-- Rappi Super App - Scaling, super app integration
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 0.72, 0.68, 0.25, 'v2.1', 
 '{"lifecycle": "scaling", "regulatory_risk": "low", "market_demand": "strong", "competition": "high"}'),

-- Caribbean Tourism Hub - Concept, multi-market complexity
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 0.22, 0.18, 0.68, 'v2.1', 
 '{"lifecycle": "concept", "regulatory_risk": "very_high", "market_demand": "moderate", "competition": "low"}');


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check predictions coverage
-- SELECT 
--   p.name, 
--   p.region,
--   pp.success_probability,
--   pp.revenue_probability,
--   pp.failure_risk
-- FROM public.products p
-- LEFT JOIN public.product_predictions pp ON p.id = pp.product_id
-- WHERE pp.product_id IS NULL
-- ORDER BY p.region, p.name;

-- Check high-risk products (for inaction forecast)
-- SELECT 
--   p.name,
--   p.region,
--   p.revenue_target,
--   pp.success_probability,
--   pr.risk_band,
--   ROUND(p.revenue_target * (pp.success_probability - GREATEST(0, pp.success_probability - 0.15)) / 1000000, 2) as potential_loss_3wk
-- FROM public.products p
-- JOIN public.product_predictions pp ON p.id = pp.product_id
-- JOIN public.product_readiness pr ON p.id = pr.product_id
-- WHERE pr.risk_band = 'high'
-- ORDER BY potential_loss_3wk DESC;
