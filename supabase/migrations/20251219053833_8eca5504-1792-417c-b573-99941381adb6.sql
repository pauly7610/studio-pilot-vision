-- Add success_metric column to products table for Regional vs Global tracking
ALTER TABLE public.products 
ADD COLUMN success_metric TEXT DEFAULT 'Scalability/Standardization';

-- Add gating_status column with proper values for franchise/regulatory tracking
ALTER TABLE public.products 
ADD COLUMN gating_status TEXT DEFAULT 'Pending Review';

-- Add gating_status_since date to track how long a product has been in a status
ALTER TABLE public.products 
ADD COLUMN gating_status_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a table for in-market evidence tracking (Post-Production Loop)
CREATE TABLE public.product_market_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sentiment_score NUMERIC(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  merchant_adoption_rate NUMERIC(5,2) CHECK (merchant_adoption_rate >= 0 AND merchant_adoption_rate <= 100),
  sample_size INTEGER DEFAULT 0,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new table
ALTER TABLE public.product_market_evidence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market evidence
CREATE POLICY "Public can view market evidence"
ON public.product_market_evidence
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage market evidence"
ON public.product_market_evidence
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_product_market_evidence_updated_at
BEFORE UPDATE ON public.product_market_evidence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();