import { describe, expect, it } from 'vitest';
import { evaluateMoistureDecision } from '../careDecision';

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
    'recommends water when dry fulfils %s',
    (soilRuleUsed) => {
      expect(evaluateMoistureDecision({ value: 'dry', observedAt, provenance: 'observed', soilRuleUsed })).toMatchObject({
        type: 'recommendation', action: 'water', reason: 'dry_matches_rule',
      });
    },
  );

  it('does not recommend water when a dry observation has no soil rule', () => {
    expect(evaluateMoistureDecision({ value: 'dry', observedAt, provenance: 'observed' })).toMatchObject({
      type: 'information_request', request: 'check_moisture_again', reason: 'care_rule_unknown',
    });
  });
});
