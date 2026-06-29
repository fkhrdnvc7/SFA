-- Sync ISH_BERUVCHI users to employers table
-- Create employer records for ISH_BERUVCHI users who don't have one yet

INSERT INTO public.employers (name, company_name, first_name, last_name, user_id, created_by, is_active, phone, address)
SELECT
  COALESCE(p.full_name, 'Ish beruvchi') as name,
  COALESCE(p.full_name, 'Ish beruvchi') as company_name,
  SPLIT_PART(p.full_name, ' ', 1) as first_name,
  CASE
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(p.full_name, ' '), 1) > 1
    THEN SPLIT_PART(p.full_name, ' ', 2)
    ELSE NULL
  END as last_name,
  p.id as user_id,
  p.id as created_by,
  true as is_active,
  NULL as phone,
  NULL as address
FROM public.profiles p
WHERE p.role = 'ISH_BERUVCHI'
AND p.id NOT IN (
  SELECT user_id
  FROM public.employers
  WHERE user_id IS NOT NULL
)
ON CONFLICT DO NOTHING;
