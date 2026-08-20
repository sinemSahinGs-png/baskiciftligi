-- When no queued job exists, an uninitialized quote_jobs composite is all-null.
-- PostgREST serializes that as a JSON object, and String(null) became "null".

create or replace function public.claim_quote_job(
  worker_id text,
  lease_ms integer default 720000
)
returns public.quote_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.quote_jobs;
  lock_cutoff timestamptz := now() - make_interval(secs => greatest(lease_ms, 1000) / 1000.0);
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required for job claim'
      using errcode = '42501';
  end if;

  update public.quote_jobs
  set state = 'uploaded'::public.quote_job_state,
      locked_at = null,
      locked_by = null,
      error_code = 'stale_lease',
      error_message = 'Stale worker lease recovered.',
      updated_at = now()
  where locked_at is not null
    and locked_at < lock_cutoff
    and state in (
      'validating'::public.quote_job_state,
      'analyzing'::public.quote_job_state,
      'slicing'::public.quote_job_state
    )
    and quote_id is null
    and completed_at is null;

  with candidate as (
    select id
    from public.quote_jobs
    where quote_id is null
      and completed_at is null
      and attempt_count < max_attempts
      and locked_at is null
      and state in (
        'created'::public.quote_job_state,
        'uploaded'::public.quote_job_state
      )
    order by created_at asc
    for update skip locked
    limit 1
  )
  update public.quote_jobs as job
  set locked_at = now(),
      locked_by = worker_id,
      attempt_count = job.attempt_count + 1,
      state = 'slicing'::public.quote_job_state,
      started_at = coalesce(job.started_at, now()),
      error_code = null,
      error_message = null,
      updated_at = now()
  from candidate
  where job.id = candidate.id
  returning job.* into claimed;

  if claimed.id is null then
    return null;
  end if;

  return claimed;
end;
$$;
