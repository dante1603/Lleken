-- Aggregate species monitoring for developer/admin surfaces.
-- Exposes counts and freshness without exposing individual private plant rows.

create schema if not exists private;

create or replace function private.get_species_monitor_data()
returns table (
  species_id uuid,
  species_key text,
  scientific_name text,
  common_names text[],
  family text,
  knowledge_source text,
  confidence text,
  created_at timestamptz,
  updated_at timestamptz,
  plant_count bigint,
  recent_plant_count bigint,
  latest_plant_created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    sc.id as species_id,
    sc.species_key,
    sc.scientific_name,
    sc.common_names,
    sc.family,
    sc.knowledge_source,
    sc.confidence,
    sc.created_at,
    sc.updated_at,
    count(p.id)::bigint as plant_count,
    count(p.id) filter (where p.created_at >= now() - interval '7 days')::bigint as recent_plant_count,
    max(p.created_at) as latest_plant_created_at
  from public.species_catalog sc
  left join public.plants p on p.species_id = sc.id
  group by sc.id
  order by max(p.created_at) desc nulls last, sc.created_at desc;
$$;

create or replace function public.get_species_monitor()
returns table (
  species_id uuid,
  species_key text,
  scientific_name text,
  common_names text[],
  family text,
  knowledge_source text,
  confidence text,
  created_at timestamptz,
  updated_at timestamptz,
  plant_count bigint,
  recent_plant_count bigint,
  latest_plant_created_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.get_species_monitor_data();
$$;

grant execute on function public.get_species_monitor() to authenticated;
