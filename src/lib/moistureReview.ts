import type { Plant } from '../types';
import { deriveActiveCareGuards } from '../domain/careGuards';
import {
  evaluateMoistureDecision,
  type CareRecommendation,
  type InformationRequest,
  type MoistureDecision,
  type MoistureObservation,
  type MoistureObservationValue,
} from '../domain/careDecision';
import {
  getCarePlanFieldProvenance,
  isDecisionUsableProvenance,
} from '../domain/carePlanProvenance';
import { supabase } from './supabase';

export interface SaveGuardedMoistureReviewInput {
  plant: Pick<Plant, 'id' | 'plan_cuidados' | 'clima_actual' | 'clima_observado_en' | 'contexto'>;
  uid: string;
  value: MoistureObservationValue;
  observedAt: number;
}

export interface SavedMoistureReview {
  observation: MoistureObservation;
  decision: MoistureDecision;
  observationEventId: string;
  decisionEventId: string;
}

function createId() {
  return crypto.randomUUID();
}

function requiredIsoTimestamp(value: number) {
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) throw new Error('Timestamp de humedad invalido.');
  return timestamp.toISOString();
}

function moistureObservationDescription(observation: MoistureObservation) {
  if (observation.value === 'dry') {
    if (!observation.soilRuleUsed) return 'Humedad: parece seco (sin regla definida)';
    return isDecisionUsableProvenance(observation.soilRuleProvenance)
      ? 'Humedad: seco según la regla'
      : 'Humedad: parece seco (regla sin procedencia suficiente)';
  }
  if (observation.value === 'wet') return 'Humedad: todavía húmedo';
  return 'Humedad: no estoy seguro';
}

/**
 * Persists physical evidence and its derived guidance together. It never
 * records watering automatically; that remains an explicit plant action.
 */
export async function saveGuardedMoistureReview(
  input: SaveGuardedMoistureReviewInput,
): Promise<SavedMoistureReview> {
  const observedAt = requiredIsoTimestamp(input.observedAt);
  const plan = input.plant.plan_cuidados;
  const soilRuleUsed = plan?.regla_humedad_sustrato;
  const soilRuleProvenance = soilRuleUsed
    ? getCarePlanFieldProvenance(plan, 'regla_humedad_sustrato')
    : undefined;
  const observation: MoistureObservation = {
    value: input.value,
    observedAt: input.observedAt,
    provenance: 'observed',
    soilRuleUsed,
    soilRuleProvenance,
  };
  const activeGuards = deriveActiveCareGuards({
    carePlan: plan,
    weather: input.plant.clima_actual,
    weatherObservedAt: input.plant.clima_observado_en,
    confirmedContext: input.plant.contexto,
    now: input.observedAt,
  });
  const decision = evaluateMoistureDecision(observation, activeGuards);
  const observationEventId = createId();
  const decisionEventId = createId();
  const decisionMetadata = decision.type === 'recommendation'
    ? {
      semanticType: 'care_recommendation' as const,
      careRecommendation: { ...decision, basedOnEventId: observationEventId },
    }
    : {
      semanticType: 'information_request' as const,
      informationRequest: { ...decision, basedOnEventId: observationEventId },
    };
  const decisionDescription = decision.type === 'recommendation'
    ? decision.action === 'water'
      ? 'Puedes regar tras esta observación'
      : 'Espera antes de volver a regar'
    : decision.explanation;

  const { error } = await supabase.from('plant_events').insert([
    {
      id: observationEventId,
      plant_id: input.plant.id,
      created_by: input.uid,
      event_type: 'manual_review',
      event_at: observedAt,
      user_comment: moistureObservationDescription(observation),
      metadata: { semanticType: 'moisture_observation', moistureObservation: observation },
    },
    {
      id: decisionEventId,
      plant_id: input.plant.id,
      created_by: input.uid,
      event_type: 'note',
      event_at: observedAt,
      user_comment: decisionDescription,
      metadata: decisionMetadata,
    },
  ]);

  if (error) throw error;
  return { observation, decision, observationEventId, decisionEventId };
}
