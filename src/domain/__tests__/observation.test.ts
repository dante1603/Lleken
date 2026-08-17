import { describe, expect, it } from 'vitest';
import { canSubmitPlantObservation } from '../observation';

describe('plant observation submission', () => {
  it('allows text-only evidence when the entry recommends a photo', () => {
    expect(canSubmitPlantObservation('photo', 'Vi una hoja nueva.', undefined)).toBe(true);
  });

  it('accepts photo-only and combined evidence', () => {
    expect(canSubmitPlantObservation('generic', undefined, 'data:image/jpeg;base64,AA==')).toBe(true);
    expect(canSubmitPlantObservation('photo', 'Hay manchas.', 'data:image/jpeg;base64,AA==')).toBe(true);
  });
});
