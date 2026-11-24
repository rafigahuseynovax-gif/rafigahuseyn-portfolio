-- Supabase SQL Editor-də bir dəfə icra edin.
create table if not exists public.process_cases (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 140),
 category text not null default '',
 description text not null default '',
 user_story text not null,
 acceptance_criteria text not null default '',
 image_path text not null,
 is_public boolean not null default true,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.process_cases enable row level security;
drop policy if exists "Public can read public process cases" on public.process_cases;
create policy "Public can read public process cases" on public.process_cases for select to anon, authenticated using (is_public = true);
drop policy if exists "Authenticated users manage process cases" on public.process_cases;
create policy "Authenticated users manage process cases" on public.process_cases for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
-- Mövcud portfolio-files bucket-dən istifadə edilir; yeni bucket yaratmaq lazım deyil.
