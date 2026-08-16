export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export type OnboardingTimestamps = {
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
};

export type OnboardingSnapshot = {
  uid: string;
  timestamps: OnboardingTimestamps;
};

export type OnboardingPlant = {
  id?: string;
  ownerId?: string;
  userId?: string;
  speciesId?: string;
};

export type OnboardingResolution = {
  status: OnboardingStatus;
  reconciliationRequired: boolean;
};

export function isOnboardingIdentityCurrent(
  targetUid: string,
  targetGeneration: number,
  activeUid: string | undefined,
  activeGeneration: number,
): boolean {
  return targetUid === activeUid && targetGeneration === activeGeneration;
}

export function isOnboardingSnapshotCurrent(snapshot: OnboardingSnapshot | null, uid: string | undefined): snapshot is OnboardingSnapshot {
  return snapshot !== null && snapshot.uid === uid;
}

export function isOwnOnboardingPlant(plant: OnboardingPlant, uid: string): boolean {
  return plant.ownerId === uid || (!plant.ownerId && plant.userId === uid);
}

export function isConfirmedOwnOnboardingPlant(plant: OnboardingPlant, uid: string): boolean {
  return isOwnOnboardingPlant(plant, uid) && Boolean(plant.speciesId);
}

export function onboardingEvidenceKey(plants: OnboardingPlant[], uid: string): string {
  return plants
    .filter((plant) => isConfirmedOwnOnboardingPlant(plant, uid))
    .map((plant) => `${plant.id || 'unknown'}:${plant.speciesId}`)
    .sort()
    .join(',');
}

export function deriveOnboardingStatus(timestamps: OnboardingTimestamps): OnboardingStatus {
  if (timestamps.onboarding_completed_at) return 'completed';
  return timestamps.onboarding_started_at ? 'in_progress' : 'not_started';
}

export function resolveOnboarding(
  timestamps: OnboardingTimestamps,
  plants: OnboardingPlant[],
  uid: string,
): OnboardingResolution {
  const status = deriveOnboardingStatus(timestamps);
  const hasConfirmedOwnPlant = plants.some((plant) => isConfirmedOwnOnboardingPlant(plant, uid));

  if (status !== 'completed' && hasConfirmedOwnPlant) {
    return { status: 'completed', reconciliationRequired: true };
  }

  return { status, reconciliationRequired: false };
}

export function resolveCurrentOnboarding(
  snapshot: OnboardingSnapshot | null,
  uid: string | undefined,
  plants: OnboardingPlant[],
): OnboardingResolution | null {
  if (!uid || !isOnboardingSnapshotCurrent(snapshot, uid)) return null;
  return resolveOnboarding(snapshot.timestamps, plants, uid);
}
