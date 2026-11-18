
-- Innovation Media PMS
-- Private Role Permission Matrix
-- Super Admin: immutable Auth UUID

BEGIN;

-- 1. Add Account Manager role safely
ALTER TYPE public.app_role
ADD VALUE IF NOT EXISTS 'account_manager';

COMMIT;

-- 2. Create designation-based permission matrix
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role public.app_role PRIMARY KEY,

    can_view_projects BOOLEAN NOT NULL DEFAULT false,
    can_edit_projects BOOLEAN NOT NULL DEFAULT false,
    can_manage_clients BOOLEAN NOT NULL DEFAULT false,
    can_view_reports BOOLEAN NOT NULL DEFAULT false,
    can_view_payments BOOLEAN NOT NULL DEFAULT false,
    can_update_payments BOOLEAN NOT NULL DEFAULT false,
    can_manage_users BOOLEAN NOT NULL DEFAULT false,
    can_manage_employees BOOLEAN NOT NULL DEFAULT false,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add all non-super-admin designations
INSERT INTO public.role_permissions (role)
VALUES
    ('boss'),
    ('chief_designer'),
    ('graphics_designer'),
    ('marketing'),
    ('operations'),
    ('pasting'),
    ('account_manager')
ON CONFLICT (role) DO NOTHING;

-- 4. Enable Row Level Security
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Only the designated Super Admin can manage permissions
DROP POLICY IF EXISTS "super_admin_manage_role_permissions"
ON public.role_permissions;

CREATE POLICY "super_admin_manage_role_permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (
    auth.uid() = 'bc251129-3b29-4111-8f59-e68a577a1501'::uuid
)
WITH CHECK (
    auth.uid() = 'bc251129-3b29-4111-8f59-e68a577a1501'::uuid
);

-- 6. Authenticated users can read the matrix
DROP POLICY IF EXISTS "authenticated_read_role_permissions"
ON public.role_permissions;

CREATE POLICY "authenticated_read_role_permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

NOTIFY pgrst, 'reload schema';
