import { describe, expect, it } from 'vitest';
import { evaluateMoistureDecision, type ActiveCareGuard } from '../careDecision';

const observedAt = 1_000;

describe('evaluateMoistureDecision', () => {
  it('recommends waiting for wet substrate', () => {
    expect(evaluateMoistureDecision({ value: 'wet', observedAt, provenance: 'observed' })).toMatchObject({
      type: 'recommendation', action: 'wait', reason: 'still_wet',
    });
  });

  it('asks for a clearer check when uncertain', () => {
    expect(evaluateMoistureDecision({ value: 'not_sure', observedAt, provenance: 'observed' })).toMatchObject({
      type: 'information_request', request: 'check_moisture_again', reason: 'observation_uncertain',
    });
  });

  it.each(['top_2cm_seco', 'top_5cm_seco', 'secar_completo', 'humedad_pareja'] as const)(
    'recommends water when dry fulfils an explicit %s rule without active guards',
    (soilRuleUsed) => {
      expect(evaluateMoistureDecision({
        value: 'dry',
        observedAt,
        provenance: 'observed',
        soilRuleUsed,
        soilRuleProvenance: 'explicit_plan',
      })).toMatchObject({
        type: 'recommendation', action: 'water', reason: 'dry_matches_rule',
      });
    },
  );

  it('does not recommend water when a dry observation has no soil rule', () => {
    expect(evaluateMoistureDecision({ value: 'dry', observedAt, provenance: 'observed' })).toMatchObject({
      type: 'information_request', request: 'check_moisture_again', reason: 'care_rule_unknown',
    });
  });

  it.each(['default_imputed', 'unknown'] as const)(
    'does not upgrade %s care knowledge into a watering order',
    (soilRuleProvenance) => {
      expect(evaluateMoistureDecision({
        value: 'dry',
        observedAt,
        provenance: 'observed',
        soilRuleUsed: 'secar_completo',
        soilRuleProvenance,
      })).toMatchObject({
        type: 'information_request', reason: 'care_rule_unknown',
      });
    },
  );

  it('blocks unconditional watering when a material care guard is active', () => {
    const guard: ActiveCareGuard = {
      type: 'block_water',
      reason: 'cold_exposure',
      observedAt,
      context: 'exterior',
      provenance: {
        baseline: 'explicit_plan',
        context: 'user_confirmed',
        environment: 'external',
      },
      explanation: 'la temperatura está bajo el mínimo seguro.',
    };

    expect(evaluateMoistureDecision({
      value: 'dry',
      observedAt,
      provenance: 'observed',
      soilRuleUsed: 'secar_completo',
      soilRuleProvenance: 'explicit_plan',
    }, [guard])).toMatchObject({
      type: 'recommendation', action: 'wait', reason: 'active_guard',
    });
  });
});
