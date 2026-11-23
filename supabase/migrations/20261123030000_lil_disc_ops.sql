alter type public.app_role add value if not exists 'lil_disc';

create table if not exists public.lil_disc_albums (
  id text primary key,
  name text not null,
  description text not null default 'NFC özellikli mini CD anahtarlık.',
  price_minor bigint not null check (price_minor >= 0),
  image_url text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null,
  role text not null check (role = 'lil_disc'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.lil_disc_albums enable row level security;
alter table public.staff_accounts enable row level security;

insert into public.lil_disc_albums (id, name, description, price_minor, image_url, sort_order)
values
  ('gece-dansi', 'Manifesto', 'NFC özellikli mini CD anahtarlık.', 20000, '/categories/lil-disc/manifesto.webp?v=2', 0),
  ('nevermind', 'Nevermind', 'NFC özellikli mini CD anahtarlık.', 20000, '/categories/lil-disc/nevermind.webp?v=2', 1),
  ('master-of-puppets', 'Master of Puppets', 'NFC özellikli mini CD anahtarlık.', 20000, '/categories/lil-disc/master-of-puppets.webp?v=2', 2),
  ('gecelerin-sarkisi', 'Kadın', 'NFC özellikli mini CD anahtarlık.', 20000, '/categories/lil-disc/kadin.webp?v=2', 3),
  ('fallen', 'Fallen', 'NFC özellikli mini CD anahtarlık.', 20000, '/categories/lil-disc/fallen.webp?v=2', 4),
  ('beton-beat', '17', 'NFC özellikli mini CD anahtarlık.', 20000, '/categories/lil-disc/17.webp?v=2', 5),
  ('deri-ceket', 'Şehrimin Tadı', 'NFC özellikli mini CD anahtarlık.', 20000, '/categories/lil-disc/sehrimin-tadi.webp?v=2', 6)
on conflict (id) do nothing;
