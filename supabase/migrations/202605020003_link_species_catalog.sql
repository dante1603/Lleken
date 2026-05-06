-- Allow the MVP client flow to create AI-generated species rows and link plants to them.
-- This keeps plants normalized now; later curation can move this write behind a backend service role.

drop policy if exists "species_catalog_insert_authenticated" on public.species_catalog;
drop policy if exists "species_catalog_update_generated_authenticated" on public.species_catalog;

create policy "species_catalog_insert_authenticated"
on public.species_catalog
for insert
to authenticated
with check (knowledge_source in ('static_catalog', 'ai_generated'));

create policy "species_catalog_update_generated_authenticated"
on public.species_catalog
for update
to authenticated
using (knowledge_source in ('static_catalog', 'ai_generated'))
with check (knowledge_source in ('static_catalog', 'ai_generated'));

insert into public.species_catalog (
  species_key,
  scientific_name,
  common_names,
  care_archetype_id,
  knowledge_source,
  confidence,
  source_payload
)
select
  'solanum-lycopersicum',
  'Solanum lycopersicum',
  array['Tomate'],
  ca.id,
  'ai_generated',
  'media',
  jsonb_build_object('seeded_from', 'plant_backfill')
from public.care_archetypes ca
where ca.key = 'comestible_aromatica'
on conflict (species_key) do update set
  scientific_name = excluded.scientific_name,
  common_names = excluded.common_names,
  care_archetype_id = coalesce(public.species_catalog.care_archetype_id, excluded.care_archetype_id),
  updated_at = now();

update public.plants p
set species_id = sc.id
from public.species_catalog sc
where p.species_id is null
  and sc.species_key = 'solanum-lycopersicum'
  and lower(p.scientific_name) = 'solanum lycopersicum';
