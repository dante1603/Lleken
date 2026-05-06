import type { CarePlan, GeneralInfo } from '../types';
import { supabase } from './supabase';
import type { PlantKnowledgeEntry } from './plantKnowledge';

interface CareArchetypeRow {
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

interface SpeciesCatalogRow {
  id: string;
  species_key: string;
  scientific_name: string;
  common_names?: string[] | null;
  family?: string | null;
  source_payload?: {
    info_general?: GeneralInfo;
  } | null;
  care_archetypes?: CareArchetypeRow | CareArchetypeRow[] | null;
}

interface RepresentativePlantRow {
  current_care_plan?: CarePlan | null;
}

const DEFAULT_INFO: Required<GeneralInfo> = {
  descripcion: 'Ficha creada automaticamente desde una especie registrada por la comunidad de Lleken.',
  origen: 'Origen botanico por confirmar.',
  curiosidades: ['Esta guia crecera a medida que se agreguen mas plantas y revisiones para la especie.'],
  usos_comunes: ['Cultivo registrado en Lleken'],
  condiciones_ideales: 'Usa esta ficha como guia inicial y ajusta segun el estado real de tu planta.',
};

const DEFAULT_CARE: Required<CarePlan> = {
  riego_frecuencia_dias: 7,
  instrucciones: 'Revisa el sustrato antes de regar y evita mantenerlo encharcado.',
  alertas_clima: ['Ajusta el riego con calor, frio, lluvia o baja luz.'],
  riego_ajuste_clima: 'Con calor revisa antes; con frio o poca luz espacia los riegos.',
  exposicion_sol: 'Luz abundante y estable, evitando cambios bruscos.',
  seguimiento_foto_dias: 10,
  tareas_adicionales: ['Observar hojas, tallos y sustrato una vez por semana'],
  arquetipo_cuidado: 'comestible_aromatica',
  regla_humedad_sustrato: 'top_2cm_seco',
  luz_categoria: 'brillante_indirecta',
  humedad_objetivo: 'media',
  temp_min_segura_c: 8,
  temp_max_confort_c: 30,
  drenaje_requerido: true,
  fertilizacion_temporada: 'crecimiento_activo',
  toxicidad: {},
  senales_alerta: ['Marchitez o decaimiento', 'Hojas amarillas', 'Manchas o plagas visibles'],
};

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
  const names = [
    row.species_key,
    row.scientific_name,
    ...(row.common_names || []),
  ];

  return names.some((name) => {
    const normalized = normalizeSpeciesText(name);
    const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return normalized === target || slug === target;
  });
}

function mergeInfo(row: SpeciesCatalogRow): Required<GeneralInfo> {
  const info = row.source_payload?.info_general || {};

  return {
    descripcion: info.descripcion || DEFAULT_INFO.descripcion,
    origen: info.origen || DEFAULT_INFO.origen,
    curiosidades: info.curiosidades?.length ? info.curiosidades : DEFAULT_INFO.curiosidades,
    usos_comunes: info.usos_comunes?.length ? info.usos_comunes : row.common_names?.length ? row.common_names : DEFAULT_INFO.usos_comunes,
    condiciones_ideales: info.condiciones_ideales || DEFAULT_INFO.condiciones_ideales,
  };
}

