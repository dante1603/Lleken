import { supabase } from './supabase';
import { Plant } from '../types';
import type { CarePlan } from '../types';
import type { AuthUser } from '../types/auth';
import type { FollowUpAssessment } from '../domain/assessment';
import type { ConfirmedPlantContext } from '../domain/context';
import type { ConfirmedIdentification, IdentificationProposal } from '../domain/identification';
import type { PlantInstance } from '../domain/plant';
import { evaluateCareReview } from '../domain/care';

export interface NewPlantInput {
  image?: string;
  plantData: IdentificationProposal;
  customName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  weather?: Plant['clima_actual'];
  carePlan?: unknown;
  context?: ConfirmedPlantContext;
}

export type FollowUpResult = FollowUpAssessment;

export interface ConfirmPlantIdentificationInput {
  plantId: string;
  confirmedBy: string;
  identification: ConfirmedIdentification;
  carePlan?: unknown;
}

type PlantAction = NonNullable<Plant['historial_acciones']>[number];
type Unsubscribe = () => void;

export interface PlantRow {
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
  created_at: string;
}

interface PlantEventRow {
  plant_id: string;
  event_type: string;
  user_comment?: string | null;
  event_at?: string | null;
  created_at: string;
  metadata?: {
    legacy_tipo?: string;
    city?: string;
    lat?: number;
    lon?: number;
    weather?: Plant['clima_actual'];
    seguimiento?: PlantAction['seguimiento'];
    identificationProposal?: IdentificationProposal;
    confirmedIdentification?: ConfirmedIdentification;
    followUpAssessment?: FollowUpAssessment;
    semanticType?: 'identification_confirmed';
  } | null;
}

export interface EnvironmentalLogRow {
  plant_id: string;
  lat?: number | null;
  lon?: number | null;
  weather_condition?: Plant['clima_actual'] | null;
  logged_at: string;
}

