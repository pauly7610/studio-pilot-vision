-- Make all tables publicly readable for demo purposes
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON public.product_metrics;
DROP POLICY IF EXISTS "Authenticated users can view readiness" ON public.product_readiness;
DROP POLICY IF EXISTS "Authenticated users can view compliance" ON public.product_compliance;
DROP POLICY IF EXISTS "Authenticated users can view partners" ON public.product_partners;
DROP POLICY IF EXISTS "Authenticated users can view training" ON public.sales_training;
DROP POLICY IF EXISTS "Authenticated users can view feedback" ON public.product_feedback;
DROP POLICY IF EXISTS "Authenticated users can view predictions" ON public.product_predictions;

-- Create public read policies
CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Public can view metrics"
  ON public.product_metrics FOR SELECT
  USING (true);

CREATE POLICY "Public can view readiness"
  ON public.product_readiness FOR SELECT
  USING (true);

CREATE POLICY "Public can view compliance"
  ON public.product_compliance FOR SELECT
  USING (true);

CREATE POLICY "Public can view partners"
  ON public.product_partners FOR SELECT
  USING (true);

CREATE POLICY "Public can view training"
  ON public.sales_training FOR SELECT
  USING (true);

CREATE POLICY "Public can view feedback"
  ON public.product_feedback FOR SELECT
  USING (true);

CREATE POLICY "Public can view predictions"
  ON public.product_predictions FOR SELECT
  USING (true);