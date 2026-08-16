alter table public.profiles
  add column if not exists onboarding_started_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz;

update public.profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;
