import type { CarePlan } from '../types';
import type { Provenance } from './provenance';

export type CarePlanTrackedField =
  | 'regla_humedad_sustrato'
  | 'temp_min_segura_c'
  | 'temp_max_confort_c'
  | 'drenaje_requerido';

/**
 * `explicit_plan` means the field was present at the care-plan boundary, but
 * this focused patch does not claim a more specific upstream source.
 */
export type CarePlanFieldSource = Provenance | 'explicit_plan';

export type CarePlanFieldProvenance = Partial<Record<CarePlanTrackedField, CarePlanFieldSource>>;

/** Runtime-compatible extension stored inside current_care_plan JSONB. */
export type ProvenancedCarePlan = CarePlan & {
  field_provenance?: CarePlanFieldProvenance;
};

const CARE_FIELD_SOURCES: readonly CarePlanFieldSource[] = [
  'user_confirmed',
  'observed',
  'ai_inferred',
  'external',
  'default_imputed',
  'unknown',
  'explicit_plan',
];

export function asCarePlanFieldSource(value: unknown): CarePlanFieldSource | undefined {
  return CARE_FIELD_SOURCES.includes(value as CarePlanFieldSource)
    ? value as CarePlanFieldSource
    : undefined;
}

export function getCarePlanFieldProvenance(
  plan: CarePlan | undefined,
  field: CarePlanTrackedField,
): CarePlanFieldSource {
  if (!plan) return 'unknown';
  const provenance = (plan as ProvenancedCarePlan).field_provenance?.[field];
  return asCarePlanFieldSource(provenance) || 'unknown';
}

/** Missing/defaulted knowledge may guide conservative copy, but not a watering order. */
export function isDecisionUsableProvenance(provenance: CarePlanFieldSource | undefined) {
  return provenance !== undefined
    && provenance !== 'default_imputed'
    && provenance !== 'unknown';
}
