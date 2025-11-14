-- Create colors table
CREATE TABLE public.colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sizes table
CREATE TABLE public.sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;

-- RLS policies for colors
CREATE POLICY "Everyone can view colors"
  ON public.colors FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage colors"
  ON public.colors FOR ALL
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER'));

-- RLS policies for sizes
CREATE POLICY "Everyone can view sizes"
  ON public.sizes FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage sizes"
  ON public.sizes FOR ALL
  USING (get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER'));