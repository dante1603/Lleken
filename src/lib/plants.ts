import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  type FirestoreError,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { db, storage } from './firebase';
import { Plant } from '../types';

export interface NewPlantInput {
  image?: string;
  plantData: Partial<Plant>;
  customName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  weather?: Plant['clima_actual'];
  carePlan?: unknown;
}

export interface FollowUpResult {
  estado?: Plant['estado'];
  puntuacion_salud?: number;
  descripcion_estado?: string;
  observaciones?: string;
  recomendacion_inmediata?: string;
}

type PlantAction = NonNullable<Plant['historial_acciones']>[number];

function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => withoutUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((clean, [key, entry]) => {
      if (entry !== undefined) {
        clean[key] = withoutUndefined(entry);
      }
      return clean;
    }, {} as Record<string, unknown>) as T;
  }

  return value;
}

function plantFromSnap(snapshot: QueryDocumentSnapshot<DocumentData>): Plant {
  return { id: snapshot.id, ...snapshot.data() } as Plant;
}

function mergePlantMaps(primary: Map<string, Plant>, legacy: Map<string, Plant>) {
  const merged = new Map<string, Plant>();
  legacy.forEach((plant, id) => merged.set(id, plant));
  primary.forEach((plant, id) => merged.set(id, plant));
  return Array.from(merged.values()).sort((a, b) => (b.fecha_creacion || 0) - (a.fecha_creacion || 0));
}

function buildPhotoPath(uid: string, plantId: string, prefix: 'profile' | 'follow-up') {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `plants/${plantId}/${prefix}/${uid}-${unique}.jpg`;
}

async function assertOwnPlantLimit(uid: string) {
  let profile: DocumentData | undefined;
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    profile = userSnap.data();
  } catch (error) {
    console.warn('No se pudo leer users/{uid}; se usara limite gratis por defecto.', error);
  }

  if (profile?.plan === 'paid') return;

  const limit = profile?.ownedPlantLimit || 3;
  const legacyQuery = query(collection(db, 'plants'), where('userId', '==', uid));
  const ownPlantIds = new Set<string>();

  let couldCount = false;
  try {
    const legacySnap = await getDocs(legacyQuery);
    legacySnap.forEach((plantDoc) => ownPlantIds.add(plantDoc.id));
    couldCount = true;
  } catch (error) {
    console.warn('No se pudo contar plantas legacy por userId.', error);
  }

  if (!couldCount) return;

  if (ownPlantIds.size >= limit) {
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

export function getWateringStatus(plant: Plant) {
  const frequency = plant.plan_cuidados?.riego_frecuencia_dias || 5;
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
    const ownedPlants = new Map<string, Plant>();
    const legacyPlants = new Map<string, Plant>();

    const readQuery = async (label: string, q: ReturnType<typeof query>, target: Map<string, Plant>) => {
      try {
        const snapshot = await getDocs(q);
        snapshot.forEach((plantDoc) => target.set(plantDoc.id, plantFromSnap(plantDoc)));
      } catch (error) {
        const firestoreError = error as FirestoreError;
        if (firestoreError.code === 'permission-denied') {
          console.warn(`La consulta por ${label} fue denegada. Revisa reglas de Firestore.`);
          return;
        }
        onError?.(error);
      }
    };

    await readQuery('ownerId', query(collection(db, 'plants'), where('ownerId', '==', uid)), ownedPlants);
    await readQuery('userId legacy', query(collection(db, 'plants'), where('userId', '==', uid)), legacyPlants);

    if (!cancelled) {
      onChange(mergePlantMaps(ownedPlants, legacyPlants));
    }
  };

  load();

  return () => {
    cancelled = true;
  };
}

export function listenToPlant(
  id: string,
  onChange: (plant: Plant | null) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'plants', id), (snapshot) => {
    onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Plant) : null);
  }, onError);
}

export async function uploadPlantPhoto(uid: string, plantId: string, imageDataUrl: string, prefix: 'profile' | 'follow-up') {
  const fotoPath = buildPhotoPath(uid, plantId, prefix);
  const photoRef = ref(storage, fotoPath);
  await uploadString(photoRef, imageDataUrl, 'data_url', { contentType: 'image/jpeg' });
  const fotoUrl = await getDownloadURL(photoRef);
  return { fotoUrl, fotoPath };
}

export async function createPlantForUser(user: User, input: NewPlantInput) {
  await assertOwnPlantLimit(user.uid);

  const now = Date.now();
  const draft = {
    userId: user.uid,
    ownerId: user.uid,
    caregiverIds: [],
    memberIds: [user.uid],
    fotoUrl: '',
    fotoPath: '',
    nombrePersonalizado: input.customName || '',
    nombre_comun: input.plantData.nombre_comun,
    nombre_cientifico: input.plantData.nombre_cientifico,
    familia: input.plantData.familia,
    estado: input.plantData.estado,
    puntuacion_salud: input.plantData.puntuacion_salud,
    ciudad: input.city || '',
    lat: input.lat,
    lon: input.lon,
    clima_actual: input.weather,
    info_general: input.plantData.info_general,
    plan_cuidados: input.carePlan,
    fecha_creacion: now,
    historial_acciones: [
      {
        tipo: 'creacion',
        fecha: now,
        descripcion: 'Perfil creado',
      },
    ],
  };

  const docRef = await addDoc(collection(db, 'plants'), withoutUndefined(draft));

  if (input.image) {
    try {
      const photo = await uploadPlantPhoto(user.uid, docRef.id, input.image, 'profile');
      await updateDoc(docRef, withoutUndefined(photo));
    } catch (error) {
      try {
        await deleteDoc(docRef);
      } catch (cleanupError) {
        console.warn('No se pudo limpiar la planta creada despues de fallar la foto inicial.', cleanupError);
      }
      throw error;
    }
  }

  return docRef.id;
}

export async function getPlantById(id: string) {
  const snapshot = await getDoc(doc(db, 'plants', id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Plant) : null;
}

export async function deletePlant(plantId: string) {
  await deleteDoc(doc(db, 'plants', plantId));
}

export async function updatePlantFields(plantId: string, fields: Partial<Plant>) {
  await updateDoc(doc(db, 'plants', plantId), withoutUndefined(fields));
}

export async function appendPlantAction(plant: Plant, action: PlantAction, fields: Partial<Plant> = {}) {
  const newHistory = [action, ...(plant.historial_acciones || [])].slice(0, 10);
  await updatePlantFields(plant.id, {
    ...fields,
    historial_acciones: newHistory,
  });
}

export async function saveFollowUpPhoto(plant: Plant, uid: string, image: string, result: FollowUpResult) {
  const photo = await uploadPlantPhoto(uid, plant.id, image, 'follow-up');
  const now = Date.now();
  await appendPlantAction(plant, {
    tipo: 'foto',
    fecha: now,
    descripcion: result.recomendacion_inmediata || result.observaciones || 'Seguimiento con foto registrado',
  }, {
    ...photo,
    estado: result.estado || plant.estado,
    puntuacion_salud: result.puntuacion_salud ?? plant.puntuacion_salud,
    fecha_ultimo_seguimiento: now,
  });
}
