-- Carousel Studio: projects table + public storage bucket for slide images
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled carousel',
  meta jsonb not null default '{}'::jsonb,
  slides jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public bucket so <img> and PNG export can load slide images directly
insert into storage.buckets (id, name, public)
values ('slides', 'slides', true)
on conflict (id) do nothing;
