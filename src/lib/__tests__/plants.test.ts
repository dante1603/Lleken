import { describe, it, expect } from 'vitest';
import { getAdjustedWateringFrequency, getWateringStatus } from '../plants';
import { Plant } from '../../types';

describe('plants domain logic', () => {
  const basePlant: Partial<Plant> = {
    plan_cuidados: {
      riego_frecuencia_dias: 5,
    },
    fecha_creacion: Date.now(),
  };

  describe('getAdjustedWateringFrequency', () => {
    it('debería devolver la frecuencia base si no hay clima', () => {
      const plant = { ...basePlant } as Plant;
      expect(getAdjustedWateringFrequency(plant)).toBe(5);
    });

    it('debería retrasar el riego por 2 días si llueve y está en exterior', () => {
      const plant = {
        ...basePlant,
        contexto: { ubicacion_tipo: 'exterior' },
        clima_actual: { lluvia: 5 },
      } as Plant;
      expect(getAdjustedWateringFrequency(plant)).toBe(7);
    });

    it('no debería retrasar el riego por lluvia si está en interior', () => {
      const plant = {
        ...basePlant,
        contexto: { ubicacion_tipo: 'interior' },
        clima_actual: { lluvia: 5 },
      } as Plant;
      expect(getAdjustedWateringFrequency(plant)).toBe(5);
    });

    it('debería adelantar el riego un 25% si hace mucho calor (>=28°C)', () => {
      const plant = {
        ...basePlant,
        clima_actual: { temp_max: 30 },
      } as Plant;
      // 5 * 0.25 = 1.25 -> floor(1.25) = 1 -> freq = 4
      expect(getAdjustedWateringFrequency(plant)).toBe(4);
    });

    it('debería retrasar el riego un 25% si hace frío (<=12°C)', () => {
      const plant = {
        ...basePlant,
        clima_actual: { temp_min: 10 },
      } as Plant;
      // 5 * 0.25 = 1.25 -> floor(1.25) = 1 -> freq = 6
      expect(getAdjustedWateringFrequency(plant)).toBe(6);
    });

    it('debería combinar lluvia y frío para retrasar aún más en exterior', () => {
      const plant = {
        ...basePlant,
        contexto: { ubicacion_tipo: 'exterior' },
        clima_actual: { lluvia: 10, temp_min: 5 },
      } as Plant;
      // base 5 + 2 (lluvia) + 1 (frío) = 8
      expect(getAdjustedWateringFrequency(plant)).toBe(8);
    });
  });

  describe('getWateringStatus', () => {
    it('debería calcular que NO requiere riego si fue regada hoy', () => {
      const plant = {
        ...basePlant,
        fecha_ultimo_riego: Date.now(),
      } as Plant;
      const status = getWateringStatus(plant);
      expect(status.isDue).toBe(false);
      expect(status.nextWateringDays).toBe(5);
    });

    it('debería calcular que requiere riego si pasaron más días que la frecuencia', () => {
      const plant = {
        ...basePlant,
        fecha_ultimo_riego: Date.now() - (6 * 24 * 60 * 60 * 1000), // Hace 6 días
      } as Plant;
      const status = getWateringStatus(plant);
      expect(status.isDue).toBe(true);
      expect(status.nextWateringDays).toBe(-1);
    });
  });
});
