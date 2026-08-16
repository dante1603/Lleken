import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  failBeforeGarden,
  failPlantCollection,
  finishPlantDataInitialization,
  idlePlantDataInitialization,
  retainInitializationGarden,
  startPlantDataInitialization,
  type PlantDataInitialization,
  type PlantDataInitializationStatus,
} from '../domain/plantDataInitialization';
import type { Garden } from '../domain/garden';
import { ensurePersonalGardenForUser } from '../lib/gardens';
import { getPlantById, listenToVisiblePlants } from '../lib/plants';
import type { Plant } from '../types';
import { useAuth } from './AuthContext';

interface PlantDataContextType {
  plants: Plant[];
  garden: Garden | null;
  initializationStatus: PlantDataInitializationStatus;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastLoadedAt?: number;
  retryInitialization: () => Promise<void>;
  refreshPlants: () => Promise<void>;
  refreshPlant: (id: string) => Promise<Plant | null>;
  getCachedPlant: (id?: string) => Plant | null;
  upsertCachedPlant: (plant: Plant) => void;
  removeCachedPlant: (id: string) => void;
}

const PlantDataContext = createContext<PlantDataContextType | null>(null);

export function PlantDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [plants, setPlants] = useState<Plant[]>([]);
  const [initialization, setInitialization] = useState<PlantDataInitialization>(idlePlantDataInitialization);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | undefined>();
  const plantsRef = useRef<Plant[]>([]);
  const plantsUidRef = useRef<string | undefined>(undefined);
  const uidRef = useRef<string | undefined>(uid);
  const initializationUidRef = useRef<string | undefined>(undefined);
  const generationRef = useRef(0);
  const initializationRef = useRef<PlantDataInitialization>(initialization);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  // UID is the initialization key. This hides A synchronously before B can render it.
  if (uidRef.current !== uid) {
    uidRef.current = uid;
    generationRef.current += 1;
    plantsRef.current = [];
    plantsUidRef.current = undefined;
  }

  const commitInitialization = useCallback((next: PlantDataInitialization) => {
    initializationRef.current = next;
    setInitialization(next);
  }, []);

  const isCurrentGeneration = useCallback((generation: number, targetUid: string) => (
    generationRef.current === generation && uidRef.current === targetUid
  ), []);

  const resetForNoUser = useCallback(() => {
    initializationUidRef.current = undefined;
    plantsRef.current = [];
    plantsUidRef.current = undefined;
    setPlants([]);
    setLastLoadedAt(undefined);
    setRefreshing(false);
    commitInitialization(idlePlantDataInitialization());
  }, [commitInitialization]);

  const initialize = useCallback((targetUid: string) => {
    const generation = ++generationRef.current;
    initializationUidRef.current = targetUid;
    unsubscribeRef.current?.();
    unsubscribeRef.current = undefined;
    plantsRef.current = [];
    plantsUidRef.current = undefined;
    setPlants([]);
    setLastLoadedAt(undefined);
    setRefreshing(false);
    commitInitialization(startPlantDataInitialization());

    void ensurePersonalGardenForUser(targetUid)
      .then((garden) => {
        if (!isCurrentGeneration(generation, targetUid)) return;

        commitInitialization(retainInitializationGarden(startPlantDataInitialization(), garden));
        const unsubscribe = listenToVisiblePlants(targetUid, (plantsData) => {
          if (!isCurrentGeneration(generation, targetUid)) return;

          plantsRef.current = plantsData;
          plantsUidRef.current = targetUid;
          setPlants(plantsData);
          setLastLoadedAt(Date.now());
          setRefreshing(false);
          commitInitialization(finishPlantDataInitialization(retainInitializationGarden(startPlantDataInitialization(), garden)));
        }, (loadError) => {
          console.error('Error loading shared plant data:', loadError);
          if (!isCurrentGeneration(generation, targetUid)) return;

          setRefreshing(false);
          commitInitialization(failPlantCollection(garden));
        });

        if (isCurrentGeneration(generation, targetUid)) unsubscribeRef.current = unsubscribe;
        else unsubscribe();
      })
      .catch((loadError) => {
        console.error('Error ensuring personal Garden:', loadError);
        if (!isCurrentGeneration(generation, targetUid)) return;

        setRefreshing(false);
        commitInitialization(failBeforeGarden());
      });
  }, [commitInitialization, isCurrentGeneration]);

  useEffect(() => {
    if (!uid) {
      generationRef.current += 1;
      unsubscribeRef.current?.();
      unsubscribeRef.current = undefined;
      resetForNoUser();
      return undefined;
    }

    initialize(uid);
    return () => {
      generationRef.current += 1;
      unsubscribeRef.current?.();
      unsubscribeRef.current = undefined;
    };
  }, [initialize, resetForNoUser, uid]);

  const retryInitialization = useCallback(async () => {
    const targetUid = uidRef.current;
    if (!targetUid) {
      resetForNoUser();
      return;
    }
    initialize(targetUid);
  }, [initialize, resetForNoUser]);

  const refreshPlants = useCallback(async () => {
    const targetUid = uidRef.current;
    if (!targetUid || initializationRef.current.status !== 'ready') return;

    const generation = generationRef.current;
    setRefreshing(true);
    await new Promise<void>((resolve) => {
      let unsubscribe: () => void = () => undefined;
      unsubscribe = listenToVisiblePlants(targetUid, (plantsData) => {
        if (isCurrentGeneration(generation, targetUid)) {
          plantsRef.current = plantsData;
          plantsUidRef.current = targetUid;
          setPlants(plantsData);
          setLastLoadedAt(Date.now());
          setRefreshing(false);
        }
        unsubscribe();
        resolve();
      }, (loadError) => {
        console.error('Error refreshing shared plant data:', loadError);
        if (isCurrentGeneration(generation, targetUid)) setRefreshing(false);
        unsubscribe();
        resolve();
      });
    });
  }, [isCurrentGeneration]);

  const getCachedPlant = useCallback((id?: string) => {
    if (!id || plantsUidRef.current !== uidRef.current) return null;
    return plantsRef.current.find((plant) => plant.id === id) || null;
  }, []);

  const upsertCachedPlant = useCallback((plant: Plant) => {
    if (!uidRef.current || plantsUidRef.current !== uidRef.current) return;
    setPlants((current) => {
      const index = current.findIndex((item) => item.id === plant.id);
      const next = index === -1 ? [plant, ...current] : current.map((item, itemIndex) => itemIndex === index ? plant : item);
      plantsRef.current = next;
      return next;
    });
  }, []);

  const removeCachedPlant = useCallback((id: string) => {
    if (plantsUidRef.current !== uidRef.current) return;
    setPlants((current) => {
      const next = current.filter((plant) => plant.id !== id);
      plantsRef.current = next;
      return next;
    });
  }, []);

  const refreshPlant = useCallback(async (id: string) => {
    try {
      const plant = await getPlantById(id);
      if (plant) upsertCachedPlant(plant);
      else removeCachedPlant(id);
      return plant;
    } catch (loadError) {
      console.error('Error refreshing plant:', loadError);
      return getCachedPlant(id);
    }
  }, [getCachedPlant, removeCachedPlant, upsertCachedPlant]);

  const isCurrentPlants = plantsUidRef.current === uid;
  const effectiveInitialization = uid && initializationUidRef.current !== uid
    ? startPlantDataInitialization()
    : initialization;
  const value = useMemo<PlantDataContextType>(() => ({
    plants: isCurrentPlants ? plants : [],
    garden: effectiveInitialization.garden,
    initializationStatus: effectiveInitialization.status,
    loading: effectiveInitialization.status === 'loading',
    refreshing,
    error: effectiveInitialization.error,
    lastLoadedAt: isCurrentPlants ? lastLoadedAt : undefined,
    retryInitialization,
    refreshPlants,
    refreshPlant,
    getCachedPlant,
    upsertCachedPlant,
    removeCachedPlant,
  }), [effectiveInitialization, getCachedPlant, isCurrentPlants, lastLoadedAt, plants, refreshPlant, refreshPlants, refreshing, removeCachedPlant, retryInitialization, upsertCachedPlant]);

  return <PlantDataContext.Provider value={value}>{children}</PlantDataContext.Provider>;
}

export function usePlantData() {
  const context = useContext(PlantDataContext);
  if (!context) throw new Error('usePlantData debe usarse dentro de PlantDataProvider.');
  return context;
}
