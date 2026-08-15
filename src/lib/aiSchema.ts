import type {
  CareArchetype,
  CarePlan,
  FertilizationSeason,
  LightCategory,
  WeatherConditions,
  SoilMoistureRule,
  TargetHumidity,
  Plant,
} from '../types';
import type { FollowUpAssessment } from '../domain/assessment';
import type { IdentificationProposal } from '../domain/identification';
import type { InferredPlantContext } from '../domain/context';

const PLANT_STATES = ['saludable', 'necesita_atencion', 'en_riesgo'] as const;
const CARE_ARCHETYPES: CareArchetype[] = [
  'suculenta_cactus',
  'aroide_tropical',
  'alta_humedad',
  'baja_luz_resistente',
  'floracion_interior',
  'comestible_aromatica',
];
const SOIL_RULES: SoilMoistureRule[] = ['top_2cm_seco', 'top_5cm_seco', 'secar_completo', 'humedad_pareja'];
const LIGHT_CATEGORIES: LightCategory[] = [
  'baja_media',
  'brillante_indirecta',
  'media_alta',
  'sol_directo_suave',
  'sol_directo_alto',
];
const TARGET_HUMIDITIES: TargetHumidity[] = ['baja', 'media', 'alta'];
const FERTILIZATION_SEASONS: FertilizationSeason[] = ['crecimiento_activo', 'minima', 'no_recomendada'];
const RISKS = ['bajo', 'medio', 'alto'] as const;

export interface GenerateCarePlanInput {
  plantData: Partial<Plant>;
  city: string;
  weatherSummary: string;
  weather?: WeatherConditions;
  contextSummary?: string;
}

