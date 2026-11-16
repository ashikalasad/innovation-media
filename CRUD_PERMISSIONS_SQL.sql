-- Run this in Supabase SQL Editor as project owner.
-- Enables authenticated Admin/Boss to update and delete employee directory rows.
DROP POLICY IF EXISTS employee_update_admin_boss ON public.employee_directory;
CREATE POLICY employee_update_admin_boss ON public.employee_directory
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','boss') AND p.is_active=true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','boss') AND p.is_active=true));

DROP POLICY IF EXISTS employee_delete_admin_boss ON public.employee_directory;
CREATE POLICY employee_delete_admin_boss ON public.employee_directory
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','boss') AND p.is_active=true));

-- Client CRUD policies for Admin/Boss
DROP POLICY IF EXISTS clients_update_admin_boss ON public.clients;
CREATE POLICY clients_update_admin_boss ON public.clients
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','boss') AND p.is_active=true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','boss') AND p.is_active=true));

DROP POLICY IF EXISTS clients_delete_admin_boss ON public.clients;
CREATE POLICY clients_delete_admin_boss ON public.clients
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','boss') AND p.is_active=true));

NOTIFY pgrst, 'reload schema';
