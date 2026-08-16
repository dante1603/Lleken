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

export async function markOnboardingStarted(uid: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_started_at: new Date().toISOString() })
    .eq('id', uid)
    .is('onboarding_started_at', null);

  if (error) throw error;
}

export async function markOnboardingCompleted(uid: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', uid)
    .is('onboarding_completed_at', null);

  if (error) throw error;
}
