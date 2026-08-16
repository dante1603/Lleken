import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeatherForPlant, isCurrentWeatherRequest, isWeatherResultForLocation } from '../weather';

describe('weather lookup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses explicit coordinates directly for the Open-Meteo forecast', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      current: { temperature_2m: 18.6, relative_humidity_2m: 61, precipitation: 0 },
      daily: { temperature_2m_max: [22.4], temperature_2m_min: [9.1], precipitation_sum: [0.2] },
    }), { status: 200 }));
    const coords = { lat: -33.4489, lon: -70.6693 };

    const result = await getWeatherForPlant('Ubicación actual', coords);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get('latitude')).toBe(String(coords.lat));
    expect(requestUrl.searchParams.get('longitude')).toBe(String(coords.lon));
    expect(result).toMatchObject({
      city: 'Ubicación actual',
      lat: coords.lat,
      lon: coords.lon,
      weather: {
        temp_actual: 18.6,
        temp_max: 22.4,
        temp_min: 9.1,
        lluvia: 0.2,
        humedad_relativa: 61,
      },
    });
  });

  it('normalizes a valid Open-Meteo response into the plant weather shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      current: { temperature_2m: 17.34, relative_humidity_2m: 58.76, precipitation: 1.04 },
      daily: { temperature_2m_max: [24.26], temperature_2m_min: [8.94], precipitation_sum: [2.08] },
    }), { status: 200 }));

    const result = await getWeatherForPlant('Santiago', { lat: -33.4489, lon: -70.6693 });

    expect(result?.weather).toEqual({
      temp_actual: 17.3,
      temp_max: 24.3,
      temp_min: 8.9,
      lluvia: 2.1,
      humedad_relativa: 58.8,
    });
    expect(result?.summary).toContain('Open-Meteo');
  });

  it('returns no weather result on forecast failure without inventing a location', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));

    const result = await getWeatherForPlant('Ubicación actual', { lat: -33.4489, lon: -70.6693 });

    expect(result).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('only accepts a cached weather result for the exact current coordinates', () => {
    const result = {
      city: 'Santiago',
      lat: -33.4489,
      lon: -70.6693,
      weather: {},
      summary: 'Contexto exterior',
    };

    expect(isWeatherResultForLocation(result, { lat: -33.4489, lon: -70.6693 })).toBe(true);
    expect(isWeatherResultForLocation(result, { lat: -33.45, lon: -70.6693 })).toBe(false);
    expect(isWeatherResultForLocation(null, { lat: -33.4489, lon: -70.6693 })).toBe(false);
  });

  it('recognizes only the latest preview request', () => {
    expect(isCurrentWeatherRequest(2, 2)).toBe(true);
    expect(isCurrentWeatherRequest(1, 2)).toBe(false);
  });
});
