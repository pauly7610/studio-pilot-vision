-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.lifecycle_stage AS ENUM ('concept', 'early_pilot', 'pilot', 'commercial', 'sunset');
CREATE TYPE public.product_type AS ENUM ('data_services', 'payment_flows', 'core_products', 'partnerships');
CREATE TYPE public.risk_band AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.compliance_status AS ENUM ('pending', 'in_progress', 'complete');
CREATE TYPE public.user_role AS ENUM ('vp_product', 'studio_ambassador', 'regional_lead', 'sales', 'partner_ops', 'viewer');

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  product_type public.product_type NOT NULL,
  region TEXT NOT NULL DEFAULT 'North America',
  lifecycle_stage public.lifecycle_stage NOT NULL,
  launch_date DATE,
  revenue_target NUMERIC(10,2),
  owner_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product metrics table (time series data)
CREATE TABLE public.product_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  actual_revenue NUMERIC(10,2),
  adoption_rate NUMERIC(5,2),
  active_users INTEGER,
  transaction_volume INTEGER,
  churn_rate NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Readiness scores table
CREATE TABLE public.product_readiness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  compliance_complete BOOLEAN DEFAULT FALSE,
  sales_training_pct NUMERIC(5,2) DEFAULT 0,
  partner_enabled_pct NUMERIC(5,2) DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  documentation_score NUMERIC(5,2) DEFAULT 0,
  readiness_score NUMERIC(5,2) NOT NULL,
  risk_band public.risk_band NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Compliance tracking
CREATE TABLE public.product_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  certification_type TEXT NOT NULL,
  status public.compliance_status NOT NULL,
  completed_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, certification_type)
);

-- Partner enablement
CREATE TABLE public.product_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  partner_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  onboarded_date DATE,
  integration_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales training
CREATE TABLE public.sales_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  total_reps INTEGER NOT NULL DEFAULT 0,
  trained_reps INTEGER NOT NULL DEFAULT 0,
  coverage_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_reps > 0 THEN (trained_reps::NUMERIC / total_reps::NUMERIC * 100) ELSE 0 END
  ) STORED,
  last_training_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Customer feedback
CREATE TABLE public.product_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  theme TEXT,
  sentiment_score NUMERIC(5,2),
  impact_level TEXT,
  volume INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML Predictions
CREATE TABLE public.product_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  success_probability NUMERIC(5,2),
  revenue_probability NUMERIC(5,2),
  failure_risk NUMERIC(5,2),
  model_version TEXT NOT NULL,
  features JSONB,
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'viewer',
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All authenticated users can read
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view metrics"
  ON public.product_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view readiness"
  ON public.product_readiness FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view compliance"
  ON public.product_compliance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view partners"
  ON public.product_partners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view training"
  ON public.sales_training FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view feedback"
  ON public.product_feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view predictions"
  ON public.product_predictions FOR SELECT
  TO authenticated
  USING (true);

-- Helper function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND role IN ('vp_product', 'studio_ambassador')
  );
$$;

-- Admin users can insert/update/delete
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage metrics"
  ON public.product_metrics FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage readiness"
  ON public.product_readiness FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage compliance"
  ON public.product_compliance FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage partners"
  ON public.product_partners FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage training"
  ON public.sales_training FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert feedback"
  ON public.product_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage feedback"
  ON public.product_feedback FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'viewer'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_updated_at
  BEFORE UPDATE ON public.product_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.product_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();