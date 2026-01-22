-- ============================================
-- STEP 1: Add new enum values
-- ============================================
-- Run this FIRST, then run the data migration
-- PostgreSQL requires enum additions to be committed
-- before they can be used in INSERT statements
-- ============================================

-- Add new product type for AI/Agent products
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'ai_agents';

-- Add new dependency categories for AI/agent blockers
ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'model_validation';
ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'data_quality';
ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'security_review';
ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'infrastructure';
ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'ai_governance';
