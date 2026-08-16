import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { deriveOnboardingStatus, isOnboardingIdentityCurrent, onboardingEvidenceKey, resolveCurrentOnboarding, type OnboardingSnapshot, type OnboardingTimestamps } from '../domain/onboarding';
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
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
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
      setSnapshot(null);
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
      setSnapshot({ uid: targetUid, timestamps: next });
      setStatus(deriveOnboardingStatus(next));
    } catch (loadError) {
      if (!isCurrent(targetUid, generation)) return;
      setStatus('error');
      setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar tu activación.');
    }
  }, [isCurrent]);

  useEffect(() => { void load(); }, [load, uid]);

  const resolution = resolveCurrentOnboarding(snapshot, uid, plants);
  useEffect(() => {
    if (!uid || status === 'loading' || !resolution) return;
    if (!resolution.reconciliationRequired) {
      if (status !== 'error') setStatus(resolution.status);
      return;
    }
    const generation = generationRef.current;
    const reconciliationKey = `${uid}:${generation}:${onboardingEvidenceKey(plants, uid)}`;
    if (reconciliationRef.current === reconciliationKey) return;
    reconciliationRef.current = reconciliationKey;
    void markOnboardingCompleted(uid)
      .then((next) => {
        if (!isCurrent(uid, generation)) return;
        timestampsRef.current = next;
        setSnapshot({ uid, timestamps: next });
        setStatus('completed');
      })
      .catch((reconciliationError) => {
        if (!isCurrent(uid, generation)) return;
        setStatus('error');
        setError(reconciliationError instanceof Error ? reconciliationError.message : 'No pudimos reconciliar tu activación.');
      });
  }, [isCurrent, resolution, status, uid]);

  const update = useCallback(async (operation: 'start' | 'complete') => {
    const targetUid = uidRef.current;
    if (!targetUid) throw new Error('No hay una sesión activa.');
    const generation = generationRef.current;
    try {
      const next = operation === 'start'
        ? await markOnboardingStarted(targetUid)
        : await markOnboardingCompleted(targetUid);
      if (!isCurrent(targetUid, generation)) return;
      timestampsRef.current = next;
      setSnapshot({ uid: targetUid, timestamps: next });
      setStatus(deriveOnboardingStatus(next));
      setError(null);
    } catch (updateError) {
      if (isCurrent(targetUid, generation)) {
        setStatus('error');
        setError(updateError instanceof Error ? updateError.message : 'No pudimos actualizar tu activación.');
      }
      throw updateError;
    }
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
