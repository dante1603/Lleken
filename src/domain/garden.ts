export type GardenRole = 'owner' | 'caregiver' | 'viewer';

/** Minimal Garden contract used by the personal-Garden boundary. */
export interface Garden {
  id: string;
  ownerId: string;
  name: string;
}

export interface GardenMembership {
  gardenId: string;
  userId: string;
  role: GardenRole;
}
