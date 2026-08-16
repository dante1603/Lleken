import type { Garden } from './garden';

export type PlantDataInitializationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PlantDataInitialization {
  status: PlantDataInitializationStatus;
  garden: Garden | null;
  error: string | null;
}

export function idlePlantDataInitialization(): PlantDataInitialization {
  return { status: 'idle', garden: null, error: null };
}

export function startPlantDataInitialization(): PlantDataInitialization {
  return { status: 'loading', garden: null, error: null };
}

export function retainInitializationGarden(
  initialization: PlantDataInitialization,
  garden: Garden,
): PlantDataInitialization {
  return { ...initialization, garden };
}

export function finishPlantDataInitialization(
  initialization: PlantDataInitialization,
): PlantDataInitialization {
  if (!initialization.garden) {
    throw new Error('Plant data initialization cannot become ready without a Garden.');
  }

  return { status: 'ready', garden: initialization.garden, error: null };
}

export function failBeforeGarden(): PlantDataInitialization {
  return { status: 'error', garden: null, error: 'No pudimos cargar tu jardín.' };
}

export function failPlantCollection(garden: Garden): PlantDataInitialization {
  return { status: 'error', garden, error: 'No pudimos cargar tu jardín.' };
}
