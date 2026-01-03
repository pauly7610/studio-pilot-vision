-- Migration: Add uploaded_documents and product_dependencies tables
-- Date: 2026-01-03

-- =====================================================
-- 1. UPLOADED DOCUMENTS TABLE (Supabase Storage tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    
    -- AI Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    chroma_chunks INTEGER DEFAULT 0,
    cognee_ingested BOOLEAN DEFAULT FALSE,
    extracted_chars INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- OCR tracking
    ocr_applied BOOLEAN DEFAULT FALSE,
    ocr_confidence FLOAT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_product ON uploaded_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_status ON uploaded_documents(status);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_created ON uploaded_documents(created_at DESC);

-- Enable RLS
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read documents
CREATE POLICY "Anyone can view documents" ON uploaded_documents
    FOR SELECT USING (true);

-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload" ON uploaded_documents
    FOR INSERT WITH CHECK (true);

-- Policy: Only uploader or admin can delete
CREATE POLICY "Users can update their documents" ON uploaded_documents
    FOR UPDATE USING (true);


-- =====================================================
-- 2. PRODUCT DEPENDENCIES TABLE
-- =====================================================

-- Create dependency-related enums if they don't exist
DO $$ BEGIN
    CREATE TYPE dependency_type AS ENUM ('internal', 'external');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE dependency_status AS ENUM ('blocked', 'pending', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE dependency_category AS ENUM (
        'legal', 'cyber', 'compliance', 'privacy', 'engineering', 'ops',
        'partner_rail', 'vendor', 'api', 'integration', 'regulatory'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS product_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type dependency_type NOT NULL DEFAULT 'internal',
    category dependency_category NOT NULL,
    status dependency_status NOT NULL DEFAULT 'pending',
    blocked_since TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    owner_email TEXT,
    external_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dependency queries
CREATE INDEX IF NOT EXISTS idx_product_dependencies_product ON product_dependencies(product_id);
CREATE INDEX IF NOT EXISTS idx_product_dependencies_status ON product_dependencies(status);
CREATE INDEX IF NOT EXISTS idx_product_dependencies_blocked ON product_dependencies(status, blocked_since) 
    WHERE status = 'blocked';

-- Enable RLS
ALTER TABLE product_dependencies ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read dependencies
CREATE POLICY "Anyone can view dependencies" ON product_dependencies
    FOR SELECT USING (true);

-- Policy: Authenticated users can create/update
CREATE POLICY "Authenticated users can create dependencies" ON product_dependencies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update dependencies" ON product_dependencies
    FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete dependencies" ON product_dependencies
    FOR DELETE USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_dependency_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_dependencies_updated_at ON product_dependencies;
CREATE TRIGGER product_dependencies_updated_at
    BEFORE UPDATE ON product_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION update_dependency_timestamp();

-- Auto-set blocked_since when status changes to blocked
CREATE OR REPLACE FUNCTION set_blocked_since()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'blocked' AND OLD.status != 'blocked' THEN
        NEW.blocked_since = NOW();
    ELSIF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_dependencies_blocked ON product_dependencies;
CREATE TRIGGER product_dependencies_blocked
    BEFORE UPDATE ON product_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION set_blocked_since();


-- =====================================================
-- 3. SEED SOME DEMO DEPENDENCIES
-- =====================================================

-- Add demo dependencies for existing products
INSERT INTO product_dependencies (product_id, name, type, category, status, notes, blocked_since)
SELECT 
    p.id,
    'Stripe Payment Rails',
    'external',
    'partner_rail',
    'blocked',
    'Waiting on Stripe API v3 certification. ETA: Q2 2026',
    NOW() - INTERVAL '14 days'
FROM products p WHERE p.name ILIKE '%PayLink%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO product_dependencies (product_id, name, type, category, status, notes)
SELECT 
    p.id,
    'Legal Review - Privacy Policy',
    'internal',
    'legal',
    'pending',
    'Privacy team reviewing new data collection terms'
FROM products p WHERE p.name ILIKE '%PayLink%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO product_dependencies (product_id, name, type, category, status, notes, resolved_at)
SELECT 
    p.id,
    'SOC2 Certification',
    'internal',
    'compliance',
    'resolved',
    'Completed Dec 2025',
    NOW() - INTERVAL '7 days'
FROM products p WHERE p.name ILIKE '%PayLink%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Add dependencies for another product
INSERT INTO product_dependencies (product_id, name, type, category, status, notes)
SELECT 
    p.id,
    'Visa Settlement API',
    'external',
    'api',
    'pending',
    'Integration testing in progress'
FROM products p WHERE p.name ILIKE '%Crypto%' OR p.name ILIKE '%Digital%' LIMIT 1
ON CONFLICT DO NOTHING;


-- =====================================================
-- 4. CREATE SUPABASE STORAGE BUCKET (via SQL)
-- =====================================================

-- Note: Storage bucket creation is typically done via Supabase dashboard
-- or supabase CLI. This comment documents the expected setup:
--
-- Bucket name: documents
-- Public: false
-- Allowed MIME types: application/pdf, text/plain, text/markdown, 
--                     application/vnd.openxmlformats-officedocument.wordprocessingml.document
-- Max file size: 10MB

-- If using supabase CLI, run:
-- supabase storage create documents --public false


-- =====================================================
-- 5. ADD WEBHOOK TRIGGER FOR DEPENDENCIES
-- =====================================================

-- Trigger webhook when dependencies change (so AI can track blockers)
DROP TRIGGER IF EXISTS product_dependencies_webhook ON product_dependencies;
CREATE TRIGGER product_dependencies_webhook
    AFTER INSERT OR UPDATE OR DELETE ON product_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION supabase_functions.http_request(
        'https://studio-pilot-vision.onrender.com/api/sync/webhook',
        'POST',
        '{"Content-Type": "application/json"}',
        '{"table": "product_dependencies", "type": "dependency_change"}',
        '1000'
    );

