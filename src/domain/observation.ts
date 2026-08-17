export const MAX_OBSERVATION_TEXT_LENGTH = 1000;
export type ObservationEntryMode = 'generic' | 'photo';

export interface UserPlantObservation {
  text?: string;
  observedAt: number;
  provenance: 'user_observed';
}

export function normalizeObservationText(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error('El texto de observación debe ser texto.');

  const text = value.trim();
  if (!text) return undefined;
  if (text.length > MAX_OBSERVATION_TEXT_LENGTH) {
    throw new Error(`El texto de observación no puede superar ${MAX_OBSERVATION_TEXT_LENGTH} caracteres.`);
  }
  return text;
}

export function createUserPlantObservation(text: unknown, observedAt: number): UserPlantObservation | undefined {
  if (!Number.isFinite(observedAt)) throw new Error('La fecha de observación no es válida.');
  const normalizedText = normalizeObservationText(text);
  if (!normalizedText) return undefined;

  return {
    text: normalizedText,
    observedAt,
    provenance: 'user_observed',
  };
}

/** An entry mode can recommend evidence without making one evidence type mandatory. */
export function canSubmitPlantObservation(entryMode: ObservationEntryMode, text: unknown, image: unknown) {
  void entryMode;
  return Boolean(normalizeObservationText(text) || (typeof image === 'string' && image.trim()));
}
