import type { CarePlan, GeneralInfo } from '../types';
import { findPlantKnowledgeByKey, findPlantKnowledgeByName } from './plantKnowledge';
import type { PlantKnowledgeEntry } from './plantKnowledge';
import { supabase } from './supabase';

export type SpeciesKnowledgeSource = 'reviewed' | 'static_catalog' | 'ai_generated';

export type SpeciesCareBasis =
  | 'reviewed_species'
  | 'static_species'
  | 'ai_species'
  | 'care_archetype'
  | 'unknown';

export interface ResolvedSpeciesKnowledge {
  id: string;
  scientificName: string;
  commonNames: string[];
  family?: string;
  info: GeneralInfo;
  care: CarePlan;
  source: SpeciesKnowledgeSource;
  confidence: 'alta' | 'media' | 'baja';
  careBasis: SpeciesCareBasis;
}

export interface CareArchetypeRow {
  key?: CarePlan['arquetipo_cuidado'] | null;
  soil_moisture_rule?: CarePlan['regla_humedad_sustrato'] | null;
  light_category?: CarePlan['luz_categoria'] | null;
  target_humidity?: CarePlan['humedad_objetivo'] | null;
  temp_min_safe_c?: number | null;
  temp_max_comfort_c?: number | null;
  drainage_required?: boolean | null;
  fertilization_season?: CarePlan['fertilizacion_temporada'] | null;
  warning_signs?: string[] | null;
}

export interface SpeciesCatalogRow {
  id: string;
  species_key: string;
  scientific_name: string;
  common_names?: string[] | null;
  family?: string | null;
  knowledge_source?: SpeciesKnowledgeSource | null;
  confidence?: ResolvedSpeciesKnowledge['confidence'] | null;
  source_payload?: {
    info_general?: GeneralInfo;
    care?: CarePlan;
  } | null;
  care_archetypes?: CareArchetypeRow | CareArchetypeRow[] | null;
}

function firstArchetype(value?: CareArchetypeRow | CareArchetypeRow[] | null) {
  return Array.isArray(value) ? value[0] : value || undefined;
}

function normalizeSpeciesText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function rowMatchesSpeciesKey(row: SpeciesCatalogRow, speciesKey: string) {
  const target = normalizeSpeciesText(speciesKey).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const names = [row.species_key, row.scientific_name, ...(row.common_names || [])];

  return names.some((name) => {
    const normalized = normalizeSpeciesText(name);
    const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return normalized === target || slug === target;
  });
}

