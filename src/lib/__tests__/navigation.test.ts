import { describe, expect, it } from 'vitest';
import {
  getOriginRoute,
  readNavigation,
  toOriginChildNavigation,
  toPlantChildNavigation,
  withOnboarding,
  withNavigation,
} from '../navigation';

describe('navigation contract', () => {
  it('reads a valid home origin', () => {
    expect(readNavigation({ navigation: { origin: { surface: 'home' } } })).toEqual({
      origin: { surface: 'home' },
    });
  });

  it('reads a valid plants origin with its view', () => {
    expect(readNavigation({ navigation: {
      origin: { surface: 'plants', view: { searchQuery: 'aloe', activeFilter: 'revisar', sortBy: 'nombre' } },
    } })).toEqual({
      origin: { surface: 'plants', view: { searchQuery: 'aloe', activeFilter: 'revisar', sortBy: 'nombre' } },
    });
  });

  it('reads a valid calendar origin with YYYY-MM-DD dates', () => {
    expect(readNavigation({ navigation: {
      origin: { surface: 'calendar', view: { selectedDate: '2026-08-15', monthDate: '2026-08-01' } },
    } })).toEqual({
      origin: { surface: 'calendar', view: { selectedDate: '2026-08-15', monthDate: '2026-08-01' } },
    });
  });

  it('rejects invalid calendar dates', () => {
    expect(readNavigation({ navigation: {
      origin: { surface: 'calendar', view: { selectedDate: '2026-02-30', monthDate: '2026-02-01' } },
    } })).toBeUndefined();
  });

  it('rejects unknown surfaces, filters, sorts, tabs and parents', () => {
    const validOrigin = { surface: 'plants', view: { searchQuery: '', activeFilter: 'todas', sortBy: 'reciente' } };
    expect(readNavigation({ navigation: { origin: { surface: 'unknown' } } })).toBeUndefined();
    expect(readNavigation({ navigation: { origin: { ...validOrigin, view: { ...validOrigin.view, activeFilter: 'all' } } } })).toBeUndefined();
    expect(readNavigation({ navigation: { origin: { ...validOrigin, view: { ...validOrigin.view, sortBy: 'date' } } } })).toBeUndefined();
    expect(readNavigation({ navigation: { origin: validOrigin, parent: 'page' } })).toBeUndefined();
    expect(readNavigation({ navigation: { origin: validOrigin, plantTab: 'overview' } })).toBeUndefined();
  });

  it('falls back to home when the origin has no valid route', () => {
    expect(getOriginRoute(undefined)).toBe('/home');
  });

  it('keeps origin and tab for a child opened from Plant', () => {
    expect(toPlantChildNavigation({ origin: { surface: 'home' }, plantTab: 'history' })).toEqual({
      origin: { surface: 'home' }, parent: 'plant', plantTab: 'history',
    });
  });

  it('keeps origin and marks a direct surface child', () => {
    expect(toOriginChildNavigation({ surface: 'home' })).toEqual({
      origin: { surface: 'home' }, parent: 'origin',
    });
  });

  it('combines navigation with an image payload', () => {
    const result = withNavigation({ image: 'data:image/jpeg;base64,AA==' }, { origin: { surface: 'home' } });
    expect(result.image).toContain('data:image');
    expect(result.navigation.origin.surface).toBe('home');
  });

  it('combines navigation with the Species payload without losing plant metadata', () => {
    const result = withNavigation({ plantPhotoUrl: 'photo-url', plantName: 'Monstera' }, { origin: { surface: 'home' } });
    expect(result).toMatchObject({ plantPhotoUrl: 'photo-url', plantName: 'Monstera', navigation: { origin: { surface: 'home' } } });
  });

  it('preserves the onboarding intent across wizard payloads only when active', () => {
    expect(withOnboarding({ image: 'photo' }, true)).toEqual({ image: 'photo', onboarding: true });
    expect(withOnboarding({ image: 'photo' }, false)).toEqual({ image: 'photo' });
  });
});
