import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  confirmPlantIdentification,
  createPlantForUser,
  attachFollowUpAssessment,
  getCareReviewStatus,
  listenToVisiblePlants,
  mapPlantRow,
  savePlantObservation,
  saveEnvironmentSnapshot,
  saveMoistureReview,
  moistureObservationDescription,
} from '../plants';
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
      order: vi.fn(async () => nextResult(`${table}.order`, { data: [], error: null })),
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
      upsert: vi.fn((payload: unknown) => {
        calls.push({ table, operation: 'upsert', payload });
        return builder;
      }),
      update: vi.fn((payload: unknown) => {
        calls.push({ table, operation: 'update', payload });
        return builder;
      }),
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

const gardenMock = vi.hoisted(() => ({
  ensurePersonalGardenForUser: vi.fn(async (uid: string) => ({
    id: uid,
    ownerId: uid,
    name: 'Mi jardín',
  })),
}));

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

vi.mock('../gardens', () => gardenMock);

describe('plants domain logic', () => {
  const basePlant: Partial<Plant> = {
    plan_cuidados: {
      riego_frecuencia_dias: 5,
    },
    fecha_creacion: Date.now(),
  };

  describe('moistureObservationDescription', () => {
    it('conserva el copy de regla cuando la observación seca usó una regla', () => {
      expect(moistureObservationDescription({
        value: 'dry',
        observedAt: 1_000,
        provenance: 'observed',
        soilRuleUsed: 'top_2cm_seco',
      })).toBe('Humedad: seco según la regla');
    });

    it('explicita la ausencia de regla sin convertirla en recomendación', () => {
      const description = moistureObservationDescription({
        value: 'dry',
        observedAt: 1_000,
        provenance: 'observed',
      });

      expect(description).not.toContain('según la regla');
      expect(description).toContain('sin regla definida');
    });
  });

  describe('getCareReviewStatus', () => {
    it('adapta Plant legacy a una revisión pendiente, no a una orden de riego', () => {
      const status = getCareReviewStatus({ ...basePlant, fecha_creacion: 0 } as Plant, 10 * 24 * 60 * 60 * 1000);
      expect(status.reviewPending).toBe(true);
      expect(status.reasons).toContain('watering_history_unknown');
      expect(status.daysSinceWatered).toBeUndefined();
    });

    it('preserves environmental logged_at and passes it through the legacy adapter', async () => {
      const now = 20 * 24 * 60 * 60 * 1000;
      const loggedAt = new Date(now - 60 * 60 * 1000).toISOString();
      const plant = await mapPlantRow(
        { id: 'plant-id', owner_id: 'user-id', created_at: new Date(0).toISOString() },
        undefined,
        undefined,
        { plant_id: 'plant-id', weather_condition: { temp_max: 30 }, logged_at: loggedAt },
      );

      expect(plant.clima_observado_en).toBe(new Date(loggedAt).getTime());
      expect(plant.clima_actual).toEqual({ temp_max: 30 });

      const status = getCareReviewStatus({
        ...plant,
        plan_cuidados: { riego_frecuencia_dias: 5 },
        fecha_ultimo_riego: now,
      }, now);
      expect(status.reasons).toContain('heat');

      const noEnvironment = await mapPlantRow(
        { id: 'plant-id', owner_id: 'user-id', created_at: new Date(0).toISOString() },
        undefined,
        [{
          plant_id: 'plant-id',
          event_type: 'creation',
          created_at: loggedAt,
          metadata: { weather: { temp_max: 30 } },
        }],
      );
      expect(noEnvironment.clima_actual).toBeUndefined();
      expect(noEnvironment.clima_observado_en).toBeUndefined();
    });
  });

  describe('saveEnvironmentSnapshot', () => {
    beforeEach(() => {
      supabaseMock.reset();
      vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('snapshot-event-id') });
    });

    it('persists an Open-Meteo snapshot as evidence without changing the care baseline or health', async () => {
      const observedAt = 20 * 24 * 60 * 60 * 1000;
      const weather = { temp_max: 30, humedad_relativa: 40 };
      await saveEnvironmentSnapshot({
        plantId: 'plant-id',
        uid: 'user-id',
        weather,
        lat: -33.4,
        lon: -70.6,
        environmentType: 'exterior',
        observedAt,
      });

      const snapshotEvent = supabaseMock.calls.find((call) => call.table === 'plant_events' && call.operation === 'insert');
      const environment = supabaseMock.calls.find((call) => call.table === 'environmental_logs' && call.operation === 'insert');
      const observedAtIso = new Date(observedAt).toISOString();

      expect(snapshotEvent?.payload).toMatchObject({
        id: 'snapshot-event-id',
        event_type: 'note',
        event_at: observedAtIso,
        metadata: {
          semanticType: 'environment_snapshot',
          weather,
          observedAt,
        },
      });
      expect(environment?.payload).toMatchObject({
        event_id: 'snapshot-event-id',
        plant_id: 'plant-id',
        weather_condition: weather,
        weather_source: 'open_meteo',
        logged_at: observedAtIso,
      });
      expect(supabaseMock.calls.some((call) => call.table === 'plants' && call.operation === 'update')).toBe(false);

      const mapped = await mapPlantRow(
        { id: 'plant-id', owner_id: 'user-id', created_at: new Date(0).toISOString() },
        undefined,
        undefined,
        {
          plant_id: 'plant-id',
          weather_condition: weather,
          logged_at: observedAtIso,
        },
      );
      const review = getCareReviewStatus({
        ...mapped,
        plan_cuidados: { riego_frecuencia_dias: 5 },
        fecha_ultimo_riego: observedAt,
      }, observedAt);
      expect(mapped.clima_actual).toEqual(weather);
      expect(mapped.clima_observado_en).toBe(observedAt);
      expect(review.reasons).toContain('heat');
    });
  });

  describe('saveMoistureReview', () => {
    beforeEach(() => {
      supabaseMock.reset();
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn().mockReturnValueOnce('observation-event-id').mockReturnValueOnce('decision-event-id'),
      });
    });

    it('persists observation and decision atomically without updating the plant', async () => {
      const result = await saveMoistureReview({
        plantId: 'plant-id', uid: 'user-id', value: 'dry', soilRuleUsed: 'top_2cm_seco', observedAt: 1_000,
      });
      const insert = supabaseMock.calls.find((call) => call.table === 'plant_events' && call.operation === 'insert');
      const rows = insert?.payload as Array<{ event_type: string; metadata: Record<string, unknown> }>;

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        event_type: 'manual_review',
        metadata: { semanticType: 'moisture_observation', moistureObservation: { provenance: 'observed', value: 'dry' } },
      });
      expect(rows[1]).toMatchObject({
        event_type: 'note',
        metadata: {
          semanticType: 'care_recommendation',
          careRecommendation: { action: 'water', basedOnEventId: 'observation-event-id' },
        },
      });
      expect(result).toMatchObject({ observationEventId: 'observation-event-id', decisionEventId: 'decision-event-id' });
      expect(supabaseMock.calls.some((call) => call.table === 'plants' && call.operation === 'update')).toBe(false);
    });

    it('projects the latest valid moisture observation into the care review adapter', async () => {
      const plant = await mapPlantRow(
        { id: 'plant-id', owner_id: 'user-id', created_at: new Date(0).toISOString() },
        undefined,
        [
          { plant_id: 'plant-id', event_type: 'note', created_at: new Date(0).toISOString(), metadata: { semanticType: 'care_recommendation' } },
          { plant_id: 'plant-id', event_type: 'manual_review', created_at: new Date(6_000).toISOString(), metadata: { semanticType: 'moisture_observation', moistureObservation: { value: 'dry', observedAt: 6_000, provenance: 'observed', soilRuleUsed: 'top_2cm_seco' } } },
          { plant_id: 'plant-id', event_type: 'manual_review', created_at: new Date(5_000).toISOString(), metadata: { semanticType: 'moisture_observation', moistureObservation: { value: 'wet', observedAt: 5_000, provenance: 'observed', soilRuleUsed: 'top_2cm_seco' } } },
        ],
      );
      const review = getCareReviewStatus({ ...plant, plan_cuidados: { riego_frecuencia_dias: 5 } }, 6_000);

      expect(plant.ultima_observacion_humedad).toMatchObject({ value: 'dry', observedAt: 6_000 });
      expect(plant.ultima_observacion_humedad_humeda).toMatchObject({ value: 'wet', observedAt: 5_000 });
      expect(review.reviewAnchorAt).toBe(5_000);
      expect(review.reviewPending).toBe(false);
    });
  });

  describe('listenToVisiblePlants', () => {
    beforeEach(() => {
      supabaseMock.reset();
    });

    it('loads events into the visible-plant projection so wet observations reach care review', async () => {
      const wetAt = 5 * 24 * 60 * 60 * 1000;
      supabaseMock.results.set('plants.order', [{
        data: [{ id: 'plant-id', owner_id: 'user-id', created_at: new Date(0).toISOString(), current_care_plan: { riego_frecuencia_dias: 5 } }],
        error: null,
      }]);
      supabaseMock.results.set('plant_events.order', [{
        data: [{
          plant_id: 'plant-id', event_type: 'manual_review', created_at: new Date(wetAt).toISOString(),
          metadata: { semanticType: 'moisture_observation', moistureObservation: { value: 'wet', observedAt: wetAt, provenance: 'observed' } },
        }],
        error: null,
      }]);

      await new Promise<void>((resolve, reject) => {
        const unsubscribe = listenToVisiblePlants('user-id', (plants) => {
          try {
            expect(plants[0].ultima_observacion_humedad_humeda).toMatchObject({ value: 'wet', observedAt: wetAt });
            expect(getCareReviewStatus(plants[0], wetAt).reviewPending).toBe(false);
            unsubscribe();
            resolve();
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        }, reject);
      });
    });

    it('keeps every plant row that Supabase RLS allowed to be read', async () => {
      supabaseMock.results.set('plants.order', [{
        data: [{
          id: 'shared-plant-id',
          owner_id: 'other-owner-id',
          garden_id: 'shared-garden-id',
          created_at: new Date(0).toISOString(),
        }],
        error: null,
      }]);

      await new Promise<void>((resolve, reject) => {
        const unsubscribe = listenToVisiblePlants('user-id', (plants) => {
          try {
            expect(plants).toHaveLength(1);
            expect(plants[0]).toMatchObject({
              ownerId: 'other-owner-id',
              gardenId: 'shared-garden-id',
            });
            unsubscribe();
            resolve();
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        }, reject);
      });
    });
  });

  describe('createPlantForUser', () => {
    beforeEach(() => {
      supabaseMock.reset();
      gardenMock.ensurePersonalGardenForUser.mockClear();
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
          plantData: { nombre_comun: 'Albahaca', provenance: 'ai_inferred' },
          lat: -33.4,
          lon: -70.6,
        },
      )).rejects.toThrow('environment failed');

      expect(supabaseMock.calls).toEqual(expect.arrayContaining([
        expect.objectContaining({ table: 'plants', operation: 'insert' }),
        expect.objectContaining({ table: 'environmental_logs', operation: 'insert' }),
        expect.objectContaining({ table: 'plants', operation: 'delete.eq', column: 'id', value: 'plant-id' }),
      ]));

      const environmentInsert = supabaseMock.calls.find((call) => call.table === 'environmental_logs' && call.operation === 'insert');
      expect(environmentInsert?.payload).toMatchObject({ garden_id: 'user-id' });
    });

    it('persiste una propuesta como evidencia sin promover especie ni salud', async () => {
      await createPlantForUser(
        { uid: 'user-id', id: 'user-id', email: 'user@example.com', displayName: 'User', photoURL: null, profileAvatarId: null },
        {
          plantData: {
            nombre_comun: 'Albahaca',
            nombre_cientifico: 'Ocimum basilicum',
            species_key: 'ocimum-basilicum',
            contexto_inferido: { ubicacion_tipo: 'interior' },
            provenance: 'ai_inferred',
          },
          context: {},
        },
      );

      const plantInsert = supabaseMock.calls.find((call) => call.table === 'plants' && call.operation === 'insert');
      expect(gardenMock.ensurePersonalGardenForUser).toHaveBeenCalledWith('user-id');
      expect(plantInsert?.payload).toMatchObject({ garden_id: 'user-id' });
      expect(plantInsert?.payload).not.toHaveProperty('species_id');
      expect(plantInsert?.payload).not.toHaveProperty('health_state');
      expect(plantInsert?.payload).not.toHaveProperty('health_score');
      expect(supabaseMock.calls.some((call) => call.table === 'species_catalog')).toBe(false);

      const creation = supabaseMock.calls.find((call) => call.table === 'plant_events' && call.operation === 'insert');
      expect(creation?.payload).toMatchObject({
        garden_id: 'user-id',
        metadata: {
          identificationProposal: {
            provenance: 'ai_inferred',
            contexto_inferido: { ubicacion_tipo: 'interior' },
          },
        },
      });
    });

    it('promueve especie sólo mediante confirmación explícita y deja un evento trazable', async () => {
      await confirmPlantIdentification({
        plantId: 'plant-id',
        confirmedBy: 'user-id',
        identification: {
          nombre_comun: 'Albahaca',
          nombre_cientifico: 'Ocimum basilicum',
          species_key: 'ocimum-basilicum',
          provenance: 'user_confirmed',
        },
      });

      const allowedEventTypes = [
        'creation', 'watering', 'photo', 'note', 'fertilization',
        'pruning', 'transplant', 'pest_treatment', 'harvest', 'manual_review',
      ];
      const confirmationEvent = supabaseMock.calls.find((call) => (
        call.table === 'plant_events' && call.operation === 'insert'
      ));

      expect((confirmationEvent?.payload as { event_type?: string }).event_type).toBe('note');
      expect(allowedEventTypes).toContain((confirmationEvent?.payload as { event_type?: string }).event_type);
      expect(confirmationEvent?.payload).toMatchObject({
        metadata: {
          semanticType: 'identification_confirmed',
          confirmedIdentification: { provenance: 'user_confirmed' },
        },
      });
      expect(supabaseMock.calls).toEqual(expect.arrayContaining([
        expect.objectContaining({ table: 'species_catalog', operation: 'upsert' }),
        expect.objectContaining({ table: 'plants', operation: 'update', payload: expect.objectContaining({ species_id: 'species-id', common_name: 'Albahaca' }) }),
      ]));
    });

    it('guarda text-only como un evento note y no mueve last_observed_at', async () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('text-event') });
      const result = await savePlantObservation({
        plant: { ...basePlant, id: 'plant-id', ownerId: 'user-id' } as Plant,
        uid: 'user-id',
        observedAt: 10_000,
        text: '  Vi una hoja nueva.  ',
      });

      expect(result.eventId).toBe('text-event');
      const event = supabaseMock.calls.find((call) => call.table === 'plant_events' && call.operation === 'insert');
      expect(event?.payload).toMatchObject({
        id: 'text-event',
        event_type: 'note',
        user_comment: 'Vi una hoja nueva.',
        event_at: new Date(10_000).toISOString(),
        metadata: {
          semanticType: 'plant_observation',
          userObservation: { text: 'Vi una hoja nueva.', observedAt: 10_000, provenance: 'user_observed' },
        },
      });
      expect(supabaseMock.calls.some((call) => call.table === 'plant_media')).toBe(false);
      expect(supabaseMock.calls.some((call) => call.table === 'plants' && call.operation === 'update')).toBe(false);
    });

    it('rechaza una observación sin texto útil ni foto', async () => {
      await expect(savePlantObservation({
        plant: { ...basePlant, id: 'plant-id', ownerId: 'user-id' } as Plant,
        uid: 'user-id',
        observedAt: 15_000,
        text: '   ',
      })).rejects.toThrow('requiere texto o una foto');
      expect(supabaseMock.calls.some((call) => call.table === 'plant_events' && call.operation === 'insert')).toBe(false);
    });

    it('guarda photo-only como un evento photo y vincula media al mismo event_id', async () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('photo-event') });
      await savePlantObservation({
        plant: { ...basePlant, id: 'plant-id', ownerId: 'user-id' } as Plant,
        uid: 'user-id',
        observedAt: 20_000,
        image: 'data:image/jpeg;base64,AA==',
      });

      const event = supabaseMock.calls.find((call) => call.table === 'plant_events' && call.operation === 'insert');
      const media = supabaseMock.calls.find((call) => call.table === 'plant_media' && call.operation === 'insert');
      expect(event?.payload).toMatchObject({ event_type: 'photo', user_comment: null, id: 'photo-event' });
      expect(media?.payload).toMatchObject({ event_id: 'photo-event' });
      const update = supabaseMock.calls.find((call) => call.table === 'plants' && call.operation === 'update');
      expect(update?.payload).toEqual({ last_observed_at: new Date(20_000).toISOString() });
    });

    it('guarda text + photo como un único evento con el texto original', async () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('combined-event') });
      await savePlantObservation({
        plant: { ...basePlant, id: 'plant-id', ownerId: 'user-id' } as Plant,
        uid: 'user-id',
        observedAt: 30_000,
        text: 'Las puntas están secas.',
        image: 'data:image/jpeg;base64,AA==',
      });

      expect(supabaseMock.calls.filter((call) => call.table === 'plant_events' && call.operation === 'insert')).toHaveLength(1);
      expect(supabaseMock.calls.filter((call) => call.table === 'plant_media' && call.operation === 'insert')).toHaveLength(1);
      const event = supabaseMock.calls.find((call) => call.table === 'plant_events' && call.operation === 'insert');
      const media = supabaseMock.calls.find((call) => call.table === 'plant_media' && call.operation === 'insert');
      expect(event?.payload).toMatchObject({ event_type: 'photo', user_comment: 'Las puntas están secas.' });
      expect(media?.payload).toMatchObject({ event_id: 'combined-event' });
    });

    it('adjunta la evaluación IA al mismo evento y conserva la observación humana separada', async () => {
      const assessment = { estado: 'en_riesgo', puntuacion_salud: 10, observaciones: 'Hojas caídas', provenance: 'ai_inferred' } as const;
      supabaseMock.results.set('plant_events.maybeSingle', [{
        data: {
          metadata: {
            semanticType: 'plant_observation',
            userObservation: { text: 'Hojas caídas desde ayer.', observedAt: 40_000, provenance: 'user_observed' },
          },
        },
        error: null,
      }]);

      await attachFollowUpAssessment({ plantId: 'plant-id', eventId: 'same-event', uid: 'user-id', assessment });

      const update = supabaseMock.calls.find((call) => call.table === 'plant_events' && call.operation === 'update');
      expect(update?.payload).toMatchObject({
        metadata: {
          semanticType: 'plant_observation',
          userObservation: expect.objectContaining({ provenance: 'user_observed' }),
          followUpAssessment: { provenance: 'ai_inferred' },
          seguimiento: { provenance: 'ai_inferred' },
        },
      });
      expect(update?.payload).not.toHaveProperty('user_comment');
      expect(supabaseMock.calls.some((call) => call.table === 'plants' && call.operation === 'update')).toBe(false);
    });

    it('limpia el evento y storage si falla la media de una foto', async () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('failed-photo-event') });
      supabaseMock.results.set('plant_media.insert', [{ error: new Error('media failed') }]);

      await expect(savePlantObservation({
        plant: { ...basePlant, id: 'plant-id', ownerId: 'user-id' } as Plant,
        uid: 'user-id',
        observedAt: 50_000,
        image: 'data:image/jpeg;base64,AA==',
      })).rejects.toThrow('media failed');

      expect(supabaseMock.calls).toEqual(expect.arrayContaining([
        expect.objectContaining({ operation: 'storage.remove', payload: expect.any(Array) }),
        expect.objectContaining({ table: 'plant_events', operation: 'delete.eq', column: 'id', value: 'failed-photo-event' }),
      ]));
    });

    it('proyecta eventos legacy y nuevas observaciones sin mezclar sus fuentes', async () => {
      const plant = await mapPlantRow(
        { id: 'plant-id', owner_id: 'user-id', created_at: new Date(0).toISOString() },
        undefined,
        [
          {
            id: 'legacy-photo',
            plant_id: 'plant-id',
            event_type: 'photo',
            user_comment: 'Evaluación antigua',
            created_at: new Date(1_000).toISOString(),
            metadata: { seguimiento: { id: 'legacy-assessment', fecha: 1_000, estado: 'saludable' } },
          },
          {
            id: 'new-observation',
            plant_id: 'plant-id',
            event_type: 'photo',
            user_comment: 'Vi manchas en una hoja.',
            created_at: new Date(2_000).toISOString(),
            metadata: {
              semanticType: 'plant_observation',
              userObservation: { text: 'Vi manchas en una hoja.', observedAt: 2_000, provenance: 'user_observed' },
              followUpAssessment: { observaciones: 'Señal visual', provenance: 'ai_inferred' },
            },
          },
        ],
      );

      expect(plant.historial_acciones).toEqual(expect.arrayContaining([
        expect.objectContaining({ eventId: 'legacy-photo', tipo: 'foto', seguimiento: expect.objectContaining({ id: 'legacy-assessment' }) }),
        expect.objectContaining({
          eventId: 'new-observation',
          semanticType: 'plant_observation',
          descripcion: 'Vi manchas en una hoja.',
          userObservation: expect.objectContaining({ provenance: 'user_observed' }),
        }),
      ]));
    });
  });
});