interface SpeciesCatalogLookupRow {
  id: string;
  species_key: string;
  scientific_name?: string | null;
  common_names?: string[] | null;
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

const LEGACY_EVENT_TYPE_MAP: Record<string, PlantAction['tipo']> = {
  creation: 'creacion',
  watering: 'riego',
  manual_review: 'revision_humedad',
  fertilization: 'fertilizacion',
  pruning: 'poda',
  transplant: 'trasplante',
  harvest: 'cosecha',
  photo: 'foto',
  note: 'nota',
  pest_treatment: 'tratamiento_plaga',
};

function createId() {
  return crypto.randomUUID();
}

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
    .select('plant_id, storage_path, created_at')
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

async function loadEventsForPlants(plantIds: string[]) {
  if (plantIds.length === 0) return new Map<string, PlantEventRow[]>();

  const { data, error } = await supabase
    .from('plant_events')
    .select('plant_id, event_type, user_comment, event_at, created_at, metadata')
    .in('plant_id', plantIds)
    .order('event_at', { ascending: false });

  if (error) {
    console.warn('No se pudieron cargar eventos de plantas.', error);
    return new Map<string, PlantEventRow[]>();
  }

  const byPlant = new Map<string, PlantEventRow[]>();
  (data as PlantEventRow[] | null)?.forEach((event) => {
    const current = byPlant.get(event.plant_id) || [];
    current.push(event);
    byPlant.set(event.plant_id, current);
  });

  return byPlant;
}

async function loadLatestEnvironmentForPlants(plantIds: string[]) {
  if (plantIds.length === 0) return new Map<string, EnvironmentalLogRow>();

  const { data, error } = await supabase
    .from('environmental_logs')
    .select('plant_id, lat, lon, weather_condition, logged_at')
    .in('plant_id', plantIds)
    .order('logged_at', { ascending: false });

  if (error) {
    console.warn('No se pudo cargar clima de plantas.', error);
    return new Map<string, EnvironmentalLogRow>();
  }

  const byPlant = new Map<string, EnvironmentalLogRow>();
  (data as EnvironmentalLogRow[] | null)?.forEach((log) => {
    if (!byPlant.has(log.plant_id)) {
      byPlant.set(log.plant_id, log);
    }
  });

  return byPlant;
}

function mapEventRow(row: PlantEventRow): PlantAction {
  const fallbackType = LEGACY_EVENT_TYPE_MAP[row.event_type] || 'nota';
  const tipo = row.metadata?.legacy_tipo || fallbackType;
  return {
    tipo,
    fecha: toTimestamp(row.event_at || row.created_at) || Date.now(),
    descripcion: row.user_comment || undefined,
    seguimiento: row.metadata?.seguimiento,
  };
}

function latestCreationMetadata(events?: PlantEventRow[]) {
  return events?.find((event) => event.event_type === 'creation')?.metadata || undefined;
}

function inferSpeciesKey(row: PlantRow) {
  return toSpeciesKey({
    nombre_cientifico: row.scientific_name || undefined,
    nombre_comun: row.common_name || undefined,
  });
}

function mapPlantRowToInstance(row: PlantRow): PlantInstance {
  return {
    id: row.id,
    ownerId: row.owner_id,
    gardenId: row.garden_id || undefined,
    speciesId: row.species_id || undefined,
    nickname: row.nickname || undefined,
    confirmedContext: row.confirmed_context || {},
    inferredContext: row.inferred_context || undefined,
    createdAt: toTimestamp(row.created_at) || Date.now(),
    lastObservedAt: toTimestamp(row.last_observed_at),
    lastWateredAt: toTimestamp(row.last_watered_at),
  };
}

export async function mapPlantRow(
  row: PlantRow,
  media?: PlantMediaRow,
  events?: PlantEventRow[],
  environment?: EnvironmentalLogRow,
): Promise<Plant> {
  const fotoUrl = await signedPhotoUrl(media?.storage_path);
  const creationMetadata = latestCreationMetadata(events);
  const proposal = creationMetadata?.identificationProposal;
  const instance = mapPlantRowToInstance(row);

  return {
    id: instance.id,
    userId: instance.ownerId,
    ownerId: instance.ownerId,
    caregiverIds: [],
    memberIds: [instance.ownerId],
    fotoUrl,
    fotoPath: media?.storage_path,
    nombrePersonalizado: instance.nickname || '',
    nombre_sugerido: row.suggested_name || proposal?.nombre_sugerido,
    nombre_comun: row.common_name || proposal?.nombre_comun,
    nombre_cientifico: row.scientific_name || proposal?.nombre_cientifico,
    species_key: row.species_id ? inferSpeciesKey(row) : proposal?.species_key,
    knowledge_source: proposal?.knowledge_source,
    familia: proposal?.familia,
    // health_state/health_score are legacy physical columns without provenance.
    estado: undefined,
    puntuacion_salud: undefined,
    ciudad: creationMetadata?.city,
    lat: environment?.lat ?? creationMetadata?.lat,
    lon: environment?.lon ?? creationMetadata?.lon,
    // Creation weather remains event evidence; it is never projected as current climate.
    clima_actual: environment?.weather_condition || undefined,
    clima_observado_en: toTimestamp(environment?.logged_at),
    plan_cuidados: row.current_care_plan || undefined,
    contexto: instance.confirmedContext,
    contexto_inferido: instance.inferredContext,
    fecha_creacion: instance.createdAt,
    fecha_ultimo_riego: instance.lastWateredAt,
    fecha_ultimo_seguimiento: instance.lastObservedAt,
    historial_acciones: events?.map(mapEventRow) || [],
  };
}

function mapPlantFields(fields: Partial<Plant>) {
  return {
    nickname: fields.nombrePersonalizado,
    suggested_name: fields.nombre_sugerido,
    common_name: fields.nombre_comun,
    scientific_name: fields.nombre_cientifico,
    // Factual health requires an explicit observed/confirmed boundary, not this
    // legacy generic updater. DOM-01 intentionally leaves these columns alone.
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

function normalizeSpeciesText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toSpeciesKey(plantData: Partial<Plant>) {
  const rawKey = plantData.species_key || plantData.nombre_cientifico || plantData.nombre_comun;
  if (!rawKey) return undefined;

  return normalizeSpeciesText(rawKey)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || undefined;
}

function speciesNamesForMatch(plantData: Partial<Plant>) {
  return [
    plantData.species_key,
    plantData.nombre_cientifico,
    plantData.nombre_comun,
  ].filter(Boolean).map((value) => normalizeSpeciesText(value as string));
}

function asCarePlan(value: unknown): Partial<CarePlan> {
  return value && typeof value === 'object' ? value as Partial<CarePlan> : {};
}

async function findCareArchetypeId(carePlan: unknown) {
  const archetypeKey = asCarePlan(carePlan).arquetipo_cuidado;
  if (!archetypeKey) return null;

  const { data, error } = await supabase
    .from('care_archetypes')
    .select('id')
    .eq('key', archetypeKey)
    .maybeSingle();

  if (error) {
    console.warn('No se pudo resolver arquetipo de cuidado.', error);
    return null;
  }

  return data?.id || null;
}

async function ensureSpeciesCatalogEntry(plantData: Partial<Plant>, carePlan: unknown) {
  const speciesKey = toSpeciesKey(plantData);
  if (!speciesKey) return null;

  const { data: exactExisting, error: exactExistingError } = await supabase
    .from('species_catalog')
    .select('id')
    .eq('species_key', speciesKey)
    .maybeSingle();

  if (exactExistingError) throw exactExistingError;
  if (exactExisting?.id) return exactExisting.id as string;

  const matchNames = speciesNamesForMatch(plantData);
  const { data: catalogRows, error: catalogError } = await supabase
    .from('species_catalog')
    .select('id, species_key, scientific_name, common_names')
    .limit(500);

  if (catalogError) throw catalogError;

  const existing = ((catalogRows || []) as SpeciesCatalogLookupRow[]).find((row) => {
    const rowNames = [
      row.species_key,
      row.scientific_name,
      ...(row.common_names || []),
    ].filter(Boolean).map((value) => normalizeSpeciesText(value as string));

    return rowNames.some((rowName) => matchNames.includes(rowName));
  });

  if (existing?.id) return existing.id;

  const commonNames = plantData.nombre_comun ? [plantData.nombre_comun] : [];
  const careArchetypeId = await findCareArchetypeId(carePlan);
  const knowledgeSource = plantData.knowledge_source?.source === 'static_catalog' ? 'static_catalog' : 'ai_generated';
  const confidence = plantData.knowledge_source?.confidence || 'media';

  const { data, error } = await supabase
    .from('species_catalog')
    .upsert(withoutUndefined({
      species_key: speciesKey,
      scientific_name: plantData.nombre_cientifico || plantData.nombre_comun || 'Especie no identificada',
      common_names: commonNames,
      family: plantData.familia,
      care_archetype_id: careArchetypeId,
      knowledge_source: knowledgeSource,
      confidence,
      source_payload: {
        knowledge_source: plantData.knowledge_source,
        info_general: plantData.info_general,
      },
    }), { onConflict: 'species_key' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
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

/** Legacy projection adapter; the review policy lives in domain/care.ts. */
export function getCareReviewStatus(plant: Plant, now = Date.now()) {
  return evaluateCareReview({
    referenceIntervalDays: plant.plan_cuidados?.riego_frecuencia_dias,
    lastWateredAt: plant.fecha_ultimo_riego,
    now,
    weather: plant.clima_actual,
    weatherObservedAt: plant.clima_observado_en,
    confirmedContext: plant.contexto,
    careArchetype: plant.plan_cuidados?.arquetipo_cuidado,
  });
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
      const plantIds = rows.map((row) => row.id);
      const [mediaByPlant, environmentByPlant] = await Promise.all([
        loadLatestMediaForPlants(plantIds),
        loadLatestEnvironmentForPlants(plantIds),
      ]);
      const plants = await Promise.all(rows.map((row) => mapPlantRow(
        row,
        mediaByPlant.get(row.id),
        undefined,
        environmentByPlant.get(row.id),
      )));

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

async function cleanupFailedPlantCreation(plantId: string, storagePath?: string) {
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('plant-images')
      .remove([storagePath]);

    if (storageError) {
      console.warn('No se pudo limpiar la foto subida tras fallar la creacion de planta.', storageError);
    }
  }

  const { error: deleteError } = await supabase
    .from('plants')
    .delete()
    .eq('id', plantId);

  if (deleteError) {
    console.warn('No se pudo limpiar la planta creada parcialmente.', deleteError);
  }
}

export async function createPlantForUser(user: AuthUser, input: NewPlantInput) {
  await assertOwnPlantLimit(user.uid);
  const plantId = createId();
  let plantCreated = false;
  let uploadedStoragePath: string | undefined;

  try {
    const { error } = await supabase
      .from('plants')
      .insert(withoutUndefined({
        id: plantId,
        owner_id: user.uid,
        nickname: input.customName || '',
        suggested_name: input.plantData.nombre_sugerido,
        confirmed_context: input.context || {},
        inferred_context: input.plantData.contexto_inferido || {},
        current_care_plan: input.carePlan || {},
      }));

    if (error) throw error;
    plantCreated = true;

    const eventId = createId();
    const { error: eventError } = await supabase
      .from('plant_events')
      .insert({
        id: eventId,
        plant_id: plantId,
        created_by: user.uid,
        event_type: 'creation',
        user_comment: 'Perfil creado',
        metadata: {
          city: input.city,
          lat: input.lat,
          lon: input.lon,
          weather: input.weather,
          identificationProposal: input.plantData,
        },
      });

    if (eventError) throw eventError;

    if (input.weather || input.lat || input.lon) {
      const { error: environmentError } = await supabase.from('environmental_logs').insert(withoutUndefined({
        event_id: eventId,
        plant_id: plantId,
        lat: input.lat,
        lon: input.lon,
        environment_type: input.context?.ubicacion_tipo,
        weather_condition: input.weather || {},
        weather_source: input.weather ? 'open_meteo' : 'manual',
      }));

      if (environmentError) throw environmentError;
    }

    if (input.image) {
      const photo = await uploadPlantPhoto(user.uid, plantId, input.image, 'profile');
      uploadedStoragePath = photo.fotoPath;
      const { error: mediaError } = await supabase.from('plant_media').insert({
        event_id: eventId,
        plant_id: plantId,
        created_by: user.uid,
        storage_path: photo.fotoPath,
        mime_type: photo.mimeType,
        size_bytes: photo.sizeBytes,
        capture_context: input.plantData.contexto_inferido || {},
      });

      if (mediaError) throw mediaError;
    }
  } catch (error) {
    if (plantCreated) {
      await cleanupFailedPlantCreation(plantId, uploadedStoragePath);
    }

    throw error;
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

  const [mediaByPlant, eventsByPlant, environmentByPlant] = await Promise.all([
    loadLatestMediaForPlants([id]),
    loadEventsForPlants([id]),
    loadLatestEnvironmentForPlants([id]),
  ]);
  return mapPlantRow(
    data as PlantRow,
    mediaByPlant.get(id),
    eventsByPlant.get(id),
    environmentByPlant.get(id),
  );
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
  const eventId = createId();

  const { error: eventError } = await supabase
    .from('plant_events')
    .insert({
      id: eventId,
      plant_id: plant.id,
      created_by: uid,
      event_type: 'photo',
      user_comment: safeAction || 'Seguimiento con foto registrado',
      event_at: new Date(now).toISOString(),
      metadata: {
        seguimiento: result,
        followUpAssessment: result,
      },
    });

  if (eventError) throw eventError;

  const photo = await uploadPlantPhoto(uid, plant.id, image, 'follow-up');
  const { error: mediaError } = await supabase.from('plant_media').insert({
    event_id: eventId,
    plant_id: plant.id,
    created_by: uid,
    storage_path: photo.fotoPath,
    mime_type: photo.mimeType,
    size_bytes: photo.sizeBytes,
    capture_context: {
      seguimiento: result,
      followUpAssessment: result,
    },
  });

  if (mediaError) throw mediaError;

  await updatePlantFields(plant.id, {
    fecha_ultimo_seguimiento: now,
  });
}

/**
 * The only persistence boundary that promotes an identity to a catalog Species.
 * Callers must supply an explicit human or external confirmation.
 */
export async function confirmPlantIdentification(input: ConfirmPlantIdentificationInput) {
  const accepted = input.identification;
  const identity = {
    nombre_comun: accepted.nombre_comun,
    nombre_cientifico: accepted.nombre_cientifico,
    species_key: accepted.species_key,
    familia: accepted.familia,
  } as Partial<Plant>;
  const speciesId = await ensureSpeciesCatalogEntry(identity, input.carePlan);

  if (!speciesId) {
    throw new Error('La confirmación requiere una identidad de especie explícita.');
  }

  const { error: plantError } = await supabase
    .from('plants')
    .update(withoutUndefined({
      species_id: speciesId,
      common_name: accepted.nombre_comun,
      scientific_name: accepted.nombre_cientifico,
    }))
    .eq('id', input.plantId);

  if (plantError) throw plantError;

  const { error: eventError } = await supabase.from('plant_events').insert({
    id: createId(),
    plant_id: input.plantId,
    created_by: input.confirmedBy,
    event_type: 'note',
    user_comment: 'Identificación confirmada',
    metadata: {
      semanticType: 'identification_confirmed',
      confirmedIdentification: accepted,
    },
  });

  if (eventError) throw eventError;
  return speciesId;
}
