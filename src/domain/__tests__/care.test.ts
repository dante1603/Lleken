import { describe, expect, it } from 'vitest';
import { evaluateCareReview } from '../care';

const DAY = 24 * 60 * 60 * 1000;
const now = 20 * DAY;

describe('evaluateCareReview', () => {
  it('marks unknown watering history for review without using creation time', () => {
    const result = evaluateCareReview({ referenceIntervalDays: 5, now });
    expect(result.reviewPending).toBe(true);
    expect(result.reasons).toContain('watering_history_unknown');
    expect(result.daysSinceWatered).toBeUndefined();
  });

  it('marks a missing care baseline without inventing five days', () => {
    const result = evaluateCareReview({ lastWateredAt: now - 3 * DAY, now });
    expect(result.reviewPending).toBe(true);
    expect(result.referenceIntervalDays).toBeUndefined();
    expect(result.reasons).toContain('care_baseline_unknown');
  });

  it('keeps review pending false before the reference window', () => {
    const result = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now - 3 * DAY, now });
    expect(result.reviewPending).toBe(false);
    expect(result.daysUntilReview).toBe(2);
  });

  it('opens review when the reference window is reached', () => {
    const result = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now - 5 * DAY, now });
    expect(result.reviewPending).toBe(true);
    expect(result.reasons).toContain('elapsed_window');
  });

  it('applies heat once for non-succulents', () => {
    const result = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now, weather: { temp_max: 30 } });
    expect(result.reviewIntervalDays).toBe(4);
    expect(result.reasons).toContain('heat');
  });

  it('brings edible plants forward two days in heat', () => {
    const result = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now, weather: { temp_max: 30 }, careArchetype: 'comestible_aromatica' });
    expect(result.reviewIntervalDays).toBe(3);
  });

  it('does not bring succulents forward automatically in heat', () => {
    const result = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now, weather: { temp_max: 30 }, careArchetype: 'suculenta_cactus' });
    expect(result.reviewIntervalDays).toBe(5);
  });

  it('delays review in cold weather', () => {
    expect(evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now, weather: { temp_min: 10 } }).reviewIntervalDays).toBe(7);
  });

  it('delays rain only for confirmed outdoor context', () => {
    const exterior = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now, weather: { lluvia: 6 }, confirmedContext: { ubicacion_tipo: 'exterior' } });
    const interior = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now, weather: { lluvia: 6 }, confirmedContext: { ubicacion_tipo: 'interior' } });
    expect(exterior.reviewIntervalDays).toBe(6);
    expect(interior.reviewIntervalDays).toBe(5);
  });

  it('delays review for confirmed low light only', () => {
    const inferredContext = { luz_usuario: 'baja' as const };
    const confirmed = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now, confirmedContext: { luz_usuario: 'baja' } });
    const noConfirmedContext = evaluateCareReview({ referenceIntervalDays: 5, lastWateredAt: now, now });
    expect(inferredContext.luz_usuario).toBe('baja');
    expect(confirmed.reviewIntervalDays).toBe(6);
    expect(noConfirmedContext.reviewIntervalDays).toBe(5);
  });
});