export interface FollowUpAnalysisInput {
  plant: Plant;
  image: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function asNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function asOptionalNumber(value: unknown, min: number, max: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return undefined;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function asOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function asNullableEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return allowed.includes(value as T) ? value as T : null;
}

function asNullableBoolean(value: unknown): boolean | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function asInferredContext(value: unknown): InferredPlantContext | undefined {
  const data = asRecord(value);
  if (Object.keys(data).length === 0) return undefined;

  return {
    ubicacion_tipo: asNullableEnum(data.ubicacion_tipo, ['interior', 'balcon', 'exterior'] as const),
    maceta_con_drenaje: asNullableBoolean(data.maceta_con_drenaje),
    tamano_maceta: asNullableEnum(data.tamano_maceta, ['pequena', 'mediana', 'grande'] as const),
    luz_usuario: asNullableEnum(data.luz_usuario, ['baja', 'media', 'brillante_indirecta', 'sol_directo'] as const),
  };
}

function asKnowledgeSource(value: unknown): IdentificationProposal['knowledge_source'] | undefined {
  const data = asRecord(value);
  const source = data.source === 'static_catalog' || data.source === 'ai_generated'
    ? data.source
    : undefined;

  if (!source) return undefined;

  return {
    source,
    catalogId: asString(data.catalogId) || undefined,
    catalogVersion: asString(data.catalogVersion) || undefined,
    matchedBy: data.matchedBy
      ? asEnum(data.matchedBy, ['scientific_name', 'common_name', 'alias'] as const, 'scientific_name')
      : undefined,
    confidence: asEnum(data.confidence, ['alta', 'media', 'baja'] as const, source === 'static_catalog' ? 'alta' : 'media'),
    updatedAt: asString(data.updatedAt) || undefined,
  };
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

function asOptionalEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? value as T : undefined;
}

function asPlantState(value: unknown): IdentificationProposal['estado'] | undefined {
  return PLANT_STATES.includes(value as any)
    ? value as NonNullable<IdentificationProposal['estado']>
    : undefined;
}

function defaultSoilRule(archetype: CareArchetype): SoilMoistureRule {
  if (archetype === 'suculenta_cactus' || archetype === 'baja_luz_resistente') return 'secar_completo';
  if (archetype === 'alta_humedad') return 'humedad_pareja';
  if (archetype === 'aroide_tropical') return 'top_5cm_seco';
  return 'top_2cm_seco';
}

function defaultLightCategory(archetype: CareArchetype): LightCategory {
  if (archetype === 'suculenta_cactus' || archetype === 'comestible_aromatica') return 'media_alta';
  if (archetype === 'baja_luz_resistente') return 'baja_media';
  return 'brillante_indirecta';
}

function defaultTargetHumidity(archetype: CareArchetype): TargetHumidity {
  if (archetype === 'alta_humedad') return 'alta';
  if (archetype === 'suculenta_cactus' || archetype === 'baja_luz_resistente') return 'baja';
  return 'media';
}

export function normalizePlantIdentification(value: unknown): IdentificationProposal {
  const data = asRecord(value);
  const info = asRecord(data.info_general);

  return {
    nombre_comun: asString(data.nombre_comun, 'Planta sin identificar'),
    nombre_cientifico: asString(data.nombre_cientifico, 'Especie no confirmada'),
    nombre_sugerido: asString(data.nombre_sugerido) || undefined,
    species_key: asString(data.species_key) || undefined,
    knowledge_source: asKnowledgeSource(data.knowledge_source),
    familia: asString(data.familia),
    estado: asPlantState(data.estado),
    puntuacion_salud: asOptionalNumber(data.puntuacion_salud, 0, 100),
    info_general: {
      descripcion: asString(info.descripcion, 'Aún no tenemos una descripción confiable para esta planta.'),
      origen: asString(info.origen),
      curiosidades: asStringArray(info.curiosidades),
      usos_comunes: asStringArray(info.usos_comunes),
      condiciones_ideales: asString(info.condiciones_ideales),
    },
    contexto_inferido: asInferredContext(data.contexto_inferido),
    provenance: 'ai_inferred',
  };
}

export function normalizeCarePlan(value: unknown): CarePlan {
  const data = asRecord(value);
  const toxicity = asRecord(data.toxicidad);
  const archetype = asOptionalEnum(data.arquetipo_cuidado, CARE_ARCHETYPES);
  const conservativeArchetype = archetype || 'aroide_tropical';

  return {
    riego_frecuencia_dias: asNumber(data.riego_frecuencia_dias, 5, 1, 30),
    instrucciones: asString(data.instrucciones, 'Revisa la humedad del sustrato antes de regar y ajusta según el clima local.'),
    alertas_clima: asStringArray(data.alertas_clima),
    riego_ajuste_clima: asString(data.riego_ajuste_clima, 'Reduce el riego en días fríos o lluviosos y aumenta la revisión en días calurosos.'),
    exposicion_sol: asString(data.exposicion_sol, 'Luz indirecta brillante.'),
    seguimiento_foto_dias: asNumber(data.seguimiento_foto_dias, 7, 1, 30),
    tareas_adicionales: asStringArray(data.tareas_adicionales),
    arquetipo_cuidado: archetype,
    regla_humedad_sustrato: asEnum(data.regla_humedad_sustrato, SOIL_RULES, defaultSoilRule(conservativeArchetype)),
    luz_categoria: asEnum(data.luz_categoria, LIGHT_CATEGORIES, defaultLightCategory(conservativeArchetype)),
    humedad_objetivo: asEnum(data.humedad_objetivo, TARGET_HUMIDITIES, defaultTargetHumidity(conservativeArchetype)),
    temp_min_segura_c: asOptionalNumber(data.temp_min_segura_c, -5, 25),
    temp_max_confort_c: asOptionalNumber(data.temp_max_confort_c, 15, 45),
    drenaje_requerido: asBoolean(data.drenaje_requerido, true),
    fertilizacion_temporada: asEnum(data.fertilizacion_temporada, FERTILIZATION_SEASONS, 'crecimiento_activo'),
    toxicidad: {
      humanos: asOptionalBoolean(toxicity.humanos),
      mascotas: asOptionalBoolean(toxicity.mascotas),
      irritante_piel: asOptionalBoolean(toxicity.irritante_piel),
    },
    senales_alerta: asStringArray(data.senales_alerta),
  };
}

export function normalizeFollowUpResult(value: unknown): FollowUpAssessment {
  const data = asRecord(value);

  return {
    estado: asPlantState(data.estado),
    puntuacion_salud: asOptionalNumber(data.puntuacion_salud, 0, 100),
    descripcion_estado: asString(data.descripcion_estado),
    observaciones: asString(data.observaciones, 'Seguimiento registrado.'),
    recomendacion_inmediata: asString(data.recomendacion_inmediata, 'Mantener observación y revisar humedad del sustrato.'),
    sintomas_observados: asStringArray(data.sintomas_observados),
    causas_probables: asStringArray(data.causas_probables),
    preguntas_de_confirmacion: asStringArray(data.preguntas_de_confirmacion),
    accion_segura_inmediata: asString(data.accion_segura_inmediata, asString(data.recomendacion_inmediata, 'Revisar humedad, drenaje y envases antes de aplicar tratamientos.')),
    riesgo: asOptionalEnum(data.riesgo, RISKS),
    provenance: 'ai_inferred',
  };
}

export function getAiErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('"code":429') || message.includes('credits are depleted')) {
    return 'La identificación con IA no está disponible porque los créditos de Gemini están agotados. Revisa la facturación del proyecto en AI Studio.';
  }

  if (message.includes('API key') || message.includes('Gemini API key')) {
    return 'No pudimos usar la IA porque falta o no es válida la clave de Gemini.';
  }

  return fallback;
}
