import type { CarePlan, Plant } from '../types';
import type { FollowUpResult } from './plants';

const PLANT_STATES = ['saludable', 'necesita_atencion', 'en_riesgo'] as const;

export interface GenerateCarePlanInput {
  plantData: Partial<Plant>;
  city: string;
  weatherSummary: string;
}

export interface FollowUpAnalysisInput {
  plant: Plant;
  image: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function asNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function asPlantState(value: unknown): Plant['estado'] {
  return PLANT_STATES.includes(value as Plant['estado'])
    ? value as Plant['estado']
    : 'saludable';
}

export function normalizePlantIdentification(value: unknown): Partial<Plant> {
  const data = asRecord(value);
  const info = asRecord(data.info_general);

  return {
    nombre_comun: asString(data.nombre_comun, 'Planta sin identificar'),
    nombre_cientifico: asString(data.nombre_cientifico, 'Especie no confirmada'),
    familia: asString(data.familia),
    estado: asPlantState(data.estado),
    puntuacion_salud: asNumber(data.puntuacion_salud, 75, 0, 100),
    info_general: {
      descripcion: asString(info.descripcion, 'Aun no tenemos una descripcion confiable para esta planta.'),
      origen: asString(info.origen),
      curiosidades: asStringArray(info.curiosidades),
      usos_comunes: asStringArray(info.usos_comunes),
      condiciones_ideales: asString(info.condiciones_ideales),
    },
  };
}

export function normalizeCarePlan(value: unknown): CarePlan {
  const data = asRecord(value);

  return {
    riego_frecuencia_dias: asNumber(data.riego_frecuencia_dias, 5, 1, 30),
    instrucciones: asString(data.instrucciones, 'Revisa la humedad del sustrato antes de regar y ajusta segun el clima local.'),
    alertas_clima: asStringArray(data.alertas_clima),
    riego_ajuste_clima: asString(data.riego_ajuste_clima, 'Reduce el riego en dias frios o lluviosos y aumenta la revision en dias calurosos.'),
    exposicion_sol: asString(data.exposicion_sol, 'Luz indirecta brillante.'),
    seguimiento_foto_dias: asNumber(data.seguimiento_foto_dias, 7, 1, 30),
    tareas_adicionales: asStringArray(data.tareas_adicionales),
  };
}

export function normalizeFollowUpResult(value: unknown): FollowUpResult {
  const data = asRecord(value);

  return {
    estado: asPlantState(data.estado),
    puntuacion_salud: asNumber(data.puntuacion_salud, 75, 0, 100),
    descripcion_estado: asString(data.descripcion_estado),
    observaciones: asString(data.observaciones, 'Seguimiento registrado.'),
    recomendacion_inmediata: asString(data.recomendacion_inmediata, 'Mantener observacion y revisar humedad del sustrato.'),
  };
}

export function getAiErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('"code":429') || message.includes('credits are depleted')) {
    return 'La identificacion con IA no esta disponible porque los creditos de Gemini estan agotados. Revisa la facturacion del proyecto en AI Studio.';
  }

  if (message.includes('API key') || message.includes('Gemini API key')) {
    return 'No pudimos usar la IA porque falta o no es valida la clave de Gemini.';
  }

  return fallback;
}
