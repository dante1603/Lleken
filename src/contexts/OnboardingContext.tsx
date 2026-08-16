import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { deriveOnboardingStatus, isOnboardingIdentityCurrent, resolveOnboarding, type OnboardingTimestamps } from '../domain/onboarding';
import { getOnboardingTimestamps, markOnboardingCompleted, markOnboardingStarted } from '../lib/onboarding';
import { useAuth } from './AuthContext';
import { usePlantData } from './PlantDataContext';

type OnboardingRuntimeStatus = 'loading' | 'not_started' | 'in_progress' | 'completed' | 'error';

type OnboardingContextValue = {
  status: OnboardingRuntimeStatus;
  error: string | null;
  startOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  retryOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);
const emptyTimestamps: OnboardingTimestamps = { onboarding_started_at: null, onboarding_completed_at: null };

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { plants } = usePlantData();
  const uid = user?.uid;
  const uidRef = useRef<string | undefined>(uid);
  const generationRef = useRef(0);
  const statusUidRef = useRef<string | undefined>(undefined);
  const reconciliationRef = useRef<string | undefined>(undefined);
  const timestampsRef = useRef<OnboardingTimestamps>(emptyTimestamps);
  const [timestamps, setTimestamps] = useState<OnboardingTimestamps>(emptyTimestamps);
  const [status, setStatus] = useState<OnboardingRuntimeStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  if (uidRef.current !== uid) {
    uidRef.current = uid;
    generationRef.current += 1;
    timestampsRef.current = emptyTimestamps;
    statusUidRef.current = undefined;
    reconciliationRef.current = undefined;
  }

  const isCurrent = useCallback((targetUid: string, generation: number) => (
    isOnboardingIdentityCurrent(targetUid, generation, uidRef.current, generationRef.current)
  ), []);

  const load = useCallback(async () => {
    const targetUid = uidRef.current;
    if (!targetUid) {
      timestampsRef.current = emptyTimestamps;
      statusUidRef.current = undefined;
      reconciliationRef.current = undefined;
      setTimestamps(emptyTimestamps);
      setStatus('loading');
      setError(null);
      return;
    }

    const generation = generationRef.current;
    statusUidRef.current = targetUid;
    setStatus('loading');
    setError(null);
    reconciliationRef.current = undefined;
    try {
      const next = await getOnboardingTimestamps(targetUid);
      if (!isCurrent(targetUid, generation)) return;
      timestampsRef.current = next;
      setTimestamps(next);
      setStatus(deriveOnboardingStatus(next));
    } catch (loadError) {
      if (!isCurrent(targetUid, generation)) return;
      setStatus('error');
      setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar tu activación.');
    }
  }, [isCurrent]);

  useEffect(() => { void load(); }, [load, uid]);

  const resolution = uid ? resolveOnboarding(timestamps, plants, uid) : null;
  useEffect(() => {
    if (!uid || status === 'error' || status === 'loading' || !resolution) return;
    setStatus(resolution.status);
    if (!resolution.reconciliationRequired) return;
    const generation = generationRef.current;
    const reconciliationKey = `${uid}:${generation}`;
    if (reconciliationRef.current === reconciliationKey) return;
    reconciliationRef.current = reconciliationKey;
    void markOnboardingCompleted(uid)
      .then(() => {
        if (!isCurrent(uid, generation)) return;
        const next = { ...timestampsRef.current, onboarding_completed_at: timestampsRef.current.onboarding_completed_at || new Date().toISOString() };
        timestampsRef.current = next;
        setTimestamps(next);
        setStatus('completed');
      })
      .catch((reconciliationError) => {
        if (!isCurrent(uid, generation)) return;
        reconciliationRef.current = undefined;
        setStatus('error');
        setError(reconciliationError instanceof Error ? reconciliationError.message : 'No pudimos reconciliar tu activación.');
      });
  }, [isCurrent, resolution, status, uid]);

  const update = useCallback(async (operation: 'start' | 'complete') => {
    const targetUid = uidRef.current;
    if (!targetUid) throw new Error('No hay una sesión activa.');
    const generation = generationRef.current;
    try {
      if (operation === 'start') await markOnboardingStarted(targetUid);
      else await markOnboardingCompleted(targetUid);
    } catch (updateError) {
      if (isCurrent(targetUid, generation)) {
        setStatus('error');
        setError(updateError instanceof Error ? updateError.message : 'No pudimos actualizar tu activación.');
      }
      throw updateError;
    }
    if (!isCurrent(targetUid, generation)) return;
    const next = operation === 'start'
      ? { ...timestampsRef.current, onboarding_started_at: timestampsRef.current.onboarding_started_at || new Date().toISOString() }
      : { ...timestampsRef.current, onboarding_completed_at: timestampsRef.current.onboarding_completed_at || new Date().toISOString() };
    timestampsRef.current = next;
    setTimestamps(next);
    setStatus(operation === 'start' ? 'in_progress' : 'completed');
    setError(null);
  }, [isCurrent]);

  const value = useMemo<OnboardingContextValue>(() => ({
    status: statusUidRef.current === uid ? status : 'loading',
    error,
    startOnboarding: () => update('start'),
    completeOnboarding: () => update('complete'),
    retryOnboarding: load,
  }), [error, load, status, uid, update]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding debe usarse dentro de OnboardingProvider.');
  return context;
}