function mergeCare(archetype?: CareArchetypeRow, representativeCare?: CarePlan | null): Required<CarePlan> {
  return {
    ...DEFAULT_CARE,
    arquetipo_cuidado: archetype?.key || representativeCare?.arquetipo_cuidado || DEFAULT_CARE.arquetipo_cuidado,
    regla_humedad_sustrato: archetype?.soil_moisture_rule || representativeCare?.regla_humedad_sustrato || DEFAULT_CARE.regla_humedad_sustrato,
    luz_categoria: archetype?.light_category || representativeCare?.luz_categoria || DEFAULT_CARE.luz_categoria,
    humedad_objetivo: archetype?.target_humidity || representativeCare?.humedad_objetivo || DEFAULT_CARE.humedad_objetivo,
    temp_min_segura_c: archetype?.temp_min_safe_c ?? representativeCare?.temp_min_segura_c ?? DEFAULT_CARE.temp_min_segura_c,
    temp_max_confort_c: archetype?.temp_max_comfort_c ?? representativeCare?.temp_max_confort_c ?? DEFAULT_CARE.temp_max_confort_c,
    drenaje_requerido: archetype?.drainage_required ?? representativeCare?.drenaje_requerido ?? DEFAULT_CARE.drenaje_requerido,
    fertilizacion_temporada: archetype?.fertilization_season || representativeCare?.fertilizacion_temporada || DEFAULT_CARE.fertilizacion_temporada,
    senales_alerta: archetype?.warning_signs?.length ? archetype.warning_signs : representativeCare?.senales_alerta?.length ? representativeCare.senales_alerta : DEFAULT_CARE.senales_alerta,
    riego_frecuencia_dias: representativeCare?.riego_frecuencia_dias || DEFAULT_CARE.riego_frecuencia_dias,
    instrucciones: representativeCare?.instrucciones || DEFAULT_CARE.instrucciones,
    alertas_clima: representativeCare?.alertas_clima?.length ? representativeCare.alertas_clima : DEFAULT_CARE.alertas_clima,
    riego_ajuste_clima: representativeCare?.riego_ajuste_clima || DEFAULT_CARE.riego_ajuste_clima,
    exposicion_sol: representativeCare?.exposicion_sol || DEFAULT_CARE.exposicion_sol,
    seguimiento_foto_dias: representativeCare?.seguimiento_foto_dias || DEFAULT_CARE.seguimiento_foto_dias,
    tareas_adicionales: representativeCare?.tareas_adicionales?.length ? representativeCare.tareas_adicionales : DEFAULT_CARE.tareas_adicionales,
    toxicidad: representativeCare?.toxicidad || DEFAULT_CARE.toxicidad,
  };
}

async function loadRepresentativeCare(speciesId: string, plantId?: string | null) {
  const baseQuery = supabase
    .from('plants')
    .select('current_care_plan')
    .eq('species_id', speciesId)
    .limit(1);

  const query = plantId ? baseQuery.eq('id', plantId) : baseQuery.order('created_at', { ascending: false });
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.warn('No se pudo cargar plan representativo de la especie.', error);
    return null;
  }

  return (data as RepresentativePlantRow | null)?.current_care_plan || null;
}

export async function getSpeciesCatalogEntry(speciesKey?: string, plantId?: string | null): Promise<PlantKnowledgeEntry | null> {
  if (!speciesKey) return null;

  const selectSpeciesCatalog = `
    id,
    species_key,
    scientific_name,
    common_names,
    family,
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

  if (error) {
    console.warn('No se pudo cargar ficha de especie desde Supabase.', error);
    return null;
  }

  let row = data as SpeciesCatalogRow | null;

  if (!row) {
    const { data: catalogRows, error: catalogError } = await supabase
      .from('species_catalog')
      .select(selectSpeciesCatalog)
      .limit(500);

    if (catalogError) {
      console.warn('No se pudo buscar especies equivalentes desde Supabase.', catalogError);
      return null;
    }

    row = ((catalogRows || []) as SpeciesCatalogRow[]).find((candidate) => rowMatchesSpeciesKey(candidate, speciesKey)) || null;
  }

  if (!row) return null;

  const representativeCare = await loadRepresentativeCare(row.id, plantId);
  const archetype = firstArchetype(row.care_archetypes);

  return {
    id: row.species_key,
    scientificName: row.scientific_name,
    commonNames: row.common_names?.length ? row.common_names : [row.scientific_name],
    family: row.family || 'Por confirmar',
    info: mergeInfo(row),
    care: mergeCare(archetype, representativeCare),
  };
}
