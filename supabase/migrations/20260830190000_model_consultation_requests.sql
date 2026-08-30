-- Model consultation requests from Hazır Modeller discovery flow.
-- Additive only; does not modify existing permission tables.
-- Access: server-side service role only (public POST via Next.js API route).

do $$
begin
  create type public.model_consultation_status as enum (
    'pending_license_review',
    'reviewing',
    'needs_info',
    'production_ok',
    'not_suitable',
    'quote_sent',
    'completed'
  );
exception when duplicate_object then null;
end
$$;

create table if not exists public.model_consultation_requests (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'thingiverse',
  external_id text not null,
  model_title text not null,
  creator_name text,
  source_url text not null,
  license_label text,
  license_code text,
  thumbnail_url text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  material text not null,
  color text not null,
  size_label text not null,
  quantity integer not null check (quantity > 0 and quantity <= 999),
  customer_note text,
  estimated_gross_minor integer,
  production_options jsonb not null default '{}'::jsonb,
  status public.model_consultation_status not null default 'pending_license_review',
  admin_note text,
  final_quote_gross_minor integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists model_consultation_requests_status_idx
  on public.model_consultation_requests (status, created_at desc);

create index if not exists model_consultation_requests_model_idx
  on public.model_consultation_requests (source, external_id);

alter table public.model_consultation_requests enable row level security;

drop policy if exists model_consultation_requests_staff_all
  on public.model_consultation_requests;
drop policy if exists model_consultation_requests_service
  on public.model_consultation_requests;

create policy model_consultation_requests_service
  on public.model_consultation_requests
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.model_consultation_requests from anon, authenticated;
grant all privileges on table public.model_consultation_requests to service_role;

comment on table public.model_consultation_requests is
  'License consultation requests from Hazır Modeller. Inserts/reads via server-side service role only.';
