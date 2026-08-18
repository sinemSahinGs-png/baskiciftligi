-- Octo Studio Phase 1: uploaded geometry, print configuration, quotes, and external models.

create table if not exists public.external_model_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  source_type text not null check (source_type in ('api', 'marketplace', 'repository')),
  base_url text not null,
  api_base_url text,
  terms_url text,
  default_license text,
  is_active boolean not null default true,
  sync_metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(sync_metadata) = 'object'),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_models (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references public.external_model_sources(id) on delete restrict,
  external_id text not null check (char_length(external_id) between 1 and 240),
  title text not null check (char_length(title) between 1 and 240),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  source_url text not null,
  preview_image_url text,
  download_url text,
  author_name text,
  author_url text,
  license_code text,
  attribution_text text,
  status public.publication_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id),
  unique (source_id, slug)
);

create index if not exists external_models_publication_idx
  on public.external_models (status, published_at desc);
create index if not exists external_models_source_idx
  on public.external_models (source_id, updated_at desc);

create table if not exists public.external_model_permissions (
  id uuid primary key default extensions.gen_random_uuid(),
  external_model_id uuid not null references public.external_models(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope public.permission_scope not null,
  is_allowed boolean not null default true,
  source_permission_reference text,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  unique (external_model_id, user_id, scope)
);

create index if not exists external_model_permissions_user_idx
  on public.external_model_permissions (user_id, expires_at);
create index if not exists external_model_permissions_model_idx
  on public.external_model_permissions (external_model_id, scope);

create table if not exists public.uploaded_models (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  external_model_id uuid references public.external_models(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 180),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  storage_bucket text not null default 'model-uploads'
    check (storage_bucket = 'model-uploads'),
  storage_path text not null unique,
  file_extension text not null
    check (lower(file_extension) in ('stl', 'obj', '3mf', 'step', 'stp')),
  mime_type text,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 1073741824),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  unit text not null default 'mm' check (unit in ('mm', 'cm', 'in')),
  status public.model_status not null default 'uploaded',
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (storage_path like user_id::text || '/%'),
  check (
    (status = 'deleted' and deleted_at is not null)
    or status <> 'deleted'
  )
);

create index if not exists uploaded_models_user_created_idx
  on public.uploaded_models (user_id, created_at desc);
create index if not exists uploaded_models_worker_queue_idx
  on public.uploaded_models (status, created_at)
  where status in ('uploaded', 'queued', 'processing');
create index if not exists uploaded_models_external_idx
  on public.uploaded_models (external_model_id)
  where external_model_id is not null;

create table if not exists public.model_analyses (
  id uuid primary key default extensions.gen_random_uuid(),
  uploaded_model_id uuid not null references public.uploaded_models(id) on delete cascade,
  analysis_version integer not null default 1 check (analysis_version > 0),
  status public.analysis_status not null default 'pending',
  triangle_count bigint check (triangle_count is null or triangle_count >= 0),
  volume_cm3 numeric(16,4) check (volume_cm3 is null or volume_cm3 >= 0),
  surface_area_cm2 numeric(16,4) check (surface_area_cm2 is null or surface_area_cm2 >= 0),
  size_x_mm numeric(14,3) check (size_x_mm is null or size_x_mm >= 0),
  size_y_mm numeric(14,3) check (size_y_mm is null or size_y_mm >= 0),
  size_z_mm numeric(14,3) check (size_z_mm is null or size_z_mm >= 0),
  is_watertight boolean,
  is_manifold boolean,
  requires_repair boolean,
  repairability_score numeric(5,2)
    check (repairability_score is null or repairability_score between 0 and 100),
  estimated_material_g numeric(14,3)
    check (estimated_material_g is null or estimated_material_g >= 0),
  warnings jsonb not null default '[]'::jsonb
    check (jsonb_typeof(warnings) = 'array'),
  result jsonb not null default '{}'::jsonb
    check (jsonb_typeof(result) = 'object'),
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (uploaded_model_id, analysis_version)
);

create index if not exists model_analyses_model_created_idx
  on public.model_analyses (uploaded_model_id, created_at desc);
create index if not exists model_analyses_worker_queue_idx
  on public.model_analyses (status, created_at)
  where status in ('pending', 'processing');

create table if not exists public.printer_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 140),
  manufacturer text,
  model text,
  status public.printer_status not null default 'active',
  technology text not null default 'FDM'
    check (technology in ('FDM', 'SLA', 'SLS', 'MJF')),
  build_x_mm numeric(12,3) not null check (build_x_mm > 0),
  build_y_mm numeric(12,3) not null check (build_y_mm > 0),
  build_z_mm numeric(12,3) not null check (build_z_mm > 0),
  nozzle_diameters_mm numeric(6,3)[] not null default array[0.4]::numeric[]
    check (
      cardinality(nozzle_diameters_mm) > 0
      and array_position(nozzle_diameters_mm, null) is null
      and 0 < all(nozzle_diameters_mm)
    ),
  minimum_layer_height_mm numeric(6,3) check (minimum_layer_height_mm > 0),
  maximum_layer_height_mm numeric(6,3) check (maximum_layer_height_mm > 0),
  setup_fee_minor bigint not null default 0 check (setup_fee_minor >= 0),
  machine_hour_minor bigint not null default 0 check (machine_hour_minor >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  capabilities jsonb not null default '{}'::jsonb
    check (jsonb_typeof(capabilities) = 'object'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    maximum_layer_height_mm is null
    or minimum_layer_height_mm is null
    or maximum_layer_height_mm >= minimum_layer_height_mm
  )
);

