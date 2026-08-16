import type { Garden, GardenMembership } from '../domain/garden';
import { supabase } from './supabase';

interface GardenRow {
  id: string;
  owner_id: string;
  name: string;
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === '23505';
}

function mapGardenRow(row: GardenRow): Garden {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
  };
}

function assertPersonalGardenOwnership(garden: Garden, uid: string) {
  if (garden.id !== personalGardenIdForUser(uid) || garden.ownerId !== uid) {
    throw new Error('El Garden personal existente no pertenece al usuario autenticado.');
  }
}

async function findGardenById(gardenId: string): Promise<Garden | null> {
  const { data, error } = await supabase
    .from('gardens')
    .select('id, owner_id, name')
    .eq('id', gardenId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapGardenRow(data as GardenRow) : null;
}

async function ensureOwnerMembership(gardenId: string, uid: string) {
  const membership: GardenMembership = {
    gardenId,
    userId: uid,
    role: 'owner',
  };
  const { error } = await supabase
    .from('garden_members')
    .upsert({
      garden_id: membership.gardenId,
      user_id: membership.userId,
      role: membership.role,
    }, { onConflict: 'garden_id,user_id' });

  if (error) throw error;
}

async function backfillOwnLegacyPlants(gardenId: string, uid: string) {
  const { error } = await supabase
    .from('plants')
    .update({ garden_id: gardenId })
    .eq('owner_id', uid)
    .is('garden_id', null);

  if (error) throw error;
}

/** The personal Garden is deliberately deterministic for this transition slice. */
export function personalGardenIdForUser(uid: string): string {
  return uid;
}

/**
 * Ensures the authenticated user's deterministic personal Garden, owner membership,
 * and the one-way backfill of that user's unassigned legacy plants.
 */
export async function ensurePersonalGardenForUser(uid: string): Promise<Garden> {
  const gardenId = personalGardenIdForUser(uid);
  let garden = await findGardenById(gardenId);

  if (!garden) {
    const { data, error } = await supabase
      .from('gardens')
      .insert({
        id: gardenId,
        owner_id: uid,
        name: 'Mi jardín',
      })
      .select('id, owner_id, name')
      .single();

    if (error) {
      if (!isDuplicateKeyError(error)) throw error;

      garden = await findGardenById(gardenId);
      if (!garden) throw error;
    } else if (data) {
      garden = mapGardenRow(data as GardenRow);
    } else {
      throw new Error('No se pudo recuperar el Garden personal recién creado.');
    }
  }

  assertPersonalGardenOwnership(garden, uid);
  await ensureOwnerMembership(garden.id, uid);
  await backfillOwnLegacyPlants(garden.id, uid);

  return garden;
}
