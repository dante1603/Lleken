import { describe, expect, it } from 'vitest';
import { deriveOnboardingStatus, isOnboardingIdentityCurrent, resolveCurrentOnboarding, resolveOnboarding } from '../onboarding';

describe('onboarding domain', () => {
  it('derives not_started without timestamps', () => {
    expect(deriveOnboardingStatus({ onboarding_started_at: null, onboarding_completed_at: null })).toBe('not_started');
  });

  it('derives in_progress from a start timestamp', () => {
    expect(deriveOnboardingStatus({ onboarding_started_at: '2026-08-15T12:00:00Z', onboarding_completed_at: null })).toBe('in_progress');
  });

  it('derives completed from a completion timestamp', () => {
    expect(deriveOnboardingStatus({ onboarding_started_at: null, onboarding_completed_at: '2026-08-15T12:00:00Z' })).toBe('completed');
  });

  it('keeps a completed empty garden as returning', () => {
    expect(resolveOnboarding({ onboarding_started_at: null, onboarding_completed_at: '2026-08-15T12:00:00Z' }, [], 'user-a'))
      .toEqual({ status: 'completed', reconciliationRequired: false });
  });

  it('completes and requests reconciliation when an incomplete profile has a confirmed owned plant', () => {
    expect(resolveOnboarding({ onboarding_started_at: '2026-08-15T12:00:00Z', onboarding_completed_at: null }, [{ ownerId: 'user-a', speciesId: 'species-a' }], 'user-a'))
      .toEqual({ status: 'completed', reconciliationRequired: true });
  });

  it('does not complete from an own plant whose identification is still unconfirmed', () => {
    expect(resolveOnboarding({ onboarding_started_at: '2026-08-15T12:00:00Z', onboarding_completed_at: null }, [{ ownerId: 'user-a' }], 'user-a'))
      .toEqual({ status: 'in_progress', reconciliationRequired: false });
  });

  it('does not complete from a shared plant alone', () => {
    expect(resolveOnboarding({ onboarding_started_at: '2026-08-15T12:00:00Z', onboarding_completed_at: null }, [{ ownerId: 'user-b', speciesId: 'species-b' }], 'user-a'))
      .toEqual({ status: 'in_progress', reconciliationRequired: false });
  });

  it('rejects a callback for UID A after the active identity becomes UID B', () => {
    expect(isOnboardingIdentityCurrent('user-a', 4, 'user-b', 5)).toBe(false);
  });

  it('does not derive or reconcile a stale UID A snapshot while UID B is current', () => {
    expect(resolveCurrentOnboarding({
      uid: 'user-a',
      timestamps: { onboarding_started_at: null, onboarding_completed_at: '2026-08-15T12:00:00Z' },
    }, 'user-b', [{ ownerId: 'user-b' }])).toBeNull();
  });
});
