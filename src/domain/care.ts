import type { CareArchetype, WeatherConditions } from '../types';
import type { ConfirmedPlantContext } from './context';
import type { MoistureObservation } from './careDecision';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEATHER_FRESHNESS_MS = 24 * 60 * 60 * 1000;

export type CareReviewReason =
  | 'elapsed_window'
  | 'watering_history_unknown'
  | 'care_baseline_unknown'
  | 'heat'
  | 'cold'
  | 'rain_outdoor'
  | 'low_light'
  | 'environment_stale'
  | 'environment_timestamp_unknown';

export interface CareReviewInput {
  referenceIntervalDays?: number;
  lastWateredAt?: number;
  now: number;
  weather?: WeatherConditions;
  weatherObservedAt?: number;
  latestWetMoistureObservation?: MoistureObservation;
  confirmedContext?: ConfirmedPlantContext;
  careArchetype?: CareArchetype;
}

/** A weather snapshot is current only when its observation time is known and fresh. */
export function isWeatherUsable(
  weather: WeatherConditions | undefined,
  weatherObservedAt: number | undefined,
  now = Date.now(),
) {
  return weather !== undefined
    && typeof weatherObservedAt === 'number'
    && Number.isFinite(weatherObservedAt)
    && weatherObservedAt <= now
    && now - weatherObservedAt <= WEATHER_FRESHNESS_MS;
}

export interface CareReviewStatus {
  reviewPending: boolean;
  referenceIntervalDays?: number;
  reviewIntervalDays?: number;
  daysSinceWatered?: number;
  daysSinceReviewAnchor?: number;
  reviewAnchorAt?: number;
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
    const weatherUsable = isWeatherUsable(input.weather, input.weatherObservedAt, input.now);
    const weather = weatherUsable ? input.weather : undefined;
    if (input.weather && !weatherUsable) {
      if (typeof input.weatherObservedAt === 'number'
        && Number.isFinite(input.weatherObservedAt)
        && input.weatherObservedAt < input.now - WEATHER_FRESHNESS_MS) {
        reasons.push('environment_stale');
      } else {
        reasons.push('environment_timestamp_unknown');
      }
    }
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

  const wetObservedAt = input.latestWetMoistureObservation?.value === 'wet'
    ? input.latestWetMoistureObservation.observedAt
    : undefined;
  const reviewAnchorAt = Math.max(input.lastWateredAt ?? Number.NEGATIVE_INFINITY, wetObservedAt ?? Number.NEGATIVE_INFINITY);

  if (!Number.isFinite(reviewAnchorAt)) {
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
      daysSinceWatered: input.lastWateredAt === undefined ? undefined : Math.max(0, Math.floor((input.now - input.lastWateredAt) / DAY_MS)),
      daysSinceReviewAnchor: Math.max(0, Math.floor((input.now - reviewAnchorAt) / DAY_MS)),
      reviewAnchorAt,
      reasons,
    };
  }

  const daysSinceWatered = input.lastWateredAt === undefined ? undefined : Math.max(0, Math.floor((input.now - input.lastWateredAt) / DAY_MS));
  const daysSinceReviewAnchor = Math.max(0, Math.floor((input.now - reviewAnchorAt) / DAY_MS));
  const reviewAt = reviewAnchorAt + reviewIntervalDays * DAY_MS;
  const daysUntilReview = Math.max(0, Math.ceil((reviewAt - input.now) / DAY_MS));
  const reviewPending = input.now >= reviewAt;
  if (reviewPending) reasons.push('elapsed_window');

  return {
    reviewPending,
    referenceIntervalDays,
    reviewIntervalDays,
    daysSinceWatered,
    daysSinceReviewAnchor,
    reviewAnchorAt,
    daysUntilReview,
    reviewAt,
    reasons,
  };
}
