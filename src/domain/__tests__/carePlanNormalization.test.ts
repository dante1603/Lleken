import { describe, expect, it } from 'vitest';
import { normalizeCarePlanWithProvenance } from '../carePlanNormalization';


describe('normalizeCarePlanWithProvenance', () => {
  it('marks a synthesized soil rule as default-imputed', () => {
    const result = normalizeCarePlanWithProvenance({
      arquetipo_cuidado: 'suculenta_cactus',
    }, 'ai_inferred');

    expect(result.regla_humedad_sustrato).toBe('secar_completo');
    expect(result.field_provenance?.regla_humedad_sustrato).toBe('default_imputed');
    expect(result.field_provenance?.drenaje_requerido).toBe('default_imputed');
  });

  it('preserves the source assigned at the generation boundary for explicit fields', () => {
    const result = normalizeCarePlanWithProvenance({
      regla_humedad_sustrato: 'top_5cm_seco',
      temp_min_segura_c: 12,
      drenaje_requerido: true,
    }, 'ai_inferred');

    expect(result.field_provenance).toMatchObject({
      regla_humedad_sustrato: 'ai_inferred',
      temp_min_segura_c: 'ai_inferred',
      drenaje_requerido: 'ai_inferred',
    });
  });

  it('does not upgrade legacy explicit values when their source metadata is absent', () => {
    const result = normalizeCarePlanWithProvenance({
      regla_humedad_sustrato: 'top_5cm_seco',
      temp_min_segura_c: 12,
      drenaje_requerido: true,
    });

    expect(result.field_provenance).toMatchObject({
      regla_humedad_sustrato: 'unknown',
      temp_min_segura_c: 'unknown',
      drenaje_requerido: 'unknown',
    });
  });

  it('preserves persisted metadata across client re-normalization', () => {
    const result = normalizeCarePlanWithProvenance({
      regla_humedad_sustrato: 'top_5cm_seco',
      field_provenance: { regla_humedad_sustrato: 'external' },
    });

    expect(result.field_provenance?.regla_humedad_sustrato).toBe('external');
  });
});