export function hasDefinedValues(object?: object | null) {
  return Object.values(object || {}).some((value) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

function mergeDefined<T extends object>(...sources: Array<T | null | undefined>): T {
  return sources.reduce<T>((merged, source) => {
    for (const [key, value] of Object.entries(source || {})) {
      if (value !== undefined && value !== null) Object.assign(merged, { [key]: value });
    }
    return merged;
  }, {} as T);
}

export function mapArchetypeCare(archetype?: CareArchetypeRow): CarePlan {
  if (!archetype) return {};

  return mergeDefined<CarePlan>({
    arquetipo_cuidado: archetype.key || undefined,
    regla_humedad_sustrato: archetype.soil_moisture_rule || undefined,
    luz_categoria: archetype.light_category || undefined,
    humedad_objetivo: archetype.target_humidity || undefined,
    temp_min_segura_c: archetype.temp_min_safe_c ?? undefined,
    temp_max_confort_c: archetype.temp_max_comfort_c ?? undefined,
    drenaje_requerido: archetype.drainage_required ?? undefined,
    fertilizacion_temporada: archetype.fertilization_season || undefined,
    senales_alerta: archetype.warning_signs || undefined,
  });
}

function resolvedStaticKnowledge(entry: PlantKnowledgeEntry): ResolvedSpeciesKnowledge {
  return {
    id: entry.id,
    scientificName: entry.scientificName,
    commonNames: entry.commonNames,
    family: entry.family,
    info: entry.info,
    care: entry.care,
    source: 'static_catalog',
    confidence: 'alta',
    careBasis: 'static_species',
  };
}

export function resolveSpeciesKnowledgeSources(
  staticEntry?: PlantKnowledgeEntry | null,
  catalogEntry?: SpeciesCatalogRow | null,
): ResolvedSpeciesKnowledge | null {
  if (!catalogEntry) return staticEntry ? resolvedStaticKnowledge(staticEntry) : null;

  const archetypeCare = mapArchetypeCare(firstArchetype(catalogEntry.care_archetypes));
  const explicitInfo = catalogEntry.source_payload?.info_general || {};
  const explicitCare = catalogEntry.source_payload?.care || {};
  const hasExplicitCare = hasDefinedValues(explicitCare);
  const isReviewed = catalogEntry.knowledge_source === 'reviewed';

  if (!isReviewed && staticEntry) return resolvedStaticKnowledge(staticEntry);

  const source: SpeciesKnowledgeSource = isReviewed ? 'reviewed' : catalogEntry.knowledge_source || 'ai_generated';
  const staticCare = staticEntry?.care || {};
  const care = mergeDefined<CarePlan>(archetypeCare, staticCare, explicitCare);
  const careBasis: SpeciesCareBasis = hasExplicitCare
    ? source === 'reviewed'
      ? 'reviewed_species'
      : source === 'static_catalog'
        ? 'static_species'
        : 'ai_species'
    : staticEntry
      ? 'static_species'
      : hasDefinedValues(archetypeCare)
        ? 'care_archetype'
        : 'unknown';

  return {
    id: catalogEntry.species_key,
    scientificName: catalogEntry.scientific_name || staticEntry?.scientificName || catalogEntry.species_key,
    commonNames: catalogEntry.common_names?.length ? catalogEntry.common_names : staticEntry?.commonNames || [],
    family: catalogEntry.family || staticEntry?.family,
    info: mergeDefined<GeneralInfo>(staticEntry?.info, explicitInfo),
    care,
    source,
    confidence: catalogEntry.confidence || (source === 'ai_generated' ? 'media' : 'alta'),
    careBasis,
  };
}

async function loadSpeciesCatalogRow(speciesKey: string): Promise<SpeciesCatalogRow | null> {
  const selectSpeciesCatalog = `
    id,
    species_key,
    scientific_name,
    common_names,
    family,
    knowledge_source,
    confidence,
    source_payload,
    care_archetypes (
      key,
      soil_moisture_rule,
      light_category,
      target_humidity,
      temp_min_safe_c,
      temp_max_comfort_c,
      drainage_required,
      fertilization_season,
      warning_signs
    )
  `;

  const { data, error } = await supabase
    .from('species_catalog')
    .select(selectSpeciesCatalog)
    .eq('species_key', speciesKey)
    .maybeSingle();

  if (error) throw error;

  let row = data as SpeciesCatalogRow | null;
  if (row) return row;

  const { data: catalogRows, error: catalogError } = await supabase
    .from('species_catalog')
    .select(selectSpeciesCatalog)
    .limit(500);

  if (catalogError) throw catalogError;

  row = ((catalogRows || []) as SpeciesCatalogRow[]).find((candidate) => rowMatchesSpeciesKey(candidate, speciesKey)) || null;
  return row;
}

export async function getResolvedSpeciesKnowledge(speciesKey?: string): Promise<ResolvedSpeciesKnowledge | null> {
  if (!speciesKey) return null;

  const staticEntry = findPlantKnowledgeByKey(speciesKey) || findPlantKnowledgeByName(speciesKey)?.entry;

  try {
    const catalogEntry = await loadSpeciesCatalogRow(speciesKey);
    return resolveSpeciesKnowledgeSources(staticEntry, catalogEntry);
  } catch (error) {
    console.warn('No se pudo cargar ficha de especie desde Supabase.', error);
    return staticEntry ? resolvedStaticKnowledge(staticEntry) : null;
  }
}
