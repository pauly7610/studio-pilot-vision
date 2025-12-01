-- Create action tracking table for governance interventions
CREATE TABLE public.product_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('intervention', 'review', 'training', 'compliance', 'partner', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.product_actions ENABLE ROW LEVEL SECURITY;

-- Public can view actions
CREATE POLICY "Public can view actions"
  ON public.product_actions
  FOR SELECT
  USING (true);

-- Admins can manage actions
CREATE POLICY "Admins can manage actions"
  ON public.product_actions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Users can insert actions (for feedback/suggestions)
CREATE POLICY "Users can insert actions"
  ON public.product_actions
  FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_product_actions_updated_at
  BEFORE UPDATE ON public.product_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_product_actions_product_id ON public.product_actions(product_id);
CREATE INDEX idx_product_actions_status ON public.product_actions(status);
CREATE INDEX idx_product_actions_priority ON public.product_actions(priority);