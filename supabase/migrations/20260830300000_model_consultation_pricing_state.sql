-- Idempotent: pricing state for consultation requests (admin-facing).
alter table if exists public.model_consultation_requests
  add column if not exists pricing_state text;

comment on column public.model_consultation_requests.pricing_state is
  'Customer pricing state at request time: unanalysed | rough_range | analysed';
