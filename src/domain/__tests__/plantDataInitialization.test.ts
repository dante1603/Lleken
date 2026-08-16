import { describe, expect, it } from 'vitest';
import {
  failBeforeGarden,
  failPlantCollection,
  finishPlantDataInitialization,
  idlePlantDataInitialization,
  retainInitializationGarden,
  startPlantDataInitialization,
} from '../plantDataInitialization';
import { isPlantDataIdentityCurrent, isPlantSnapshotVisible } from '../plantDataIdentity';

const garden = { id: 'garden-1', ownerId: 'user-1', name: 'Mi jardín' };

describe('plant data initialization', () => {
  it('starts idle', () => {
    expect(idlePlantDataInitialization()).toEqual({ status: 'idle', garden: null, error: null });
  });

  it('moves from idle to loading', () => {
    expect(startPlantDataInitialization()).toEqual({ status: 'loading', garden: null, error: null });
  });

  it('finishes ready only after retaining a Garden', () => {
    const loading = retainInitializationGarden(startPlantDataInitialization(), garden);
    expect(finishPlantDataInitialization(loading)).toEqual({ status: 'ready', garden, error: null });
  });

  it('fails before Garden without retaining one', () => {
    expect(failBeforeGarden()).toEqual({ status: 'error', garden: null, error: 'No pudimos cargar tu jardín.' });
  });

  it('retains Garden when the plant collection fails', () => {
    expect(failPlantCollection(garden)).toEqual({ status: 'error', garden, error: 'No pudimos cargar tu jardín.' });
  });

  it('retries from an error as loading with the blocking error cleared', () => {
    expect(startPlantDataInitialization()).toEqual({ status: 'loading', garden: null, error: null });
  });

  it('resets/logout to idle with no Garden', () => {
    expect(idlePlantDataInitialization()).toEqual({ status: 'idle', garden: null, error: null });
  });

  it('never produces ready without a Garden', () => {
    expect(() => finishPlantDataInitialization(startPlantDataInitialization())).toThrow(/without a Garden/);
  });

  it('does not expose a prior snapshot after logout or a UID change', () => {
    expect(isPlantSnapshotVisible('user-a', undefined)).toBe(false);
    expect(isPlantSnapshotVisible('user-a', 'user-b')).toBe(false);
    expect(isPlantSnapshotVisible('user-b', 'user-b')).toBe(true);
  });

  it('rejects late callbacks from an older UID generation', () => {
    expect(isPlantDataIdentityCurrent('user-a', 1, 'user-b', 2)).toBe(false);
    expect(isPlantDataIdentityCurrent('user-a', 1, 'user-a', 1)).toBe(true);
    expect(isPlantDataIdentityCurrent('user-b', 2, 'user-b', 2)).toBe(true);
  });
});
