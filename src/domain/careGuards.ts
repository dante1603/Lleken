import type { CarePlan, WeatherConditions } from '../types';
import type { ConfirmedPlantContext } from './context';
import { isWeatherUsable } from './care';
import type { ActiveCareGuard } from './careDecision';
import {
  getCarePlanFieldProvenance,
  isDecisionUsableProvenance,
} from './carePlanProvenance';

export interface ActiveCareGuardInput {
  carePlan?: CarePlan;
  weather?: WeatherConditions;
  weatherObservedAt?: number;
  confirmedContext?: ConfirmedPlantContext;
  now: number;
}

function isConfirmedOutdoor(context?: ConfirmedPlantContext): context is ConfirmedPlantContext & { ubicacion_tipo: 'balcon' | 'exterior' } {
  return context?.ubicacion_tipo === 'balcon' || context?.ubicacion_tipo === 'exterior';
}

/**
 * Derives only guards supported by structured, fresh evidence. It never parses
 * free-form climate alerts and never treats inferred context as confirmation.
 */
export function deriveActiveCareGuards(input: ActiveCareGuardInput): ActiveCareGuard[] {
  if (!input.carePlan || !isConfirmedOutdoor(input.confirmedContext)) return [];
  if (!isWeatherUsable(input.weather, input.weatherObservedAt, input.now)) return [];

  const weather = input.weather as WeatherConditions;
  const observedAt = input.weatherObservedAt as number;
  const context = input.confirmedContext.ubicacion_tipo;
  const guards: ActiveCareGuard[] = [];

  const minTemperatureProvenance = getCarePlanFieldProvenance(input.carePlan, 'temp_min_segura_c');
  if (
    typeof weather.temp_min === 'number'
    && typeof input.carePlan.temp_min_segura_c === 'number'
    && weather.temp_min < input.carePlan.temp_min_segura_c
    && isDecisionUsableProvenance(minTemperatureProvenance)
  ) {
    guards.push({
      type: 'block_water',
      reason: 'cold_exposure',
      observedAt,
      context,
      provenance: {
        baseline: minTemperatureProvenance,
        context: 'user_confirmed',
        environment: 'external',
      },
      explanation: `la planta está confirmada en ${context} y la temperatura mínima observada (${weather.temp_min} °C) está bajo su mínimo seguro (${input.carePlan.temp_min_segura_c} °C).`,
    });
  }

  const drainageProvenance = getCarePlanFieldProvenance(input.carePlan, 'drenaje_requerido');
  if (
    typeof weather.lluvia === 'number'
    && weather.lluvia > 5
    && input.confirmedContext.maceta_con_drenaje === false
    && input.carePlan.drenaje_requerido === true
    && isDecisionUsableProvenance(drainageProvenance)
  ) {
    guards.push({
      type: 'block_water',
      reason: 'rain_drainage_conflict',
      observedAt,
      context,
      provenance: {
        baseline: drainageProvenance,
        context: 'user_confirmed',
        environment: 'external',
      },
      explanation: `hay lluvia reciente (${weather.lluvia} mm), la planta está confirmada en ${context} y la maceta fue confirmada sin drenaje aunque el plan requiere drenaje.`,
    });
  }

  return guards;
}
