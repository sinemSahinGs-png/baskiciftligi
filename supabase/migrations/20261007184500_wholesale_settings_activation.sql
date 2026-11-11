alter table public.wholesale_settings
  add column if not exists checkout_open boolean not null default false;

alter table public.wholesale_settings
  add column if not exists paytr_test_callback_at timestamptz;
