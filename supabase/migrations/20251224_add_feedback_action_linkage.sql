-- Migration: Add Feedback-to-Action Linkage and Escalation Triggers
-- Date: 2024-12-24
-- Purpose: Close the customer feedback loop with bidirectional linking and auto-escalation

-- =============================================================================
-- 1. ADD LINKED FEEDBACK ID TO PRODUCT_ACTIONS
-- =============================================================================

-- Add optional foreign key to link actions to feedback
ALTER TABLE product_actions ADD COLUMN IF NOT EXISTS linked_feedback_id UUID REFERENCES product_feedback(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_actions_linked_feedback ON product_actions(linked_feedback_id);

-- =============================================================================
-- 2. ADD RESOLUTION TRACKING TO PRODUCT_FEEDBACK
-- =============================================================================

-- Add resolution fields to feedback
ALTER TABLE product_feedback ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE product_feedback ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);
ALTER TABLE product_feedback ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE product_feedback ADD COLUMN IF NOT EXISTS linked_action_id UUID REFERENCES product_actions(id) ON DELETE SET NULL;

-- Index for resolution tracking
CREATE INDEX IF NOT EXISTS idx_product_feedback_resolved ON product_feedback(resolved_at);

-- =============================================================================
-- 3. ESCALATION TRACKING TABLE
-- =============================================================================

CREATE TYPE escalation_level AS ENUM ('team', 'ambassador', 'exec', 'critical');
CREATE TYPE escalation_reason AS ENUM (
  'high_impact_negative_sentiment',
  'volume_threshold_exceeded',
  'unresolved_duration',
  'multiple_sources',
  'compliance_risk',
  'revenue_impact'
);

CREATE TABLE IF NOT EXISTS feedback_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES product_feedback(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  escalation_level escalation_level NOT NULL,
  reason escalation_reason NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  auto_triggered BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escalations_feedback ON feedback_escalations(feedback_id);
CREATE INDEX IF NOT EXISTS idx_escalations_product ON feedback_escalations(product_id);
CREATE INDEX IF NOT EXISTS idx_escalations_level ON feedback_escalations(escalation_level);
CREATE INDEX IF NOT EXISTS idx_escalations_unresolved ON feedback_escalations(resolved_at) WHERE resolved_at IS NULL;

-- =============================================================================
-- 4. AUTO-ESCALATION TRIGGER FOR HIGH-IMPACT NEGATIVE FEEDBACK
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_escalate_negative_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Escalate if sentiment is strongly negative AND impact is HIGH
  IF NEW.sentiment_score IS NOT NULL 
     AND NEW.sentiment_score < -0.5 
     AND NEW.impact_level = 'HIGH' THEN
    
    -- Check if escalation already exists
    IF NOT EXISTS (
      SELECT 1 FROM feedback_escalations 
      WHERE feedback_id = NEW.id 
      AND reason = 'high_impact_negative_sentiment'
      AND resolved_at IS NULL
    ) THEN
      INSERT INTO feedback_escalations (
        feedback_id, 
        product_id, 
        escalation_level, 
        reason,
        auto_triggered
      ) VALUES (
        NEW.id, 
        NEW.product_id, 
        'ambassador',
        'high_impact_negative_sentiment',
        true
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_escalate_feedback
  AFTER INSERT OR UPDATE ON product_feedback
  FOR EACH ROW
  EXECUTE FUNCTION auto_escalate_negative_feedback();

-- =============================================================================
-- 5. VOLUME THRESHOLD ESCALATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION check_volume_escalation()
RETURNS TRIGGER AS $$
DECLARE
  total_volume INTEGER;
  negative_volume INTEGER;
BEGIN
  -- Calculate total negative feedback volume for product in last 30 days
  SELECT 
    COALESCE(SUM(CASE WHEN sentiment_score < -0.3 THEN COALESCE(volume, 1) ELSE 0 END), 0),
    COALESCE(SUM(COALESCE(volume, 1)), 0)
  INTO negative_volume, total_volume
  FROM product_feedback 
  WHERE product_id = NEW.product_id 
  AND created_at > NOW() - INTERVAL '30 days';
  
  -- Escalate if negative volume exceeds threshold (>50 mentions or >30% of total)
  IF negative_volume > 50 OR (total_volume > 0 AND negative_volume::float / total_volume > 0.3) THEN
    IF NOT EXISTS (
      SELECT 1 FROM feedback_escalations 
      WHERE product_id = NEW.product_id 
      AND reason = 'volume_threshold_exceeded'
      AND resolved_at IS NULL
      AND triggered_at > NOW() - INTERVAL '7 days'
    ) THEN
      INSERT INTO feedback_escalations (
        feedback_id, 
        product_id, 
        escalation_level, 
        reason,
        notes,
        auto_triggered
      ) VALUES (
        NEW.id, 
        NEW.product_id, 
        'exec',
        'volume_threshold_exceeded',
        format('Negative volume: %s mentions in 30 days (%s%% of total)', 
               negative_volume, 
               CASE WHEN total_volume > 0 THEN round(negative_volume::numeric / total_volume * 100) ELSE 0 END),
        true
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_volume_escalation
  AFTER INSERT ON product_feedback
  FOR EACH ROW
  EXECUTE FUNCTION check_volume_escalation();

-- =============================================================================
-- 6. AUTO-RESOLVE FEEDBACK WHEN LINKED ACTION IS COMPLETED
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_resolve_feedback_on_action_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- When action is marked completed, resolve linked feedback
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE product_feedback 
    SET 
      resolved_at = NOW(),
      resolution_notes = COALESCE(resolution_notes, '') || 
        format(' [Auto-resolved via action: %s]', NEW.title)
    WHERE linked_action_id = NEW.id 
    AND resolved_at IS NULL;
    
    -- Also resolve escalations for linked feedback
    UPDATE feedback_escalations
    SET resolved_at = NOW()
    WHERE feedback_id IN (
      SELECT id FROM product_feedback WHERE linked_action_id = NEW.id
    )
    AND resolved_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_action_resolves_feedback
  AFTER UPDATE ON product_actions
  FOR EACH ROW
  EXECUTE FUNCTION auto_resolve_feedback_on_action_complete();

-- =============================================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE feedback_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all authenticated users" 
  ON feedback_escalations FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow write access for admins" 
  ON feedback_escalations FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('vp_product', 'studio_ambassador', 'regional_lead')
    )
  );

-- =============================================================================
-- 8. HELPER VIEW FOR FEEDBACK WITH ESCALATION STATUS
-- =============================================================================

CREATE OR REPLACE VIEW feedback_with_escalation AS
SELECT 
  f.*,
  e.escalation_level,
  e.reason as escalation_reason,
  e.triggered_at as escalation_triggered_at,
  e.acknowledged_at as escalation_acknowledged_at,
  a.id as action_id,
  a.title as action_title,
  a.status as action_status
FROM product_feedback f
LEFT JOIN feedback_escalations e ON e.feedback_id = f.id AND e.resolved_at IS NULL
LEFT JOIN product_actions a ON a.id = f.linked_action_id;
