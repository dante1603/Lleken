-- Cover foreign keys reported by Supabase performance advisors.

create index if not exists species_catalog_care_archetype_id_idx on public.species_catalog(care_archetype_id);
create index if not exists plants_species_id_idx on public.plants(species_id);

create index if not exists plant_events_garden_id_idx on public.plant_events(garden_id);
create index if not exists plant_events_created_by_idx on public.plant_events(created_by);

create index if not exists plant_media_event_id_idx on public.plant_media(event_id);
create index if not exists plant_media_created_by_idx on public.plant_media(created_by);

create index if not exists environmental_logs_event_id_idx on public.environmental_logs(event_id);
create index if not exists environmental_logs_garden_id_idx on public.environmental_logs(garden_id);
create index if not exists environmental_logs_plant_id_idx on public.environmental_logs(plant_id);

create index if not exists ai_analyses_event_id_idx on public.ai_analyses(event_id);
create index if not exists ai_analyses_media_id_idx on public.ai_analyses(media_id);

create index if not exists diagnoses_event_id_idx on public.diagnoses(event_id);
create index if not exists diagnoses_ai_analysis_id_idx on public.diagnoses(ai_analysis_id);

create index if not exists recommendations_diagnosis_id_idx on public.recommendations(diagnosis_id);
create index if not exists recommendations_event_id_idx on public.recommendations(event_id);

create index if not exists recommendation_outcomes_recommendation_id_idx on public.recommendation_outcomes(recommendation_id);
create index if not exists recommendation_outcomes_plant_id_idx on public.recommendation_outcomes(plant_id);
create index if not exists recommendation_outcomes_observed_event_id_idx on public.recommendation_outcomes(observed_event_id);
create index if not exists recommendation_outcomes_observed_diagnosis_id_idx on public.recommendation_outcomes(observed_diagnosis_id);
