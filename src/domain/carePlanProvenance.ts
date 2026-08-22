import type { CarePlan } from '../types';
import type { Provenance } from './provenance';

export type CarePlanTrackedField =
  | 'regla_humedad_sustrato'
  | 'temp_min_segura_c'
  | 'temp_max_confort_c'
  | 'drenaje_requerido';

export type CarePlanFieldProvenance = Partial<Record<CarePlanTrackedField, Provenance>>;

/** Runtime-compatible extension stored inside current_care_plan JSONB. */
export type ProvenancedCarePlan = CarePlan & {
  field_provenance?: CarePlanFieldProvenance;
};

const PROVENANCE_VALUES: readonly Provenance[] = [
  'user_confirmed',
  'observed',
  'ai_inferred',
  'external',
  'default_imputed',
  'unknown',
];

export function asProvenance(value: unknown): Provenance | undefined {
  return PROVENANCE_VALUES.includes(value as Provenance) ? value as Provenance : undefined;
}

export function getCarePlanFieldProvenance(
  plan: CarePlan | undefined,
  field: CarePlanTrackedField,
): Provenance {
  if (!plan) return 'unknown';
  const provenance = (plan as ProvenancedCarePlan).field_provenance?.[field];
  return asProvenance(provenance) || 'unknown';
}

/** Missing/defaulted knowledge may guide conservative copy, but not a watering order. */
export function isDecisionUsableProvenance(provenance: Provenance | undefined) {
  return provenance !== undefined
    && provenance !== 'default_imputed'
    && provenance !== 'unknown';
}
