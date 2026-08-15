import type { SoilMoistureRule } from '../types';
import type { Provenance } from './provenance';

export type MoistureObservationValue = 'dry' | 'wet' | 'not_sure';

export interface MoistureObservation {
  value: MoistureObservationValue;
  observedAt: number;
  provenance: Extract<Provenance, 'observed'>;
  soilRuleUsed?: SoilMoistureRule;
}

export interface CareRecommendation {
  type: 'recommendation';
  action: 'water' | 'wait';
  reason: 'dry_matches_rule' | 'still_wet';
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
export function evaluateMoistureDecision(observation: MoistureObservation): MoistureDecision {
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

  return {
    type: 'recommendation',
    action: 'water',
    reason: 'dry_matches_rule',
    explanation: 'El sustrato cumple la regla de secado definida para esta planta. Puedes regar.',
  };
}
