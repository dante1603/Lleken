import { describe, expect, it } from 'vitest';
import { deriveOnboardingStatus, isOnboardingIdentityCurrent, resolveOnboarding } from '../onboarding';

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

  it('completes and requests reconciliation when an incomplete profile has an owned plant', () => {
    expect(resolveOnboarding({ onboarding_started_at: '2026-08-15T12:00:00Z', onboarding_completed_at: null }, [{ ownerId: 'user-a' }], 'user-a'))
      .toEqual({ status: 'completed', reconciliationRequired: true });
  });

  it('does not complete from a shared plant alone', () => {
    expect(resolveOnboarding({ onboarding_started_at: '2026-08-15T12:00:00Z', onboarding_completed_at: null }, [{ ownerId: 'user-b' }], 'user-a'))
      .toEqual({ status: 'in_progress', reconciliationRequired: false });
  });

  it('rejects a callback for UID A after the active identity becomes UID B', () => {
    expect(isOnboardingIdentityCurrent('user-a', 4, 'user-b', 5)).toBe(false);
  });
});
