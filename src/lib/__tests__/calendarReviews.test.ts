import { describe, expect, it } from 'vitest';
import { buildCalendarReviews, isWithinUpcomingDays } from '../calendarReviews';
import type { Plant } from '../../types';

const NOW = new Date(2024, 0, 15, 12).getTime();

function dateAt(offsetDays: number, hour = 12) {
  const date = new Date(NOW);
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildPlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'plant-1',
    fecha_creacion: dateAt(-20).getTime(),
    ...overrides,
  };
}

function reviewsFor(plant: Plant) {
  return buildCalendarReviews([plant], NOW);
}

describe('buildCalendarReviews', () => {
  it('creates a humidity review without representing a watering action', () => {
    const humidity = reviewsFor(buildPlant()).find((review) => review.type === 'humidity');

    expect(humidity).toMatchObject({ type: 'humidity', dueDate: startOfDay(new Date(NOW)) });
    expect(humidity).not.toHaveProperty('action');
    expect(humidity?.title.toLowerCase()).not.toContain('regar');
  });

  it('uses the supplied now for the humidity review clock', () => {
    const now = new Date(2024, 4, 20, 12).getTime();
    const lastWateredAt = new Date(2024, 4, 15, 12).getTime();
    const plant = buildPlant({
      plan_cuidados: { riego_frecuencia_dias: 5 },
      fecha_ultimo_riego: lastWateredAt,
    });

    const humidity = buildCalendarReviews([plant], now).find((review) => review.type === 'humidity');

    expect(humidity?.dueDate).toEqual(startOfDay(new Date(now)));
  });

  it('uses the photo follow-up reference interval exactly', () => {
    const lastFollowUp = dateAt(-10, 9).getTime();
    const photo = reviewsFor(buildPlant({
      fecha_ultimo_seguimiento: lastFollowUp,
      plan_cuidados: { seguimiento_foto_dias: 10 },
    })).find((review) => review.type === 'photo');

    expect(photo?.dueDate).toEqual(startOfDay(dateAt(0)));
    expect(photo?.displayDate).toEqual(startOfDay(new Date(NOW)));
    expect(photo?.detail).toBe('Conviene actualizar la observación visual.');
  });

  it('does not invent a local seven-day photo reference', () => {
    const reviews = reviewsFor(buildPlant({ plan_cuidados: {} }));

    expect(reviews.filter((review) => review.type === 'photo')).toHaveLength(0);
  });

  it('does not create a periodic pests review from action history', () => {
    const reviews = reviewsFor(buildPlant({
      historial_acciones: [{ tipo: 'revision_plagas', fecha: dateAt(-2).getTime() }],
    }));

    expect(reviews).not.toMatchObject([{ type: 'pests' }]);
  });

  it('does not create a fertilization review from the season field', () => {
    const reviews = reviewsFor(buildPlant({
      plan_cuidados: { fertilizacion_temporada: 'crecimiento_activo' },
    }));

    expect(reviews).not.toMatchObject([{ type: 'fertilize' }]);
  });

  it('keeps an earlier dueDate while projecting displayDate to today', () => {
    const lastWateredAt = dateAt(-10).getTime();
    const humidity = reviewsFor(buildPlant({
      plan_cuidados: { riego_frecuencia_dias: 5 },
      fecha_ultimo_riego: lastWateredAt,
    })).find((review) => review.type === 'humidity');

    expect(humidity?.dueDate).toEqual(startOfDay(dateAt(-5)));
    expect(humidity?.displayDate).toEqual(startOfDay(new Date(NOW)));
  });
});

describe('isWithinUpcomingDays', () => {
  it('includes exactly day 0 through day 6 for the seven-day metric', () => {
    const today = startOfDay(new Date(NOW));

    expect(isWithinUpcomingDays(dateAt(0), today, 7)).toBe(true);
    expect(isWithinUpcomingDays(dateAt(6), today, 7)).toBe(true);
    expect(isWithinUpcomingDays(dateAt(7), today, 7)).toBe(false);
  });
});
