import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlantForUser, getAdjustedWateringFrequency, getWateringStatus } from '../plants';
import { Plant } from '../../types';

const supabaseMock = vi.hoisted(() => {
  const calls: Array<{ table?: string; operation: string; payload?: unknown; column?: string; value?: unknown }> = [];
  const results = new Map<string, Array<unknown>>();

  function nextResult(key: string, fallback: unknown) {
    return (results.get(key)?.shift() as unknown) || fallback;
  }

  function tableBuilder(table: string) {
    const builder = {
      select: vi.fn(() => builder),
      order: vi.fn(() => builder),
      in: vi.fn(() => builder),
      limit: vi.fn(async () => nextResult(`${table}.limit`, { data: [], error: null })),
      maybeSingle: vi.fn(async () => nextResult(`${table}.maybeSingle`, { data: null, error: null })),
      single: vi.fn(async () => nextResult(`${table}.single`, { data: { id: 'species-id' }, error: null })),
      eq: vi.fn((column: string, value: unknown) => {
        calls.push({ table, operation: 'eq', column, value });
        return builder;
      }),
      insert: vi.fn(async (payload: unknown) => {
        calls.push({ table, operation: 'insert', payload });
        return nextResult(`${table}.insert`, { data: null, error: null });
      }),
      upsert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      delete: vi.fn(() => {
        calls.push({ table, operation: 'delete' });
        return {
          eq: vi.fn(async (column: string, value: unknown) => {
            calls.push({ table, operation: 'delete.eq', column, value });
            return nextResult(`${table}.delete`, { error: null });
          }),
        };
      }),
    };

    return builder;
  }

  return {
    calls,
    results,
    from: vi.fn(tableBuilder),
    storageFrom: vi.fn(() => ({
      upload: vi.fn(async () => nextResult('storage.upload', { error: null })),
      createSignedUrl: vi.fn(async () => nextResult('storage.createSignedUrl', { data: { signedUrl: 'signed-url' }, error: null })),
      remove: vi.fn(async (paths: string[]) => {
        calls.push({ operation: 'storage.remove', payload: paths });
        return nextResult('storage.remove', { error: null });
      }),
    })),
    reset() {
      calls.length = 0;
      results.clear();
      this.from.mockClear();
      this.storageFrom.mockClear();
    },
  };
});

vi.mock('../supabase', () => ({
  supabase: {
    from: supabaseMock.from,
    storage: {
      from: supabaseMock.storageFrom,
    },
    auth: {
      getUser: vi.fn(),
    },
  },
}));

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

  describe('createPlantForUser', () => {
    beforeEach(() => {
      supabaseMock.reset();
      vi.stubGlobal('crypto', {
        randomUUID: vi
          .fn()
          .mockReturnValueOnce('plant-id')
          .mockReturnValueOnce('event-id'),
      });
    });

    it('deberia eliminar la planta si falla el log ambiental despues de crearla', async () => {
      supabaseMock.results.set('environmental_logs.insert', [{ error: new Error('environment failed') }]);

      await expect(createPlantForUser(
        {
          uid: 'user-id',
          id: 'user-id',
          email: 'user@example.com',
          displayName: 'User',
          photoURL: null,
          profileAvatarId: null,
        },
        {
          plantData: { nombre_comun: 'Albahaca' },
          lat: -33.4,
          lon: -70.6,
        },
      )).rejects.toThrow('environment failed');

      expect(supabaseMock.calls).toEqual(expect.arrayContaining([
        expect.objectContaining({ table: 'plants', operation: 'insert' }),
        expect.objectContaining({ table: 'environmental_logs', operation: 'insert' }),
        expect.objectContaining({ table: 'plants', operation: 'delete.eq', column: 'id', value: 'plant-id' }),
      ]));
    });
  });
});
