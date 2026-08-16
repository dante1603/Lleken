import type { OnboardingTimestamps } from '../domain/onboarding';
import { supabase } from './supabase';

export async function getOnboardingTimestamps(uid: string): Promise<OnboardingTimestamps> {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_started_at, onboarding_completed_at')
    .eq('id', uid)
    .single();

  if (error) throw error;
  return {
    onboarding_started_at: data.onboarding_started_at ?? null,
    onboarding_completed_at: data.onboarding_completed_at ?? null,
  };
}

function normalizeTimestamps(data: { onboarding_started_at?: string | null; onboarding_completed_at?: string | null }): OnboardingTimestamps {
  return {
    onboarding_started_at: data.onboarding_started_at ?? null,
    onboarding_completed_at: data.onboarding_completed_at ?? null,
  };
}

async function markOnboardingTimestamp(uid: string, column: 'onboarding_started_at' | 'onboarding_completed_at'): Promise<OnboardingTimestamps> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ [column]: new Date().toISOString() })
    .eq('id', uid)
    .is(column, null)
    .select('onboarding_started_at, onboarding_completed_at')
    .maybeSingle();

  if (error) throw error;
  if (data) return normalizeTimestamps(data);

  const timestamps = await getOnboardingTimestamps(uid);
  if (!timestamps[column]) throw new Error('No pudimos confirmar la actualización de tu activación.');
  return timestamps;
}

export function markOnboardingStarted(uid: string): Promise<OnboardingTimestamps> {
  return markOnboardingTimestamp(uid, 'onboarding_started_at');
}

export function markOnboardingCompleted(uid: string): Promise<OnboardingTimestamps> {
  return markOnboardingTimestamp(uid, 'onboarding_completed_at');
}
