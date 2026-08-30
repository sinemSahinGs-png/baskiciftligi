-- Add admin-only license evaluation snapshot to consultation requests.
-- Idempotent; does not modify RLS or existing rows beyond nullable column add.

alter table public.model_consultation_requests
  add column if not exists license_evaluation text;

comment on column public.model_consultation_requests.license_evaluation is
  'Admin-only license evaluation bucket computed server-side at request creation.';
