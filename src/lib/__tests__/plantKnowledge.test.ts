import { describe, expect, it } from 'vitest';
import { buildConservativeCarePlan, buildStaticCarePlan } from '../plantKnowledge';

describe('care plan review references', () => {
  it('keeps the static reference interval stable in current heat', () => {
    const normal = buildStaticCarePlan({
      plantData: { nombre_cientifico: 'Monstera deliciosa' }, city: 'Santiago', weatherSummary: 'Templado',
    });
    const hot = buildStaticCarePlan({
      plantData: { nombre_cientifico: 'Monstera deliciosa' }, city: 'Santiago', weatherSummary: '35 C', weather: { temp_max: 35 },
    });
    expect(hot?.riego_frecuencia_dias).toBe(normal?.riego_frecuencia_dias);
    expect(hot?.alertas_clima?.join(' ')).toContain('35 C');
  });

  it('keeps the conservative reference interval stable in current heat', () => {
    const normal = buildConservativeCarePlan({ plantData: {}, city: 'Santiago', weatherSummary: 'Templado' });
    const hot = buildConservativeCarePlan({ plantData: {}, city: 'Santiago', weatherSummary: '35 C', weather: { temp_max: 35 } });
    expect(hot.riego_frecuencia_dias).toBe(normal.riego_frecuencia_dias);
  });
});
