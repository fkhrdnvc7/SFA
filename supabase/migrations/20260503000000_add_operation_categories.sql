-- Create operation_categories table
CREATE TABLE IF NOT EXISTS public.operation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code_prefix TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on operation_categories table
ALTER TABLE public.operation_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for operation_categories
-- Everyone can view categories
CREATE POLICY "Everyone can view operation categories" ON public.operation_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Only ADMIN and MANAGER can create categories
CREATE POLICY "Admins and managers can create operation categories" ON public.operation_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Only ADMIN and MANAGER can update categories
CREATE POLICY "Admins and managers can update operation categories" ON public.operation_categories
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  )
  WITH CHECK (
    get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Only ADMIN and MANAGER can delete categories
CREATE POLICY "Admins and managers can delete operation categories" ON public.operation_categories
  FOR DELETE
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- Add category_id column to operations table
ALTER TABLE public.operations
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.operation_categories(id) ON DELETE CASCADE;

-- Create index on category_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_operations_category_id ON public.operations(category_id);

-- Update timestamp for operation_categories when updated
CREATE OR REPLACE FUNCTION update_operation_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operation_categories_updated_at
  BEFORE UPDATE ON public.operation_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_operation_categories_updated_at();
