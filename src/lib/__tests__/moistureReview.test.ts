import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plant } from '../../types';
import type { ProvenancedCarePlan } from '../../domain/carePlanProvenance';
import { saveGuardedMoistureReview } from '../moistureReview';

const supabaseMock = vi.hoisted(() => {
  const calls: Array<{ table: string; payload: unknown }> = [];
  const insert = vi.fn(async (payload: unknown) => {
    calls.push({ table: 'plant_events', payload });
    return { data: null, error: null };
  });
  const from = vi.fn(() => ({ insert }));
  return {
    calls,
    insert,
    from,
    reset() {
      calls.length = 0;
      insert.mockClear();
      from.mockClear();
    },
  };
});

vi.mock('../supabase', () => ({
  supabase: { from: supabaseMock.from },
}));

function plant(plan: ProvenancedCarePlan, overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'plant-id',
    fecha_creacion: 0,
    plan_cuidados: plan,
    ...overrides,
  };
}

function explicitPlan(overrides: Partial<ProvenancedCarePlan> = {}): ProvenancedCarePlan {
  return {
    regla_humedad_sustrato: 'secar_completo',
    temp_min_segura_c: 10,
    drenaje_requerido: true,
    field_provenance: {
      regla_humedad_sustrato: 'explicit_plan',
      temp_min_segura_c: 'explicit_plan',
      drenaje_requerido: 'explicit_plan',
    },
    ...overrides,
  };
}

describe('saveGuardedMoistureReview', () => {
  beforeEach(() => {
    supabaseMock.reset();
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValueOnce('observation-event-id').mockReturnValueOnce('decision-event-id'),
    });
  });

  it('persists a normal dry decision as water and retains basedOnEventId', async () => {
    const result = await saveGuardedMoistureReview({
      plant: plant(explicitPlan()),
      uid: 'user-id',
      value: 'dry',
      observedAt: 1_000,
    });

    const rows = supabaseMock.calls[0].payload as Array<Record<string, any>>;
    expect(result.decision).toMatchObject({ type: 'recommendation', action: 'water' });
    expect(rows[0].metadata.moistureObservation).toMatchObject({
      value: 'dry',
      soilRuleUsed: 'secar_completo',
      soilRuleProvenance: 'explicit_plan',
    });
    expect(rows[1].metadata).toMatchObject({
      semanticType: 'care_recommendation',
      careRecommendation: { action: 'water', basedOnEventId: 'observation-event-id' },
    });
  });

  it('does not recommend water when the only rule is default-imputed', async () => {
    const result = await saveGuardedMoistureReview({
      plant: plant(explicitPlan({
        field_provenance: { regla_humedad_sustrato: 'default_imputed' },
      })),
      uid: 'user-id',
      value: 'dry',
      observedAt: 1_000,
    });

    expect(result.decision).toMatchObject({
      type: 'information_request', reason: 'care_rule_unknown',
    });
  });

  it('regresses the Echeveria contradiction: fresh confirmed cold exposure blocks water', async () => {
    const result = await saveGuardedMoistureReview({
      plant: plant(explicitPlan(), {
        contexto: { ubicacion_tipo: 'exterior' },
        clima_actual: { temp_min: 5 },
        clima_observado_en: 900,
      }),
      uid: 'user-id',
      value: 'dry',
      observedAt: 1_000,
    });

    const rows = supabaseMock.calls[0].payload as Array<Record<string, any>>;
    expect(result.decision).toMatchObject({
      type: 'recommendation', action: 'wait', reason: 'active_guard',
    });
    expect(rows[1].metadata).toMatchObject({
      semanticType: 'care_recommendation',
      careRecommendation: { action: 'wait', reason: 'active_guard', basedOnEventId: 'observation-event-id' },
    });
  });
});
