-- Migration: Add Momentum, Dependencies, and Confidence Score fields
-- Date: 2024-12-23
-- Purpose: Support trend lines, dependency mapping, and confidence weighting

-- =============================================================================
-- 1. CONFIDENCE SCORES - Add to products table
-- =============================================================================

-- Revenue confidence (0-100) - How confident are we in the revenue estimate?
ALTER TABLE products ADD COLUMN IF NOT EXISTS revenue_confidence INTEGER DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS revenue_confidence_justification TEXT;

-- Timeline confidence (0-100) - How confident are we in the go-live date?
ALTER TABLE products ADD COLUMN IF NOT EXISTS timeline_confidence INTEGER DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS timeline_confidence_justification TEXT;

-- Add constraint for confidence scores
ALTER TABLE products ADD CONSTRAINT check_revenue_confidence 
  CHECK (revenue_confidence >= 0 AND revenue_confidence <= 100);
ALTER TABLE products ADD CONSTRAINT check_timeline_confidence 
  CHECK (timeline_confidence >= 0 AND timeline_confidence <= 100);

-- =============================================================================
-- 2. DEPENDENCIES TABLE - Track internal and external blockers
-- =============================================================================

CREATE TYPE dependency_type AS ENUM ('internal', 'external');
CREATE TYPE dependency_status AS ENUM ('blocked', 'pending', 'resolved');
CREATE TYPE dependency_category AS ENUM (
  -- Internal categories
  'legal', 'cyber', 'compliance', 'privacy', 'engineering', 'ops',
  -- External categories  
  'partner_rail', 'vendor', 'api', 'integration', 'regulatory'
);

CREATE TABLE IF NOT EXISTS product_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type dependency_type NOT NULL,
  category dependency_category NOT NULL,
  status dependency_status NOT NULL DEFAULT 'pending',
  blocked_since TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_product_dependencies_product_id ON product_dependencies(product_id);
CREATE INDEX idx_product_dependencies_status ON product_dependencies(status);
CREATE INDEX idx_product_dependencies_type ON product_dependencies(type);

-- =============================================================================
-- 3. MOMENTUM/TREND DATA - Historical readiness scores for sparklines
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_readiness_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  readiness_score INTEGER NOT NULL,
  risk_band VARCHAR(20),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  week_number INTEGER,
  year INTEGER
);

-- Index for time-series queries
CREATE INDEX idx_readiness_history_product_date ON product_readiness_history(product_id, recorded_at DESC);

-- =============================================================================
-- 4. ADD TTM (Time-to-Market) VELOCITY TRACKING
-- =============================================================================

-- Add TTM fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS ttm_target_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ttm_actual_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ttm_delta_vs_last_week INTEGER DEFAULT 0;

-- =============================================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Auto-update blocked_since when status changes to 'blocked'
CREATE OR REPLACE FUNCTION update_dependency_blocked_since()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'blocked' AND (OLD.status IS NULL OR OLD.status != 'blocked') THEN
    NEW.blocked_since = NOW();
  ELSIF NEW.status = 'resolved' AND OLD.status = 'blocked' THEN
    NEW.resolved_at = NOW();
    NEW.blocked_since = NULL;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dependency_status_change
  BEFORE UPDATE ON product_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_dependency_blocked_since();

-- Auto-record readiness history weekly (can be called via cron or manually)
CREATE OR REPLACE FUNCTION record_readiness_snapshot()
RETURNS void AS $$
BEGIN
  INSERT INTO product_readiness_history (product_id, readiness_score, risk_band, week_number, year)
  SELECT 
    pr.product_id,
    pr.readiness_score,
    pr.risk_band::VARCHAR,
    EXTRACT(WEEK FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER
  FROM product_readiness pr
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE product_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_readiness_history ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "Allow read access for all authenticated users" 
  ON product_dependencies FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow read access for all authenticated users" 
  ON product_readiness_history FOR SELECT 
  TO authenticated 
  USING (true);

-- Write access for admins only
CREATE POLICY "Allow write access for admins" 
  ON product_dependencies FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('vp_product', 'studio_ambassador')
    )
  );

CREATE POLICY "Allow write access for admins" 
  ON product_readiness_history FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('vp_product', 'studio_ambassador')
    )
  );

-- =============================================================================
-- 7. SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample dependencies for existing products (run after products exist)
DO $$
DECLARE
  product_rec RECORD;
BEGIN
  FOR product_rec IN SELECT id FROM products LIMIT 5 LOOP
    -- Add some internal dependencies
    INSERT INTO product_dependencies (product_id, name, type, category, status, notes)
    VALUES 
      (product_rec.id, 'Privacy Review', 'internal', 'privacy', 'pending', 'Awaiting PII classification'),
      (product_rec.id, 'Legal Approval', 'internal', 'legal', 'resolved', 'Approved Q4 2024');
    
    -- Add external dependency for some products
    IF random() > 0.5 THEN
      INSERT INTO product_dependencies (product_id, name, type, category, status, blocked_since, notes)
      VALUES 
        (product_rec.id, 'Stripe API v3', 'external', 'partner_rail', 'blocked', NOW() - INTERVAL '2 weeks', 'Waiting on partner API update');
    END IF;
  END LOOP;
END $$;
