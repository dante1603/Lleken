import { describe, expect, it } from 'vitest';
import { confirmedContextFromTouched } from '../context';
import { isConfirmedHealthy } from '../health';

describe('DOM-01 domain boundaries', () => {
  it('never promotes inferred context without an explicit touched value', () => {
    const inferred = { ubicacion_tipo: 'interior' as const, maceta_con_drenaje: true };
    const confirmed = confirmedContextFromTouched({});

    expect(inferred.ubicacion_tipo).toBe('interior');
    expect(confirmed).toEqual({});
    expect(confirmed.ubicacion_tipo).toBeUndefined();
    expect(confirmed.maceta_con_drenaje).toBeUndefined();
  });

  it('does not count unknown health as healthy', () => {
    expect(isConfirmedHealthy(undefined)).toBe(false);
    expect(isConfirmedHealthy('saludable')).toBe(true);
  });
});
