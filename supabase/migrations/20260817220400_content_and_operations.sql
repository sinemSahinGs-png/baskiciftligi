-- Octo Studio Phase 1: content, navigation, CRM, notifications, settings, and audit.

create table if not exists public.media_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_bucket text not null check (char_length(storage_bucket) between 1 and 100),
  storage_path text not null,
  original_filename text,
  media_type text not null check (media_type in ('image', 'video', 'document', 'other')),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text,
  caption text,
  status public.publication_status not null default 'draft',
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path),
  check (not is_public or status = 'published')
);

create index if not exists media_assets_public_idx
  on public.media_assets (media_type, published_at desc)
  where is_public and status = 'published';
create index if not exists media_assets_uploader_idx
  on public.media_assets (uploaded_by, created_at desc)
  where uploaded_by is not null;

create table if not exists public.blog_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  author_name_snapshot text,
  title text not null check (char_length(title) between 1 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text,
  body text not null,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  status public.publication_status not null default 'draft',
  tags text[] not null default '{}'::text[],
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_publication_idx
  on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_tags_idx
  on public.blog_posts using gin (tags);
create index if not exists blog_posts_search_idx
  on public.blog_posts using gin (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || body)
  );

create table if not exists public.pages (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  body jsonb not null default '{}'::jsonb
    check (jsonb_typeof(body) in ('object', 'array')),
  template text not null default 'default'
    check (template in ('default', 'landing', 'legal', 'contact')),
  status public.publication_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pages_publication_idx
  on public.pages (status, published_at desc);

create table if not exists public.homepage_sections (
  id uuid primary key default extensions.gen_random_uuid(),
  section_key text not null unique check (section_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  section_type text not null
    check (section_type in ('hero', 'categories', 'products', 'collection', 'content', 'cta', 'custom')),
  heading text,
  subheading text,
  content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(content) = 'object'),
  status public.publication_status not null default 'draft',
  position integer not null default 0 check (position >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists homepage_sections_public_idx
  on public.homepage_sections (status, position, starts_at, ends_at);

create table if not exists public.navigation_menus (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  handle text not null unique check (handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default extensions.gen_random_uuid(),
  menu_id uuid not null references public.navigation_menus(id) on delete cascade,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 100),
  target_type text not null
    check (target_type in ('url', 'page', 'category', 'product', 'collection')),
  target_id uuid,
  url text,
  visibility text not null default 'public'
    check (visibility in ('public', 'authenticated', 'admin')),
  opens_new_tab boolean not null default false,
  position integer not null default 0 check (position >= 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id),
  check (
    (target_type = 'url' and url is not null and target_id is null)
    or
    (target_type <> 'url' and target_id is not null)
  ),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists navigation_items_menu_parent_position_idx
  on public.navigation_items (menu_id, parent_id, position);
create index if not exists navigation_items_target_idx
  on public.navigation_items (target_type, target_id)
  where target_id is not null;

create table if not exists public.leads (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 140),
  email text,
  phone text,
  company text,
  source text,
  request_type text,
  message text,
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  converted_user_id uuid references public.profiles(id) on delete set null,
  consent_to_contact boolean not null default false,
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  contacted_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create index if not exists leads_status_created_idx
  on public.leads (status, created_at desc);
create index if not exists leads_assignee_idx
  on public.leads (assigned_to, status, created_at)
  where assigned_to is not null;
create index if not exists leads_user_idx
  on public.leads (user_id, created_at desc)
  where user_id is not null;
create index if not exists leads_email_lower_idx
  on public.leads (lower(email)) where email is not null;

create table if not exists public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  parent_message_id uuid references public.messages(id) on delete set null,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  channel text not null default 'contact_form'
    check (channel in ('contact_form', 'email', 'support', 'system')),
  sender_name text,
  sender_email text,
  sender_phone text,
  subject text check (subject is null or char_length(subject) <= 240),
  body text not null check (char_length(body) between 1 and 10000),
  status public.message_status not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_message_id is null or parent_message_id <> id),
  check (user_id is not null or sender_email is not null or sender_phone is not null)
);

create index if not exists messages_status_created_idx
  on public.messages (status, created_at desc);
create index if not exists messages_user_created_idx
  on public.messages (user_id, created_at desc)
  where user_id is not null;
create index if not exists messages_lead_created_idx
  on public.messages (lead_id, created_at)
  where lead_id is not null;
create index if not exists messages_assignee_idx
  on public.messages (assigned_to, status, created_at)
  where assigned_to is not null;

create table if not exists public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (char_length(notification_type) between 1 and 80),
  title text not null check (char_length(title) between 1 and 180),
  body text,
  action_url text,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  read_at timestamptz,
  archived_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null and archived_at is null;
create index if not exists notifications_expiry_idx
  on public.notifications (expires_at) where expires_at is not null;

create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_settings_public_idx
  on public.site_settings (key) where is_public;

create table if not exists public.audit_logs (
  id bigint generated by default as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  action text not null check (char_length(action) between 1 and 120),
  table_name text,
  record_id text,
  request_id text,
  ip_address inet,
  user_agent text,
  old_values jsonb
    check (old_values is null or jsonb_typeof(old_values) = 'object'),
  new_values jsonb
    check (new_values is null or jsonb_typeof(new_values) = 'object'),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_table_record_idx
  on public.audit_logs (table_name, record_id, created_at desc);
create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id, created_at desc)
  where actor_id is not null;
create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);

create or replace function public.write_audit_log(
  audit_action text,
  audit_table_name text default null,
  audit_record_id text default null,
  audit_old_values jsonb default null,
  audit_new_values jsonb default null,
  audit_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_audit_id bigint;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'administrator or service role required'
      using errcode = '42501';
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_role,
    action,
    table_name,
    record_id,
    request_id,
    old_values,
    new_values,
    metadata
  )
  values (
    auth.uid(),
    coalesce(auth.jwt() ->> 'role', current_user),
    audit_action,
    audit_table_name,
    audit_record_id,
    current_setting('request.headers', true)::jsonb ->> 'x-request-id',
    audit_old_values,
    audit_new_values,
    audit_metadata
  )
  returning id into new_audit_id;

  return new_audit_id;
end;
$$;

revoke all on function public.write_audit_log(text, text, text, jsonb, jsonb, jsonb)
  from public;
grant execute on function public.write_audit_log(text, text, text, jsonb, jsonb, jsonb)
  to authenticated, service_role;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'media_assets', 'blog_posts', 'pages', 'homepage_sections',
    'navigation_menus', 'navigation_items', 'leads', 'messages',
    'site_settings'
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

comment on table public.site_settings is
  'Only rows explicitly marked is_public may be read by anonymous clients.';
comment on table public.audit_logs is
  'Append-only administrative/service audit trail. Never exposed to customers.';
