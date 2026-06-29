-- Create employer records for ISH_BERUVCHI users who don't have one yet
INSERT INTO public.employers (name, user_id, created_by, is_active, phone, address)
SELECT
  p.full_name || ' Company' as name,
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
