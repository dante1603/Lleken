import { describe, expect, it } from 'vitest';
import { buildContextSummary } from '../plantFormatters';

describe('buildContextSummary', () => {
  it('retains absent context as sin dato instead of assuming drainage', () => {
    expect(buildContextSummary({})).toContain('Maceta con drenaje: sin dato');
    expect(buildContextSummary({ maceta_con_drenaje: true })).toContain('Maceta con drenaje: sí');
    expect(buildContextSummary({ maceta_con_drenaje: false })).toContain('Maceta con drenaje: no');
  });
});
