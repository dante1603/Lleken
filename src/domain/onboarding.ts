export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export type OnboardingTimestamps = {
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
};

export type OnboardingPlant = {
  ownerId?: string;
  userId?: string;
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

export function isOwnOnboardingPlant(plant: OnboardingPlant, uid: string): boolean {
  return plant.ownerId === uid || (!plant.ownerId && plant.userId === uid);
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
  const hasOwnPlant = plants.some((plant) => isOwnOnboardingPlant(plant, uid));

  if (status !== 'completed' && hasOwnPlant) {
    return { status: 'completed', reconciliationRequired: true };
  }

  return { status, reconciliationRequired: false };
}
