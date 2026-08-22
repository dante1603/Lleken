import { describe, expect, it } from 'vitest';
import { deriveActiveCareGuards } from '../careGuards';
import type { ProvenancedCarePlan } from '../carePlanProvenance';

const HOUR = 60 * 60 * 1000;
const now = 30 * HOUR;

function carePlan(overrides: Partial<ProvenancedCarePlan> = {}): ProvenancedCarePlan {
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

describe('deriveActiveCareGuards', () => {
  it('creates a cold guard only with fresh weather and confirmed outdoor context', () => {
    const guards = deriveActiveCareGuards({
      carePlan: carePlan(),
      weather: { temp_min: 5 },
      weatherObservedAt: now - HOUR,
      confirmedContext: { ubicacion_tipo: 'exterior' },
      now,
    });

    expect(guards).toHaveLength(1);
    expect(guards[0]).toMatchObject({
      type: 'block_water',
      reason: 'cold_exposure',
      context: 'exterior',
      provenance: { baseline: 'explicit_plan', context: 'user_confirmed', environment: 'external' },
    });
  });

  it('does not treat exterior weather as an indoor microclimate oracle', () => {
    expect(deriveActiveCareGuards({
      carePlan: carePlan(),
      weather: { temp_min: 5, lluvia: 20 },
      weatherObservedAt: now - HOUR,
      confirmedContext: { ubicacion_tipo: 'interior', maceta_con_drenaje: false },
      now,
    })).toEqual([]);
  });

  it('does not activate guards from stale environmental data', () => {
    expect(deriveActiveCareGuards({
      carePlan: carePlan(),
      weather: { temp_min: 5, lluvia: 20 },
      weatherObservedAt: now - 25 * HOUR,
      confirmedContext: { ubicacion_tipo: 'exterior', maceta_con_drenaje: false },
      now,
    })).toEqual([]);
  });

  it('does not activate a factual guard from default-imputed baseline values', () => {
    expect(deriveActiveCareGuards({
      carePlan: carePlan({
        field_provenance: {
          regla_humedad_sustrato: 'default_imputed',
          temp_min_segura_c: 'default_imputed',
          drenaje_requerido: 'default_imputed',
        },
      }),
      weather: { temp_min: 5, lluvia: 20 },
      weatherObservedAt: now - HOUR,
      confirmedContext: { ubicacion_tipo: 'exterior', maceta_con_drenaje: false },
      now,
    })).toEqual([]);
  });

  it('blocks on rain only when exposure and drainage conflict are both confirmed', () => {
    const guards = deriveActiveCareGuards({
      carePlan: carePlan(),
      weather: { lluvia: 12 },
      weatherObservedAt: now - HOUR,
      confirmedContext: { ubicacion_tipo: 'balcon', maceta_con_drenaje: false },
      now,
    });

    expect(guards).toHaveLength(1);
    expect(guards[0]).toMatchObject({ reason: 'rain_drainage_conflict', context: 'balcon' });
  });
});
