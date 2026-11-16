-- RUN THIS ONCE in Supabase SQL Editor to enable Employee Directory Add (no Edge Function required)
create table if not exists public.employee_directory (
 id uuid primary key default gen_random_uuid(),
 full_name text not null,
 role text not null default 'graphics_designer',
 phone text,
 whatsapp text,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.employee_directory enable row level security;
drop policy if exists "employee directory read authenticated" on public.employee_directory;
create policy "employee directory read authenticated" on public.employee_directory for select to authenticated using (true);
drop policy if exists "employee directory admin insert" on public.employee_directory;
create policy "employee directory admin insert" on public.employee_directory for insert to authenticated with check (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','boss') and p.is_active=true)
);
drop policy if exists "employee directory admin update" on public.employee_directory;
create policy "employee directory admin update" on public.employee_directory for update to authenticated using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','boss') and p.is_active=true)
) with check (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','boss') and p.is_active=true)
);
