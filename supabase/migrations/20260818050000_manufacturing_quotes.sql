-- Phase 2 manufacturing quotation: files, jobs, quotes, pricing, license reviews.

do $$
begin
  create type public.quote_job_state as enum (
    'created', 'uploading', 'uploaded', 'validating', 'analyzing',
    'slicing', 'pricing', 'priced', 'needs_review', 'failed', 'expired', 'cancelled'
  );
exception when duplicate_object then null;
end
$$;

create table if not exists public.manufacturing_files (
  id uuid primary key,
  owner_user_id uuid references public.profiles(id) on delete set null,
  session_id uuid not null,
  source text not null check (source in ('upload', 'thingiverse')),
  original_filename text not null,
  format text not null check (format in ('stl', 'obj', '3mf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  storage_key text not null unique,
  mime_type text,
  rights_confirmed_at timestamptz not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists manufacturing_files_owner_idx
  on public.manufacturing_files (owner_user_id, created_at desc);
create index if not exists manufacturing_files_session_idx
  on public.manufacturing_files (session_id, created_at desc);

create table if not exists public.quote_jobs (
  id uuid primary key,
  file_id uuid not null references public.manufacturing_files(id) on delete restrict,
  owner_user_id uuid references public.profiles(id) on delete set null,
  session_id uuid not null,
  state public.quote_job_state not null default 'created',
  idempotency_key text not null unique,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  locked_at timestamptz,
  locked_by text,
  configuration jsonb not null,
  analysis jsonb,
  metrics jsonb,
  quote_id uuid,
  error_code text,
  error_message text,
  review_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists quote_jobs_queue_idx
  on public.quote_jobs (state, created_at)
  where state in ('created', 'uploaded', 'validating', 'analyzing', 'slicing');

create table if not exists public.manufacturing_quotes (
  id uuid primary key,
  job_id uuid not null references public.quote_jobs(id) on delete restrict,
  file_id uuid not null references public.manufacturing_files(id) on delete restrict,
  owner_user_id uuid references public.profiles(id) on delete set null,
  session_id uuid not null,
  status text not null check (status in ('priced', 'needs_review', 'expired', 'cancelled')),
  configuration jsonb not null,
  metrics jsonb not null,
  public_breakdown jsonb not null,
  internal_breakdown jsonb not null,
  pricing_version integer not null,
  pricing_checksum text not null,
  slicer_profile_checksum text not null,
  file_checksum text not null,
  provenance jsonb not null,
  signature text not null,
  review_required boolean not null default false,
  review_flags jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_status_events (
  id uuid primary key default extensions.gen_random_uuid(),
  job_id uuid not null references public.quote_jobs(id) on delete cascade,
  from_state public.quote_job_state,
  to_state public.quote_job_state not null,
  at timestamptz not null default now(),
  detail text
);

create table if not exists public.pricing_configs (
  id uuid primary key,
  version integer not null unique,
  checksum text not null,
  rates jsonb not null,
  formula_id text not null default 'bc-quote-v1',
  is_development_seed boolean not null default false,
  activated_at timestamptz,
  activated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.model_permission_reviews (
  id uuid primary key,
  source text not null check (source = 'thingiverse'),
  thing_id text not null,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  snapshot_checksum text not null,
  license_name text not null,
  verdict jsonb not null,
  legal_basis text not null,
  allowed_commercial_use boolean not null default false
);

alter table public.manufacturing_files enable row level security;
alter table public.quote_jobs enable row level security;
alter table public.manufacturing_quotes enable row level security;
alter table public.quote_status_events enable row level security;
alter table public.pricing_configs enable row level security;
alter table public.model_permission_reviews enable row level security;

create policy manufacturing_files_owner_read on public.manufacturing_files
  for select using (owner_user_id = auth.uid());
create policy quote_jobs_owner_read on public.quote_jobs
  for select using (owner_user_id = auth.uid());
create policy manufacturing_quotes_owner_read on public.manufacturing_quotes
  for select using (owner_user_id = auth.uid());
create policy pricing_configs_staff_read on public.pricing_configs
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );
create policy permission_reviews_staff_read on public.model_permission_reviews
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );
