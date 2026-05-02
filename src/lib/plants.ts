import { supabase } from './supabase';
import { Plant } from '../types';
import type { AuthUser } from '../types/auth';

export interface NewPlantInput {
  image?: string;
  plantData: Partial<Plant>;
  customName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  weather?: Plant['clima_actual'];
  carePlan?: unknown;
  context?: Plant['contexto'];
}

export interface FollowUpResult {
  estado?: Plant['estado'];
  puntuacion_salud?: number;
  descripcion_estado?: string;
  observaciones?: string;
  recomendacion_inmediata?: string;
  sintomas_observados?: string[];
  causas_probables?: string[];
  preguntas_de_confirmacion?: string[];
  accion_segura_inmediata?: string;
  riesgo?: 'bajo' | 'medio' | 'alto';
}

type PlantAction = NonNullable<Plant['historial_acciones']>[number];
type Unsubscribe = () => void;

interface PlantRow {
  id: string;
  owner_id: string;
  garden_id?: string | null;
  species_id?: string | null;
  nickname?: string | null;
  suggested_name?: string | null;
  common_name?: string | null;
  scientific_name?: string | null;
  status?: string | null;
  health_state?: Plant['estado'] | null;
  health_score?: number | null;
  confirmed_context?: Plant['contexto'] | null;
  inferred_context?: Plant['contexto_inferido'] | null;
  current_care_plan?: Plant['plan_cuidados'] | null;
  last_watered_at?: string | null;
  last_observed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface PlantMediaRow {
  plant_id: string;
  storage_path: string;
  public_url?: string | null;
  created_at: string;
}

const EVENT_TYPE_MAP: Record<string, string> = {
  creacion: 'creation',
  riego: 'watering',
  revision_humedad: 'manual_review',
  revision_plagas: 'manual_review',
  fertilizacion: 'fertilization',
  poda: 'pruning',
  trasplante: 'transplant',
  cosecha: 'harvest',
  foto: 'photo',
  nota: 'note',
  tratamiento_plaga: 'pest_treatment',
};

function toTimestamp(value?: string | null) {
  return value ? new Date(value).getTime() : undefined;
}

function toIsoDate(value?: number) {
  return value ? new Date(value).toISOString() : undefined;
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

async function signedPhotoUrl(path?: string | null) {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from('plant-images').createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error) {
    console.warn('No se pudo crear URL firmada para imagen.', error);
    return undefined;
  }
  return data.signedUrl;
}

async function loadLatestMediaForPlants(plantIds: string[]) {
  if (plantIds.length === 0) return new Map<string, PlantMediaRow>();

  const { data, error } = await supabase
    .from('plant_media')
    .select('plant_id, storage_path, public_url, created_at')
    .in('plant_id', plantIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('No se pudieron cargar imagenes de plantas.', error);
    return new Map<string, PlantMediaRow>();
  }

  const byPlant = new Map<string, PlantMediaRow>();
  (data as PlantMediaRow[] | null)?.forEach((media) => {
    if (!byPlant.has(media.plant_id)) {
      byPlant.set(media.plant_id, media);
    }
  });

  return byPlant;
}

async function mapPlantRow(row: PlantRow, media?: PlantMediaRow): Promise<Plant> {
  const fotoUrl = media?.public_url || await signedPhotoUrl(media?.storage_path);

  return {
    id: row.id,
    userId: row.owner_id,
    ownerId: row.owner_id,
    caregiverIds: [],
    memberIds: [row.owner_id],
    fotoUrl,
    fotoPath: media?.storage_path,
    nombrePersonalizado: row.nickname || '',
    nombre_sugerido: row.suggested_name || undefined,
    nombre_comun: row.common_name || undefined,
    nombre_cientifico: row.scientific_name || undefined,
    estado: row.health_state || 'saludable',
    puntuacion_salud: row.health_score ?? 75,
    plan_cuidados: row.current_care_plan || undefined,
    contexto: row.confirmed_context || undefined,
    contexto_inferido: row.inferred_context || undefined,
    fecha_creacion: toTimestamp(row.created_at) || Date.now(),
    fecha_ultimo_riego: toTimestamp(row.last_watered_at),
    fecha_ultimo_seguimiento: toTimestamp(row.last_observed_at),
    historial_acciones: [],
  };
}

function mapPlantFields(fields: Partial<Plant>) {
  return {
    nickname: fields.nombrePersonalizado,
    suggested_name: fields.nombre_sugerido,
    common_name: fields.nombre_comun,
    scientific_name: fields.nombre_cientifico,
    health_state: fields.estado,
    health_score: fields.puntuacion_salud,
    current_care_plan: fields.plan_cuidados,
    confirmed_context: fields.contexto,
    inferred_context: fields.contexto_inferido,
    last_watered_at: toIsoDate(fields.fecha_ultimo_riego),
    last_observed_at: toIsoDate(fields.fecha_ultimo_seguimiento),
  };
}

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.entries(value).reduce((clean, [key, entry]) => {
    if (entry !== undefined) clean[key] = entry;
    return clean;
  }, {} as Record<string, unknown>);
}

async function assertOwnPlantLimit(uid: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, owned_plant_limit')
    .eq('id', uid)
    .maybeSingle();

  if (profile?.plan === 'paid' || profile?.plan === 'admin') return;

  const { count, error } = await supabase
    .from('plants')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', uid);

  if (error) {
    console.warn('No se pudo contar plantas propias en Supabase.', error);
    return;
  }

  const limit = profile?.owned_plant_limit || 3;
  if ((count || 0) >= limit) {
    console.info('Plan gratis sobre el limite local. No se bloquea aun porque pagos no esta implementado.');
  }
}

export function isPlantOwner(plant: Plant, uid?: string | null) {
  if (!uid) return false;
  return plant.ownerId === uid || (!plant.ownerId && plant.userId === uid);
}

export function canCareForPlant(plant: Plant, uid?: string | null) {
  if (!uid) return false;
  return isPlantOwner(plant, uid) || plant.memberIds?.includes(uid) || plant.caregiverIds?.includes(uid);
}

export function getPlantDisplayName(plant: Plant) {
  return plant.nombrePersonalizado || plant.nombre_comun || 'Planta';
}

export function getAdjustedWateringFrequency(plant: Plant): number {
  const baseFreq = plant.plan_cuidados?.riego_frecuencia_dias || 5;
  let freq = baseFreq;

  if (plant.clima_actual) {
    const isIndoor = plant.contexto?.ubicacion_tipo === 'interior';

    if (!isIndoor && plant.clima_actual.lluvia !== undefined && plant.clima_actual.lluvia > 2) {
      freq += 2;
    }

    if (plant.clima_actual.temp_max !== undefined && plant.clima_actual.temp_max >= 28) {
      freq -= Math.max(1, Math.floor(baseFreq * 0.25));
    }

    if (plant.clima_actual.temp_min !== undefined && plant.clima_actual.temp_min <= 12) {
      freq += Math.max(1, Math.floor(baseFreq * 0.25));
    }
  }

  return Math.max(1, Math.round(freq));
}

export function getWateringStatus(plant: Plant) {
  const frequency = getAdjustedWateringFrequency(plant);
  const lastWatered = plant.fecha_ultimo_riego || plant.fecha_creacion;
  const daysSinceWatered = lastWatered
    ? Math.max(0, Math.floor((Date.now() - lastWatered) / (1000 * 60 * 60 * 24)))
    : 0;
  const nextWateringDays = frequency - daysSinceWatered;

  return {
    frequency,
    daysSinceWatered,
    nextWateringDays,
    isDue: nextWateringDays <= 0,
  };
}

export function listenToVisiblePlants(
  uid: string,
  onChange: (plants: Plant[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  let cancelled = false;

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as PlantRow[];
      const mediaByPlant = await loadLatestMediaForPlants(rows.map((row) => row.id));
      const plants = await Promise.all(rows.map((row) => mapPlantRow(row, mediaByPlant.get(row.id))));

      if (!cancelled) onChange(plants.filter((plant) => canCareForPlant(plant, uid)));
    } catch (error) {
      onError?.(error);
    }
  };

  void load();

  return () => {
    cancelled = true;
  };
}

export function listenToPlant(
  id: string,
  onChange: (plant: Plant | null) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  let cancelled = false;

  const load = async () => {
    try {
      const plant = await getPlantById(id);
      if (!cancelled) onChange(plant);
    } catch (error) {
      onError?.(error);
    }
  };

  void load();

  return () => {
    cancelled = true;
  };
}

export async function uploadPlantPhoto(uid: string, plantId: string, imageDataUrl: string, prefix: 'profile' | 'follow-up') {
  const blob = dataUrlToBlob(imageDataUrl);
  const fotoPath = `${uid}/${plantId}/${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;

  const { error } = await supabase.storage
    .from('plant-images')
    .upload(fotoPath, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const fotoUrl = await signedPhotoUrl(fotoPath);
  return { fotoUrl, fotoPath, mimeType: blob.type, sizeBytes: blob.size };
}

export async function createPlantForUser(user: AuthUser, input: NewPlantInput) {
  await assertOwnPlantLimit(user.uid);

  const { data: plant, error } = await supabase
    .from('plants')
    .insert(withoutUndefined({
      owner_id: user.uid,
      nickname: input.customName || '',
      suggested_name: input.plantData.nombre_sugerido,
      common_name: input.plantData.nombre_comun,
      scientific_name: input.plantData.nombre_cientifico,
      health_state: input.plantData.estado || 'saludable',
      health_score: input.plantData.puntuacion_salud ?? 75,
      confirmed_context: input.context || {},
      inferred_context: input.plantData.contexto_inferido || {},
      current_care_plan: input.carePlan || {},
    }))
    .select('id')
    .single();

  if (error) throw error;

  const plantId = plant.id as string;
  const { data: event, error: eventError } = await supabase
    .from('plant_events')
    .insert({
      plant_id: plantId,
      created_by: user.uid,
      event_type: 'creation',
      user_comment: 'Perfil creado',
      metadata: {
        city: input.city,
        lat: input.lat,
        lon: input.lon,
        weather: input.weather,
      },
    })
    .select('id')
    .single();

  if (eventError) throw eventError;

  if (input.weather || input.lat || input.lon) {
    await supabase.from('environmental_logs').insert(withoutUndefined({
      event_id: event.id,
      plant_id: plantId,
      lat: input.lat,
      lon: input.lon,
      environment_type: input.context?.ubicacion_tipo,
      weather_condition: input.weather || {},
      weather_source: input.weather ? 'open_meteo' : 'manual',
    }));
  }

  if (input.image) {
    const photo = await uploadPlantPhoto(user.uid, plantId, input.image, 'profile');
    const { error: mediaError } = await supabase.from('plant_media').insert({
      event_id: event.id,
      plant_id: plantId,
      created_by: user.uid,
      storage_path: photo.fotoPath,
      public_url: photo.fotoUrl,
      mime_type: photo.mimeType,
      size_bytes: photo.sizeBytes,
      capture_context: input.plantData.contexto_inferido || {},
    });

    if (mediaError) throw mediaError;
  }

  return plantId;
}

export async function getPlantById(id: string) {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const mediaByPlant = await loadLatestMediaForPlants([id]);
  return mapPlantRow(data as PlantRow, mediaByPlant.get(id));
}

export async function deletePlant(plantId: string) {
  const { error } = await supabase.from('plants').delete().eq('id', plantId);
  if (error) throw error;
}

export async function updatePlantFields(plantId: string, fields: Partial<Plant>) {
  const { error } = await supabase
    .from('plants')
    .update(withoutUndefined(mapPlantFields(fields)))
    .eq('id', plantId);

  if (error) throw error;
}

export async function appendPlantAction(plant: Plant, action: PlantAction, fields: Partial<Plant> = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id || plant.ownerId;

  if (!uid) throw new Error('No hay usuario autenticado para registrar la accion.');

  const eventType = EVENT_TYPE_MAP[action.tipo] || 'note';
  const { error } = await supabase.from('plant_events').insert({
    plant_id: plant.id,
    created_by: uid,
    event_type: eventType,
    user_comment: action.descripcion || '',
    event_at: new Date(action.fecha || Date.now()).toISOString(),
    metadata: {
      legacy_tipo: action.tipo,
      seguimiento: action.seguimiento,
    },
  });

  if (error) throw error;

  await updatePlantFields(plant.id, fields);
}

export async function saveFollowUpPhoto(plant: Plant, uid: string, image: string, result: FollowUpResult) {
  const now = Date.now();
  const safeAction = result.accion_segura_inmediata || result.recomendacion_inmediata || result.observaciones;

  const { data: event, error: eventError } = await supabase
    .from('plant_events')
    .insert({
      plant_id: plant.id,
      created_by: uid,
      event_type: 'photo',
      user_comment: safeAction || 'Seguimiento con foto registrado',
      event_at: new Date(now).toISOString(),
      metadata: {
        seguimiento: result,
      },
    })
    .select('id')
    .single();

  if (eventError) throw eventError;

  const photo = await uploadPlantPhoto(uid, plant.id, image, 'follow-up');
  const { error: mediaError } = await supabase.from('plant_media').insert({
    event_id: event.id,
    plant_id: plant.id,
    created_by: uid,
    storage_path: photo.fotoPath,
    public_url: photo.fotoUrl,
    mime_type: photo.mimeType,
    size_bytes: photo.sizeBytes,
    capture_context: {
      seguimiento: result,
    },
  });

  if (mediaError) throw mediaError;

  await updatePlantFields(plant.id, {
    estado: result.estado || plant.estado,
    puntuacion_salud: result.puntuacion_salud ?? plant.puntuacion_salud,
    fecha_ultimo_seguimiento: now,
  });
}