create index if not exists printer_profiles_status_idx
  on public.printer_profiles (status, name);

create table if not exists public.printer_profile_materials (
  printer_profile_id uuid not null references public.printer_profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settings) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (printer_profile_id, material_id)
);

create index if not exists printer_profile_materials_material_idx
  on public.printer_profile_materials (material_id, printer_profile_id)
  where is_active;

create table if not exists public.print_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  material_id uuid not null,
  color_id uuid not null,
  preferred_printer_profile_id uuid references public.printer_profiles(id) on delete set null,
  layer_height_mm numeric(6,3) not null check (layer_height_mm > 0),
  infill_percent numeric(5,2) not null default 20
    check (infill_percent between 0 and 100),
  wall_count smallint not null default 3 check (wall_count between 1 and 20),
  support_enabled boolean not null default false,
  nozzle_diameter_mm numeric(6,3) check (nozzle_diameter_mm is null or nozzle_diameter_mm > 0),
  settings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settings) = 'object'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name),
  foreign key (material_id, color_id)
    references public.material_colors(material_id, color_id)
    on delete restrict
);

create unique index if not exists print_profiles_one_default_uidx
  on public.print_profiles (user_id) where is_default;
create index if not exists print_profiles_user_idx
  on public.print_profiles (user_id, updated_at desc);

create sequence if not exists public.quote_number_seq start with 100000;

create table if not exists public.print_quotes (
  id uuid primary key default extensions.gen_random_uuid(),
  quote_number text not null default (
    'QTE-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('public.quote_number_seq')::text, 8, '0')
  ),
  user_id uuid not null references public.profiles(id) on delete restrict,
  uploaded_model_id uuid not null references public.uploaded_models(id) on delete restrict,
  model_analysis_id uuid references public.model_analyses(id) on delete restrict,
  print_profile_id uuid references public.print_profiles(id) on delete set null,
  order_id uuid unique references public.orders(id) on delete set null,
  status public.quote_status not null default 'draft',
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  customer_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(customer_snapshot) = 'object'),
  model_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(model_snapshot) = 'object'),
  print_profile_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(print_profile_snapshot) = 'object'),
  pricing_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(pricing_snapshot) = 'object'),
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quote_number),
  check (discount_minor <= subtotal_minor + shipping_minor),
  check (total_minor = subtotal_minor - discount_minor + shipping_minor + tax_minor),
  check (
    (status = 'accepted' and accepted_at is not null)
    or status <> 'accepted'
  )
);

create index if not exists print_quotes_user_created_idx
  on public.print_quotes (user_id, created_at desc);
create index if not exists print_quotes_worker_queue_idx
  on public.print_quotes (status, created_at)
  where status in ('draft', 'calculating');
create index if not exists print_quotes_expiry_idx
  on public.print_quotes (expires_at)
  where status = 'ready' and expires_at is not null;

create table if not exists public.quote_items (
  id uuid primary key default extensions.gen_random_uuid(),
  print_quote_id uuid not null references public.print_quotes(id) on delete restrict,
  item_type public.quote_item_type not null,
  description_snapshot text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_amount_minor bigint not null,
  amount_minor bigint not null,
  tax_minor bigint not null default 0,
  metadata_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_snapshot) = 'object'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create index if not exists quote_items_quote_position_idx
  on public.quote_items (print_quote_id, position, created_at);

create or replace function public.validate_print_quote_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  model_owner uuid;
  profile_owner uuid;
  analysis_model uuid;
begin
  select user_id into model_owner
  from public.uploaded_models
  where id = new.uploaded_model_id;

  if model_owner is distinct from new.user_id then
    raise exception 'quote model must belong to quote user'
      using errcode = '23514';
  end if;

  if new.print_profile_id is not null then
    select user_id into profile_owner
    from public.print_profiles
    where id = new.print_profile_id;

    if profile_owner is distinct from new.user_id then
      raise exception 'quote print profile must belong to quote user'
        using errcode = '23514';
    end if;
  end if;

  if new.model_analysis_id is not null then
    select uploaded_model_id into analysis_model
    from public.model_analyses
    where id = new.model_analysis_id;

    if analysis_model is distinct from new.uploaded_model_id then
      raise exception 'quote analysis must belong to quote model'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists print_quotes_validate_ownership on public.print_quotes;
create trigger print_quotes_validate_ownership
before insert or update of user_id, uploaded_model_id, model_analysis_id, print_profile_id
on public.print_quotes
for each row execute function public.validate_print_quote_ownership();

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'external_model_sources', 'external_models', 'uploaded_models',
    'model_analyses', 'printer_profiles', 'print_profiles', 'print_quotes'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format(
      'create trigger set_updated_at before update on public.%I ' ||
      'for each row execute function public.set_updated_at()',
      target_table
    );
  end loop;
end
$$;

comment on table public.uploaded_models is
  'Private user-owned model metadata. There is deliberately no public read path.';
comment on table public.print_quotes is
  'Quote inputs and pricing are snapshots; finalized snapshots are protected by integrity triggers.';
