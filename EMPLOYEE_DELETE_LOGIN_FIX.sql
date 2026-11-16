-- Run once in Supabase SQL Editor (safe migration)
ALTER TABLE public.employee_directory ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
-- Link existing directory rows to Auth users by matching their profile full_name (only unique matches)
WITH matches AS (
 SELECT d.id AS directory_id, p.id AS auth_id,
        COUNT(*) OVER (PARTITION BY d.id) AS match_count
 FROM public.employee_directory d
 JOIN public.profiles p ON lower(trim(p.full_name))=lower(trim(d.full_name))
 WHERE d.auth_user_id IS NULL
)
UPDATE public.employee_directory d SET auth_user_id=m.auth_id
FROM matches m WHERE d.id=m.directory_id AND m.match_count=1;
