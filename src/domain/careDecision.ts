import type { SoilMoistureRule } from '../types';
import type { Provenance } from './provenance';
import {
  isDecisionUsableProvenance,
  type CarePlanFieldSource,
} from './carePlanProvenance';

export type MoistureObservationValue = 'dry' | 'wet' | 'not_sure';

export interface MoistureObservation {
  value: MoistureObservationValue;
  observedAt: number;
  provenance: Extract<Provenance, 'observed'>;
  soilRuleUsed?: SoilMoistureRule;
  /** Guarded CARE-02 callers always set this. Omission exists only for the legacy plants.ts seam. */
  soilRuleProvenance?: CarePlanFieldSource;
}

export type ActiveCareGuardReason = 'cold_exposure' | 'rain_drainage_conflict';

export interface ActiveCareGuard {
  type: 'block_water';
  reason: ActiveCareGuardReason;
  observedAt: number;
  context: 'balcon' | 'exterior';
  provenance: {
    baseline: CarePlanFieldSource;
    context: Extract<Provenance, 'user_confirmed'>;
    environment: Extract<Provenance, 'external'>;
  };
  explanation: string;
}

export interface CareRecommendation {
  type: 'recommendation';
  action: 'water' | 'wait';
  reason: 'dry_matches_rule' | 'still_wet' | 'active_guard';
  explanation: string;
}

export interface InformationRequest {
  type: 'information_request';
  request: 'check_moisture_again';
  reason: 'care_rule_unknown' | 'observation_uncertain';
  explanation: string;
  status: 'pending';
}

export type MoistureDecision = CareRecommendation | InformationRequest;

/** Turns a physical observation into guidance; it never records an action. */
export function evaluateMoistureDecision(
  observation: MoistureObservation,
  activeGuards: readonly ActiveCareGuard[] = [],
): MoistureDecision {
  if (observation.value === 'wet') {
    return {
      type: 'recommendation',
      action: 'wait',
      reason: 'still_wet',
      explanation: 'El sustrato todavía conserva humedad; el calendario no justifica agregar agua.',
    };
  }

  if (observation.value === 'not_sure') {
    return {
      type: 'information_request',
      request: 'check_moisture_again',
      reason: 'observation_uncertain',
      explanation: 'Necesitamos una comprobación más clara antes de decidir entre regar y esperar.',
      status: 'pending',
    };
  }

  if (!observation.soilRuleUsed) {
    return {
      type: 'information_request',
      request: 'check_moisture_again',
      reason: 'care_rule_unknown',
      explanation: 'El sustrato parece seco, pero falta una regla de humedad para convertirlo en una recomendación de riego.',
      status: 'pending',
    };
  }

  // The legacy plants.ts writer predates field provenance and is no longer used
  // by FollowUpCamera. Keep its tested behavior until that shared seam can be
  // retired without colliding with PR #38. New CARE-02 persistence always sends
  // an explicit source, including `unknown` when legacy data lacks metadata.
  const decisionProvenance = observation.soilRuleProvenance ?? 'explicit_plan';
  if (!isDecisionUsableProvenance(decisionProvenance)) {
    return {
      type: 'information_request',
      request: 'check_moisture_again',
      reason: 'care_rule_unknown',
      explanation: 'El sustrato parece seco, pero la regla de humedad no tiene procedencia suficiente para recomendar riego con seguridad.',
      status: 'pending',
    };
  }

  const blockingGuard = activeGuards.find((guard) => guard.type === 'block_water');
  if (blockingGuard) {
    return {
      type: 'recommendation',
      action: 'wait',
      reason: 'active_guard',
      explanation: `El sustrato está seco según la regla, pero hay un conflicto activo: ${blockingGuard.explanation}`,
    };
  }

  return {
    type: 'recommendation',
    action: 'water',
    reason: 'dry_matches_rule',
    explanation: 'El sustrato cumple la regla de secado definida para esta planta. Puedes regar.',
  };
}
