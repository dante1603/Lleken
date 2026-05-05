import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getPlantById, listenToVisiblePlants } from '../lib/plants';
import type { Plant } from '../types';
import { useAuth } from './AuthContext';

interface PlantDataContextType {
  plants: Plant[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastLoadedAt?: number;
  refreshPlants: () => Promise<void>;
  refreshPlant: (id: string) => Promise<Plant | null>;
  getCachedPlant: (id?: string) => Plant | null;
  upsertCachedPlant: (plant: Plant) => void;
  removeCachedPlant: (id: string) => void;
}

const PlantDataContext = createContext<PlantDataContextType | null>(null);

function plantDataErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No pudimos cargar tus plantas.';
}

export function PlantDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | undefined>();
  const plantsRef = useRef<Plant[]>([]);

  useEffect(() => {
    plantsRef.current = plants;
  }, [plants]);

  const receivePlants = useCallback((plantsData: Plant[]) => {
    setPlants(plantsData);
    setLastLoadedAt(Date.now());
    setError(null);
  }, []);

  useEffect(() => {
    if (!user) {
      setPlants([]);
      setLoading(false);
      setRefreshing(false);
      setLastLoadedAt(undefined);
      setError(null);
      return undefined;
    }

    const hasCachedPlants = plantsRef.current.length > 0;
    setLoading((current) => current || !hasCachedPlants);
    setRefreshing(hasCachedPlants);

    const unsubscribe = listenToVisiblePlants(user.uid, (plantsData) => {
      receivePlants(plantsData);
      setLoading(false);
      setRefreshing(false);
    }, (loadError) => {
      console.error('Error loading shared plant data:', loadError);
      setError(plantDataErrorMessage(loadError));
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [receivePlants, user]);

  const refreshPlants = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);

    await new Promise<void>((resolve) => {
      const unsubscribe = listenToVisiblePlants(user.uid, (plantsData) => {
        receivePlants(plantsData);
        setLoading(false);
        setRefreshing(false);
        unsubscribe();
        resolve();
      }, (loadError) => {
        console.error('Error refreshing shared plant data:', loadError);
        setError(plantDataErrorMessage(loadError));
        setLoading(false);
        setRefreshing(false);
        unsubscribe();
        resolve();
      });
    });
  }, [receivePlants, user]);

  const getCachedPlant = useCallback((id?: string) => {
    if (!id) return null;
    return plantsRef.current.find((plant) => plant.id === id) || null;
  }, []);

  const upsertCachedPlant = useCallback((plant: Plant) => {
    setPlants((current) => {
      const index = current.findIndex((item) => item.id === plant.id);
      if (index === -1) return [plant, ...current];

      const next = [...current];
      next[index] = plant;
      return next;
    });
  }, []);

  const removeCachedPlant = useCallback((id: string) => {
    setPlants((current) => current.filter((plant) => plant.id !== id));
  }, []);

  const refreshPlant = useCallback(async (id: string) => {
    try {
      const plant = await getPlantById(id);
      if (plant) {
        upsertCachedPlant(plant);
      } else {
        removeCachedPlant(id);
      }
      return plant;
    } catch (loadError) {
      console.error('Error refreshing plant:', loadError);
      setError(plantDataErrorMessage(loadError));
      return getCachedPlant(id);
    }
  }, [getCachedPlant, removeCachedPlant, upsertCachedPlant]);

  const value = useMemo<PlantDataContextType>(() => ({
    plants,
    loading,
    refreshing,
    error,
    lastLoadedAt,
    refreshPlants,
    refreshPlant,
    getCachedPlant,
    upsertCachedPlant,
    removeCachedPlant,
  }), [
    error,
    getCachedPlant,
    lastLoadedAt,
    loading,
    plants,
    refreshPlant,
    refreshPlants,
    refreshing,
    removeCachedPlant,
    upsertCachedPlant,
  ]);

  return (
    <PlantDataContext.Provider value={value}>
      {children}
    </PlantDataContext.Provider>
  );
}

export function usePlantData() {
  const context = useContext(PlantDataContext);
  if (!context) {
    throw new Error('usePlantData debe usarse dentro de PlantDataProvider.');
  }
  return context;
}
