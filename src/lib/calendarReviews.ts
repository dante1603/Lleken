import { getCareReviewStatus } from './plants';
import type { Plant } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export type CalendarReviewType = 'humidity' | 'photo';

export interface CalendarReview {
  id: string;
  type: CalendarReviewType;
  plant: Plant;
  title: string;
  detail: string;
  icon: string;
  color: string;
  bg: string;
  dueDate: Date;
  displayDate: Date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function calendarDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

function dateKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function getReviewDisplayDate(dueDate: Date, today: Date) {
  return dueDate.getTime() < today.getTime() ? today : dueDate;
}

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function getPhotoFollowUpFrequency(plant: Plant): number | undefined {
  const frequency = plant.plan_cuidados?.seguimiento_foto_dias;
  return isPositiveFiniteNumber(frequency) ? frequency : undefined;
}

function reviewOrder(type: CalendarReviewType) {
  return type === 'humidity' ? 0 : 1;
}

/**
 * Returns calendar reviews for a single reference instant. Reviews request
 * evidence; they do not represent a care action or an overdue obligation.
 */
export function buildCalendarReviews(plants: Plant[], now: number): CalendarReview[] {
  const today = startOfDay(new Date(now));

  return plants.flatMap((plant) => {
    const createdAt = isFiniteTimestamp(plant.fecha_creacion) ? plant.fecha_creacion : now;
    const reviews: CalendarReview[] = [];
    const moistureReview = getCareReviewStatus(plant, now);
    const humidityDueDate = moistureReview.reviewAt === undefined
      ? today
      : startOfDay(new Date(moistureReview.reviewAt));
    const humidityDisplayDate = getReviewDisplayDate(humidityDueDate, today);

    reviews.push({
      id: `${plant.id}-humidity-${dateKey(humidityDisplayDate)}`,
      type: 'humidity',
      plant,
      title: moistureReview.reviewPending ? 'Revisión de humedad pendiente' : 'Revisar humedad',
      detail: moistureReview.reasons.includes('watering_history_unknown')
        ? 'Sin riego registrado · revisa humedad antes de decidir'
        : moistureReview.reasons.includes('care_baseline_unknown')
          ? 'Sin referencia de cuidado · revisa humedad antes de decidir'
          : 'Confirmar sustrato antes de decidir',
      icon: 'humidity_percentage',
      color: 'text-cyan-700',
      bg: 'bg-cyan-50',
      dueDate: humidityDueDate,
      displayDate: humidityDisplayDate,
    });

    const followUpFrequency = getPhotoFollowUpFrequency(plant);
    if (followUpFrequency !== undefined) {
      const lastFollowUp = isFiniteTimestamp(plant.fecha_ultimo_seguimiento)
        ? plant.fecha_ultimo_seguimiento
        : createdAt;
      const photoDueDate = startOfDay(addDays(new Date(lastFollowUp), followUpFrequency));
      const photoDisplayDate = getReviewDisplayDate(photoDueDate, today);
      const photoReferenceReached = photoDueDate.getTime() <= today.getTime();

      reviews.push({
        id: `${plant.id}-photo-${dateKey(photoDisplayDate)}`,
        type: 'photo',
        plant,
        title: 'Foto de seguimiento',
        detail: photoReferenceReached
          ? 'Conviene actualizar la observación visual.'
          : `Referencia de seguimiento: cada ${followUpFrequency} día${followUpFrequency !== 1 ? 's' : ''}`,
        icon: 'photo_camera',
        color: 'text-green-700',
        bg: 'bg-[#edf3ef]',
        dueDate: photoDueDate,
        displayDate: photoDisplayDate,
      });
    }

    return reviews;
  }).sort((a, b) => (
    a.displayDate.getTime() - b.displayDate.getTime()
    || a.dueDate.getTime() - b.dueDate.getTime()
    || reviewOrder(a.type) - reviewOrder(b.type)
    || a.plant.id.localeCompare(b.plant.id)
  ));
}

/** Includes today and the next dayCount - 1 calendar days. */
export function isWithinUpcomingDays(date: Date, today: Date, dayCount: number) {
  const diff = calendarDayNumber(date) - calendarDayNumber(today);
  return diff >= 0 && diff < dayCount;
}
