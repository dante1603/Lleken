import type { CarePlan, SoilMoistureRule } from '../types';
import { normalizeCarePlan } from '../lib/aiSchema';
import type { Provenance } from './provenance';
import {
  asCarePlanFieldSource,
  type CarePlanFieldSource,
  type CarePlanTrackedField,
  type ProvenancedCarePlan,
} from './carePlanProvenance';

const SOIL_RULES: readonly SoilMoistureRule[] = [
  'top_2cm_seco',
  'top_5cm_seco',
  'secar_completo',
  'humedad_pareja',
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function hasFiniteNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed);
}

function hasBoolean(value: unknown) {
  return typeof value === 'boolean' || value === 'true' || value === 'false';
}

function explicitTrackedField(data: Record<string, unknown>, field: CarePlanTrackedField) {
  if (field === 'regla_humedad_sustrato') {
    return SOIL_RULES.includes(data.regla_humedad_sustrato as SoilMoistureRule);
  }
  if (field === 'drenaje_requerido') return hasBoolean(data.drenaje_requerido);
  return hasFiniteNumber(data[field]);
}

function fieldProvenance(
  data: Record<string, unknown>,
  field: CarePlanTrackedField,
  source: Provenance,
  normalizedValueExists: boolean,
): CarePlanFieldSource | undefined {
  if (!normalizedValueExists) return undefined;

  const existing = asRecord(data.field_provenance);
  const persisted = asCarePlanFieldSource(existing[field]);
  if (persisted) return persisted;

  return explicitTrackedField(data, field) ? source : 'default_imputed';
}

/**
 * Re-normalizes persisted/API plans without upgrading legacy values that lack
 * source metadata. New server plans preserve their metadata before reaching it.
 */
export function normalizeCarePlanWithProvenance(
  value: unknown,
  source: Provenance = 'unknown',
): ProvenancedCarePlan {
  const data = asRecord(value);
  const normalized: CarePlan = normalizeCarePlan(value);

  return {
    ...normalized,
    field_provenance: {
      regla_humedad_sustrato: fieldProvenance(
        data,
        'regla_humedad_sustrato',
        source,
        normalized.regla_humedad_sustrato !== undefined,
      ),
      temp_min_segura_c: fieldProvenance(
        data,
        'temp_min_segura_c',
        source,
        normalized.temp_min_segura_c !== undefined,
      ),
      temp_max_confort_c: fieldProvenance(
        data,
        'temp_max_confort_c',
        source,
        normalized.temp_max_confort_c !== undefined,
      ),
      drenaje_requerido: fieldProvenance(
        data,
        'drenaje_requerido',
        source,
        normalized.drenaje_requerido !== undefined,
      ),
    },
  };
}
