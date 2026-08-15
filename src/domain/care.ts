import type { CareArchetype, WeatherConditions } from '../types';
import type { ConfirmedPlantContext } from './context';

const DAY_MS = 24 * 60 * 60 * 1000;

export type CareReviewReason =
  | 'elapsed_window'
  | 'watering_history_unknown'
  | 'care_baseline_unknown'
  | 'heat'
  | 'cold'
  | 'rain_outdoor'
  | 'low_light';

export interface CareReviewInput {
  referenceIntervalDays?: number;
  lastWateredAt?: number;
  now: number;
  weather?: WeatherConditions;
  confirmedContext?: ConfirmedPlantContext;
  careArchetype?: CareArchetype;
}

export interface CareReviewStatus {
  reviewPending: boolean;
  referenceIntervalDays?: number;
  reviewIntervalDays?: number;
  daysSinceWatered?: number;
  daysUntilReview?: number;
  reviewAt?: number;
  reasons: CareReviewReason[];
}

function clampReviewInterval(days: number) {
  return Math.min(30, Math.max(1, Math.round(days)));
}

function usableReferenceInterval(days?: number) {
  return typeof days === 'number' && Number.isFinite(days) && days > 0
    ? clampReviewInterval(days)
    : undefined;
}

/**
 * The sole authority for a humidity-review window. A pending review requests
 * observation; it never recommends watering.
 */
export function evaluateCareReview(input: CareReviewInput): CareReviewStatus {
  const reasons: CareReviewReason[] = [];
  const referenceIntervalDays = usableReferenceInterval(input.referenceIntervalDays);

  if (!referenceIntervalDays) reasons.push('care_baseline_unknown');

  let reviewIntervalDays = referenceIntervalDays;
  if (reviewIntervalDays) {
    const weather = input.weather;
    const isSucculent = input.careArchetype === 'suculenta_cactus';
    const isEdible = input.careArchetype === 'comestible_aromatica';
    const isOutdoor = input.confirmedContext?.ubicacion_tipo === 'balcon'
      || input.confirmedContext?.ubicacion_tipo === 'exterior';

    if (weather?.temp_max !== undefined && weather.temp_max >= 30 && !isSucculent) {
      reviewIntervalDays -= isEdible ? 2 : 1;
      reasons.push('heat');
    }
    if (weather?.temp_min !== undefined && weather.temp_min <= 10) {
      reviewIntervalDays += 2;
      reasons.push('cold');
    }
    if (weather?.lluvia !== undefined && weather.lluvia > 5 && isOutdoor) {
      reviewIntervalDays += 1;
      reasons.push('rain_outdoor');
    }
    if (input.confirmedContext?.luz_usuario === 'baja') {
      reviewIntervalDays += 1;
      reasons.push('low_light');
    }
    reviewIntervalDays = clampReviewInterval(reviewIntervalDays);
  }

  if (input.lastWateredAt === undefined) {
    reasons.push('watering_history_unknown');
    return {
      reviewPending: true,
      referenceIntervalDays,
      reviewIntervalDays,
      reasons,
    };
  }

  if (!reviewIntervalDays) {
    return {
      reviewPending: true,
      referenceIntervalDays,
      daysSinceWatered: Math.max(0, Math.floor((input.now - input.lastWateredAt) / DAY_MS)),
      reasons,
    };
  }

  const daysSinceWatered = Math.max(0, Math.floor((input.now - input.lastWateredAt) / DAY_MS));
  const reviewAt = input.lastWateredAt + reviewIntervalDays * DAY_MS;
  const daysUntilReview = Math.max(0, Math.ceil((reviewAt - input.now) / DAY_MS));
  const reviewPending = input.now >= reviewAt;
  if (reviewPending) reasons.push('elapsed_window');

  return {
    reviewPending,
    referenceIntervalDays,
    reviewIntervalDays,
    daysSinceWatered,
    daysUntilReview,
    reviewAt,
    reasons,
  };
}
