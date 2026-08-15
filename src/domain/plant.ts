import type { ConfirmedPlantContext, InferredPlantContext } from './context';

/** Canonical representation of one physical plant, independent of legacy UI projection. */
export interface PlantInstance {
  id: string;
  ownerId: string;
  gardenId?: string;
  speciesId?: string;
  nickname?: string;
  confirmedContext: ConfirmedPlantContext;
  inferredContext?: InferredPlantContext;
  createdAt: number;
  lastObservedAt?: number;
  lastWateredAt?: number;
}
