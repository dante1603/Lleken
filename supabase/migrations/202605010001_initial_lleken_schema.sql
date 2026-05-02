-- Lleken initial Supabase schema.
-- Supports Google Auth profiles, gardens, plants, events, media, environment logs,
-- AI analysis, diagnoses, recommendations, outcomes, RLS, and private image storage.

create extension if not exists pgcrypto;

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'paid', 'admin')),
  owned_plant_limit integer not null default 3 check (owned_plant_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_archetypes (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  soil_moisture_rule text not null,
  light_category text not null,
  target_humidity text not null check (target_humidity in ('baja', 'media', 'alta')),
  temp_min_safe_c integer,
  temp_max_comfort_c integer,
  drainage_required boolean not null default true,
  fertilization_season text not null default 'crecimiento_activo'
    check (fertilization_season in ('crecimiento_activo', 'minima', 'no_recomendada')),
  warning_signs text[] not null default '{}',
  typical_failures jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.species_catalog (
  id uuid primary key default gen_random_uuid(),
  species_key text not null unique,
  scientific_name text not null,
  common_names text[] not null default '{}',
  family text,
  care_archetype_id uuid references public.care_archetypes(id) on delete set null,
  knowledge_source text not null default 'ai_generated'
    check (knowledge_source in ('static_catalog', 'ai_generated', 'reviewed')),
  confidence text not null default 'media' check (confidence in ('alta', 'media', 'baja')),
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gardens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  environment_type text not null default 'exterior'
    check (environment_type in ('interior', 'balcon', 'exterior', 'invernadero', 'huerto_comunitario')),
  city text,
  lat double precision,
  lon double precision,
  location_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.garden_members (
  garden_id uuid not null references public.gardens(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (garden_id, user_id)
);

create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  garden_id uuid references public.gardens(id) on delete set null,
  species_id uuid references public.species_catalog(id) on delete set null,
  nickname text,
  suggested_name text,
  common_name text,
  scientific_name text,
  status text not null default 'active' check (status in ('active', 'in_treatment', 'lost')),
  health_state text not null default 'saludable'
    check (health_state in ('saludable', 'necesita_atencion', 'en_riesgo')),
  health_score integer not null default 75 check (health_score between 0 and 100),
  confirmed_context jsonb not null default '{}'::jsonb,
  inferred_context jsonb not null default '{}'::jsonb,
  current_care_plan jsonb not null default '{}'::jsonb,
  last_watered_at timestamptz,
  last_observed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plant_members (
  plant_id uuid not null references public.plants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (plant_id, user_id)
);

create table if not exists public.plant_events (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  garden_id uuid references public.gardens(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (
    event_type in ('creation', 'watering', 'photo', 'note', 'fertilization', 'pruning', 'transplant', 'pest_treatment', 'harvest', 'manual_review')
  ),
  user_comment text,
  event_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.plant_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.plant_events(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  bucket text not null default 'plant-images',
  storage_path text not null,
  public_url text,
  mime_type text,
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  capture_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table if not exists public.environmental_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.plant_events(id) on delete cascade,
  garden_id uuid references public.gardens(id) on delete set null,
  plant_id uuid not null references public.plants(id) on delete cascade,
  lat double precision,
  lon double precision,
  environment_type text,
  weather_condition jsonb not null default '{}'::jsonb,
  theoretical_solar_radiation double precision,
  weather_source text not null default 'open_meteo',
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.plant_events(id) on delete cascade,
  media_id uuid references public.plant_media(id) on delete set null,
  plant_id uuid not null references public.plants(id) on delete cascade,
  analysis_type text not null check (analysis_type in ('initial_identification', 'follow_up', 'refresh', 'diagnosis', 'care_plan')),
  model_provider text not null default 'google',
  model_name text not null,
  prompt_version text not null,
  schema_version text not null,
  input_context jsonb not null default '{}'::jsonb,
  raw_output jsonb not null default '{}'::jsonb,
  validated_output jsonb not null default '{}'::jsonb,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'valid' check (status in ('valid', 'fallback', 'needs_review', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  event_id uuid references public.plant_events(id) on delete set null,
  ai_analysis_id uuid references public.ai_analyses(id) on delete set null,
  health_score integer not null check (health_score between 0 and 100),
  health_state text not null check (health_state in ('saludable', 'necesita_atencion', 'en_riesgo')),
  visible_parts text[] not null default '{}',
  symptoms_observed text[] not null default '{}',
  probable_causes jsonb not null default '[]'::jsonb,
  questions_to_confirm text[] not null default '{}',
  safe_immediate_action text,
  risk text not null default 'low' check (risk in ('low', 'medium', 'high', 'critical')),
  uncertainty_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  diagnosis_id uuid references public.diagnoses(id) on delete set null,
  event_id uuid references public.plant_events(id) on delete set null,
  recommendation_type text not null check (recommendation_type in ('watering', 'light', 'pest', 'fertilization', 'substrate', 'follow_up_photo')),
  message text not null,
  reasoning jsonb not null default '{}'::jsonb,
  status text not null default 'suggested' check (status in ('suggested', 'accepted', 'ignored', 'completed', 'expired')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_outcomes (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  outcome_type text not null check (outcome_type in ('improved', 'stable', 'worse', 'unknown')),
  observed_event_id uuid references public.plant_events(id) on delete set null,
  observed_diagnosis_id uuid references public.diagnoses(id) on delete set null,
  user_feedback text,
  measured_delta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gardens_owner_id_idx on public.gardens(owner_id);
create index if not exists garden_members_user_id_idx on public.garden_members(user_id);
create index if not exists plants_owner_id_idx on public.plants(owner_id);
create index if not exists plants_garden_id_idx on public.plants(garden_id);
create index if not exists plant_members_user_id_idx on public.plant_members(user_id);
create index if not exists plant_events_plant_event_at_idx on public.plant_events(plant_id, event_at desc);
create index if not exists plant_media_plant_id_idx on public.plant_media(plant_id);
create index if not exists ai_analyses_plant_created_idx on public.ai_analyses(plant_id, created_at desc);
create index if not exists diagnoses_plant_created_idx on public.diagnoses(plant_id, created_at desc);
create index if not exists recommendations_plant_created_idx on public.recommendations(plant_id, created_at desc);

create trigger set_profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger set_care_archetypes_updated_at before update on public.care_archetypes for each row execute function private.set_updated_at();
create trigger set_species_catalog_updated_at before update on public.species_catalog for each row execute function private.set_updated_at();
create trigger set_gardens_updated_at before update on public.gardens for each row execute function private.set_updated_at();
create trigger set_plants_updated_at before update on public.plants for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.handle_new_garden_owner_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.garden_members (garden_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (garden_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger on_garden_created_add_owner_member after insert on public.gardens for each row execute function private.handle_new_garden_owner_member();

create or replace function private.handle_new_plant_owner_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.plant_members (plant_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (plant_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger on_plant_created_add_owner_member after insert on public.plants for each row execute function private.handle_new_plant_owner_member();

create or replace function private.is_garden_member(target_garden_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.garden_members gm
    where gm.garden_id = target_garden_id
      and gm.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_plant(target_plant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plants p
    where p.id = target_plant_id
      and (
        p.owner_id = (select auth.uid())
        or exists (select 1 from public.plant_members pm where pm.plant_id = p.id and pm.user_id = (select auth.uid()))
        or (
          p.garden_id is not null
          and exists (select 1 from public.garden_members gm where gm.garden_id = p.garden_id and gm.user_id = (select auth.uid()))
        )
      )
  );
$$;

create or replace function private.can_care_for_plant(target_plant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plants p
    where p.id = target_plant_id
      and (
        p.owner_id = (select auth.uid())
        or exists (select 1 from public.plant_members pm where pm.plant_id = p.id and pm.user_id = (select auth.uid()) and pm.role in ('owner', 'caregiver'))
        or (
          p.garden_id is not null
          and exists (select 1 from public.garden_members gm where gm.garden_id = p.garden_id and gm.user_id = (select auth.uid()) and gm.role in ('owner', 'caregiver'))
        )
      )
  );
$$;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

alter table public.profiles enable row level security;
alter table public.care_archetypes enable row level security;
alter table public.species_catalog enable row level security;
alter table public.gardens enable row level security;
alter table public.garden_members enable row level security;
alter table public.plants enable row level security;
alter table public.plant_members enable row level security;
alter table public.plant_events enable row level security;
alter table public.plant_media enable row level security;
alter table public.environmental_logs enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.diagnoses enable row level security;
alter table public.recommendations enable row level security;
alter table public.recommendation_outcomes enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

create policy "care_archetypes_read_authenticated" on public.care_archetypes for select to authenticated using (true);
create policy "species_catalog_read_authenticated" on public.species_catalog for select to authenticated using (true);

create policy "gardens_select_members" on public.gardens for select to authenticated using (owner_id = (select auth.uid()) or private.is_garden_member(id));
create policy "gardens_insert_own" on public.gardens for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "gardens_update_owner" on public.gardens for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "gardens_delete_owner" on public.gardens for delete to authenticated using (owner_id = (select auth.uid()));

create policy "garden_members_select_members" on public.garden_members for select to authenticated using (user_id = (select auth.uid()) or private.is_garden_member(garden_id));
create policy "garden_members_insert_owner" on public.garden_members for insert to authenticated with check (exists (select 1 from public.gardens g where g.id = garden_id and g.owner_id = (select auth.uid())));
create policy "garden_members_update_owner" on public.garden_members for update to authenticated using (exists (select 1 from public.gardens g where g.id = garden_id and g.owner_id = (select auth.uid()))) with check (exists (select 1 from public.gardens g where g.id = garden_id and g.owner_id = (select auth.uid())));
create policy "garden_members_delete_owner" on public.garden_members for delete to authenticated using (exists (select 1 from public.gardens g where g.id = garden_id and g.owner_id = (select auth.uid())));

create policy "plants_select_members" on public.plants for select to authenticated using (private.can_access_plant(id));
create policy "plants_insert_owner" on public.plants for insert to authenticated with check (owner_id = (select auth.uid()) and (garden_id is null or exists (select 1 from public.garden_members gm where gm.garden_id = garden_id and gm.user_id = (select auth.uid()) and gm.role in ('owner', 'caregiver'))));
create policy "plants_update_caregivers" on public.plants for update to authenticated using (private.can_care_for_plant(id)) with check (private.can_care_for_plant(id));
create policy "plants_delete_owner" on public.plants for delete to authenticated using (owner_id = (select auth.uid()));

create policy "plant_members_select_members" on public.plant_members for select to authenticated using (private.can_access_plant(plant_id));
create policy "plant_members_insert_owner" on public.plant_members for insert to authenticated with check (exists (select 1 from public.plants p where p.id = plant_id and p.owner_id = (select auth.uid())));
create policy "plant_members_update_owner" on public.plant_members for update to authenticated using (exists (select 1 from public.plants p where p.id = plant_id and p.owner_id = (select auth.uid()))) with check (exists (select 1 from public.plants p where p.id = plant_id and p.owner_id = (select auth.uid())));
create policy "plant_members_delete_owner" on public.plant_members for delete to authenticated using (exists (select 1 from public.plants p where p.id = plant_id and p.owner_id = (select auth.uid())));

create policy "plant_events_select_members" on public.plant_events for select to authenticated using (private.can_access_plant(plant_id));
create policy "plant_events_insert_caregivers" on public.plant_events for insert to authenticated with check (created_by = (select auth.uid()) and private.can_care_for_plant(plant_id));
create policy "plant_events_update_creator_or_owner" on public.plant_events for update to authenticated using (created_by = (select auth.uid()) or private.can_care_for_plant(plant_id)) with check (created_by = (select auth.uid()) and private.can_care_for_plant(plant_id));
create policy "plant_events_delete_creator_or_owner" on public.plant_events for delete to authenticated using (created_by = (select auth.uid()) or private.can_care_for_plant(plant_id));

create policy "plant_media_select_members" on public.plant_media for select to authenticated using (private.can_access_plant(plant_id));
create policy "plant_media_insert_caregivers" on public.plant_media for insert to authenticated with check (created_by = (select auth.uid()) and private.can_care_for_plant(plant_id));
create policy "plant_media_update_creator_or_owner" on public.plant_media for update to authenticated using (created_by = (select auth.uid()) or private.can_care_for_plant(plant_id)) with check (created_by = (select auth.uid()) and private.can_care_for_plant(plant_id));
create policy "plant_media_delete_creator_or_owner" on public.plant_media for delete to authenticated using (created_by = (select auth.uid()) or private.can_care_for_plant(plant_id));

create policy "environmental_logs_select_members" on public.environmental_logs for select to authenticated using (private.can_access_plant(plant_id));
create policy "environmental_logs_insert_caregivers" on public.environmental_logs for insert to authenticated with check (private.can_care_for_plant(plant_id));

create policy "ai_analyses_select_members" on public.ai_analyses for select to authenticated using (private.can_access_plant(plant_id));
create policy "diagnoses_select_members" on public.diagnoses for select to authenticated using (private.can_access_plant(plant_id));

create policy "recommendations_select_members" on public.recommendations for select to authenticated using (private.can_access_plant(plant_id));
create policy "recommendations_update_status_members" on public.recommendations for update to authenticated using (private.can_care_for_plant(plant_id)) with check (private.can_care_for_plant(plant_id));
create policy "recommendation_outcomes_select_members" on public.recommendation_outcomes for select to authenticated using (private.can_access_plant(plant_id));
create policy "recommendation_outcomes_insert_caregivers" on public.recommendation_outcomes for insert to authenticated with check (private.can_care_for_plant(plant_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('plant-images', 'plant-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "plant_images_select_own_folder" on storage.objects for select to authenticated using (bucket_id = 'plant-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "plant_images_insert_own_folder" on storage.objects for insert to authenticated with check (bucket_id = 'plant-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "plant_images_update_own_folder" on storage.objects for update to authenticated using (bucket_id = 'plant-images' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'plant-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "plant_images_delete_own_folder" on storage.objects for delete to authenticated using (bucket_id = 'plant-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into public.care_archetypes
  (key, name, soil_moisture_rule, light_category, target_humidity, temp_min_safe_c, temp_max_comfort_c, drainage_required, fertilization_season, warning_signs, typical_failures)
values
  ('suculenta_cactus', 'Suculentas y cactus', 'secar_completo', 'media_alta', 'baja', 5, 32, true, 'minima', array['sustrato humedo por muchos dias', 'tallo blando', 'manchas negras'], '[{"failure":"exceso_riego","severity":"alta"}]'::jsonb),
  ('aroide_tropical', 'Aroides tropicales', 'top_5cm_seco', 'brillante_indirecta', 'media', 12, 30, true, 'crecimiento_activo', array['hojas amarillas', 'puntas cafes', 'sustrato compactado'], '[{"failure":"luz_directa_excesiva","severity":"media"},{"failure":"falta_humedad","severity":"media"}]'::jsonb),
  ('alta_humedad', 'Plantas de alta humedad', 'humedad_pareja', 'brillante_indirecta', 'alta', 14, 28, true, 'crecimiento_activo', array['bordes secos', 'hojas enrolladas'], '[{"failure":"ambiente_seco","severity":"alta"}]'::jsonb),
  ('baja_luz_resistente', 'Resistentes a baja luz', 'secar_completo', 'baja_media', 'baja', 8, 32, true, 'minima', array['crecimiento detenido', 'hojas blandas'], '[{"failure":"exceso_riego","severity":"alta"}]'::jsonb),
  ('floracion_interior', 'Floracion interior', 'top_2cm_seco', 'brillante_indirecta', 'media', 10, 28, true, 'crecimiento_activo', array['botones caen', 'hojas amarillas'], '[{"failure":"cambios_bruscos_luz_temp","severity":"media"}]'::jsonb),
  ('comestible_aromatica', 'Comestibles y aromaticas', 'top_2cm_seco', 'sol_directo_suave', 'media', 5, 32, true, 'crecimiento_activo', array['marchitez rapida', 'hojas palidas'], '[{"failure":"falta_luz","severity":"alta"},{"failure":"falta_agua","severity":"media"}]'::jsonb)
on conflict (key) do update set
  name = excluded.name,
  soil_moisture_rule = excluded.soil_moisture_rule,
  light_category = excluded.light_category,
  target_humidity = excluded.target_humidity,
  temp_min_safe_c = excluded.temp_min_safe_c,
  temp_max_comfort_c = excluded.temp_max_comfort_c,
  drainage_required = excluded.drainage_required,
  fertilization_season = excluded.fertilization_season,
  warning_signs = excluded.warning_signs,
  typical_failures = excluded.typical_failures,
  updated_at = now();

create or replace view public.plant_state_vectors_v1
with (security_invoker = true)
as
select
  p.id as plant_id,
  p.owner_id,
  p.garden_id,
  sc.species_key,
  ca.key as care_archetype_key,
  p.health_state,
  p.health_score,
  p.confirmed_context,
  p.inferred_context,
  p.current_care_plan,
  p.last_watered_at,
  p.last_observed_at,
  latest_event.id as latest_event_id,
  latest_event.event_type as latest_event_type,
  latest_event.event_at as latest_event_at,
  latest_diagnosis.risk as latest_risk,
  latest_diagnosis.symptoms_observed as latest_symptoms,
  latest_diagnosis.probable_causes as latest_probable_causes,
  latest_environment.weather_condition as latest_weather_condition
from public.plants p
left join public.species_catalog sc on sc.id = p.species_id
left join public.care_archetypes ca on ca.id = sc.care_archetype_id
left join lateral (
  select e.id, e.event_type, e.event_at
  from public.plant_events e
  where e.plant_id = p.id
  order by e.event_at desc
  limit 1
) latest_event on true
left join lateral (
  select d.risk, d.symptoms_observed, d.probable_causes
  from public.diagnoses d
  where d.plant_id = p.id
  order by d.created_at desc
  limit 1
) latest_diagnosis on true
left join lateral (
  select el.weather_condition
  from public.environmental_logs el
  where el.plant_id = p.id
  order by el.logged_at desc
  limit 1
) latest_environment on true;
