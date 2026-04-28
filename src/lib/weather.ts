import { WeatherConditions } from '../types';

export interface LocationCoords {
  lat: number;
  lon: number;
}

export interface WeatherLookupResult {
  city: string;
  lat: number;
  lon: number;
  weather: WeatherConditions;
  summary: string;
}

interface GeocodingResult {
  id?: number;
  name: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  latitude: number;
  longitude: number;
}

export interface LocationSuggestion {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
}

const CHILE_LOCATION_HINTS: LocationSuggestion[] = [
  {
    id: 'cl-santiago',
    name: 'Santiago',
    displayName: 'Santiago, Region Metropolitana, Chile',
    lat: -33.4489,
    lon: -70.6693,
    country: 'Chile',
    admin1: 'Region Metropolitana',
  },
  {
    id: 'cl-providencia',
    name: 'Providencia',
    displayName: 'Providencia, Santiago, Region Metropolitana, Chile',
    lat: -33.4314,
    lon: -70.6093,
    country: 'Chile',
    admin1: 'Region Metropolitana',
    admin2: 'Santiago',
  },
  {
    id: 'cl-las-condes',
    name: 'Las Condes',
    displayName: 'Las Condes, Santiago, Region Metropolitana, Chile',
    lat: -33.4088,
    lon: -70.5674,
    country: 'Chile',
    admin1: 'Region Metropolitana',
    admin2: 'Santiago',
  },
  {
    id: 'cl-nunoa',
    name: 'Nunoa',
    displayName: 'Nunoa, Santiago, Region Metropolitana, Chile',
    lat: -33.4569,
    lon: -70.5975,
    country: 'Chile',
    admin1: 'Region Metropolitana',
    admin2: 'Santiago',
  },
  {
    id: 'cl-san-miguel',
    name: 'San Miguel',
    displayName: 'San Miguel, Santiago, Region Metropolitana, Chile',
    lat: -33.5008,
    lon: -70.6511,
    country: 'Chile',
    admin1: 'Region Metropolitana',
    admin2: 'Santiago',
  },
  {
    id: 'cl-valparaiso',
    name: 'Valparaiso',
    displayName: 'Valparaiso, Region de Valparaiso, Chile',
    lat: -33.0472,
    lon: -71.6127,
    country: 'Chile',
    admin1: 'Region de Valparaiso',
  },
  {
    id: 'cl-concepcion',
    name: 'Concepcion',
    displayName: 'Concepcion, Biobio, Chile',
    lat: -36.8260,
    lon: -73.0498,
    country: 'Chile',
    admin1: 'Biobio',
  },
];

function round(value: number | undefined) {
  return typeof value === 'number' ? Math.round(value * 10) / 10 : undefined;
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function localLocationSuggestions(input: string) {
  const normalized = normalizeSearchText(input);
  if (!normalized) return [];

  if (normalized === 'chile' || normalized === 'cl') {
    return CHILE_LOCATION_HINTS.slice(0, 6);
  }

  return CHILE_LOCATION_HINTS.filter((location) => {
    const haystack = normalizeSearchText(`${location.name} ${location.displayName}`);
    return haystack.includes(normalized);
  });
}

function distanceKm(a: LocationCoords, b: LocationCoords) {
  const earthRadiusKm = 6371;
  const latDelta = ((b.lat - a.lat) * Math.PI) / 180;
  const lonDelta = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(latDelta / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function nearestLocalLocation(coords: LocationCoords) {
  const nearest = CHILE_LOCATION_HINTS
    .map((location) => ({
      location,
      distance: distanceKm(coords, { lat: location.lat, lon: location.lon }),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return nearest && nearest.distance <= 60 ? nearest.location : null;
}

function locationDisplayName(result: GeocodingResult) {
  return [
    result.name,
    result.admin4,
    result.admin3,
    result.admin2,
    result.admin1,
    result.country,
  ].filter(Boolean).join(', ');
}

function toSuggestion(result: GeocodingResult): LocationSuggestion {
  return {
    id: String(result.id || `${result.latitude},${result.longitude},${result.name}`),
    name: result.name,
    displayName: locationDisplayName(result),
    lat: result.latitude,
    lon: result.longitude,
    country: result.country,
    admin1: result.admin1,
    admin2: result.admin2,
    admin3: result.admin3,
    admin4: result.admin4,
  };
}

export async function searchLocations(input: string, count = 6): Promise<LocationSuggestion[]> {
  const queryText = input.trim();
  if (queryText.length < 2) return [];
  const localResults = localLocationSuggestions(queryText);

  try {
    const response = await fetch(`/api/location/search?query=${encodeURIComponent(queryText)}&count=${encodeURIComponent(String(count))}`);
    if (!response.ok) return [];
    const data = await response.json();
    const remoteResults = Array.isArray(data.results) ? data.results as LocationSuggestion[] : [];
    const merged = new Map<string, LocationSuggestion>();
    [...localResults, ...remoteResults].forEach((result) => merged.set(result.id, result));
    return Array.from(merged.values()).slice(0, count);
  } catch (error) {
    console.warn('No se pudo buscar ubicaciones.', error);
    return localResults.slice(0, count);
  }
}

export async function reverseGeocodeLocation(coords: LocationCoords): Promise<LocationSuggestion | null> {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    language: 'es',
    format: 'json',
  });

  try {
    const response = await fetch(`/api/location/reverse?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.result || nearestLocalLocation(coords);
  } catch (error) {
    console.warn('No se pudo resolver ubicacion actual.', error);
    return nearestLocalLocation(coords);
  }
}

async function geocodeCity(city: string): Promise<GeocodingResult | null> {
  const parts = city
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const searchName = parts[0] || city;
  const locationHints = parts.slice(1).map((part) => part.toLowerCase());
  const params = new URLSearchParams({
    name: searchName,
    count: '10',
    language: 'es',
    format: 'json',
  });
  try {
    const results = await searchLocations(params.get('name') || searchName, 10);
    if (results.length === 0) return null;

    const hinted = locationHints.length > 0
      ? results.find((result) => {
        const haystack = [result.country, result.admin1, result.admin2, result.admin3, result.admin4].filter(Boolean).join(' ').toLowerCase();
        return locationHints.some((hint) => haystack.includes(hint));
      })
      : null;

    const selected = hinted || results.find((result) => result.country === 'Chile') || results[0] || null;
    return selected
      ? {
        id: Number(selected.id) || undefined,
        name: selected.name,
        country: selected.country,
        admin1: selected.admin1,
        admin2: selected.admin2,
        admin3: selected.admin3,
        admin4: selected.admin4,
        latitude: selected.lat,
        longitude: selected.lon,
      }
      : null;
  } catch (error) {
    console.warn('No se pudo geocodificar ciudad para clima.', error);
    return null;
  }
}

async function fetchForecast(coords: LocationCoords): Promise<ForecastResponse | null> {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current: 'temperature_2m,relative_humidity_2m,precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
    forecast_days: '3',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.warn('No se pudo consultar pronostico para clima.', error);
    return null;
  }
}

export async function getWeatherForPlant(city: string, coords?: LocationCoords | null): Promise<WeatherLookupResult | null> {
  let resolvedCity = city.trim();
  let resolvedCoords = coords || null;

  if (!resolvedCoords && resolvedCity) {
    const geocoded = await geocodeCity(resolvedCity);
    if (geocoded) {
      resolvedCoords = { lat: geocoded.latitude, lon: geocoded.longitude };
      resolvedCity = locationDisplayName(geocoded);
    }
  }

  if (!resolvedCoords) return null;

  const forecast = await fetchForecast(resolvedCoords);
  if (!forecast) return null;

  const weather: WeatherConditions = {
    temp_actual: round(forecast.current?.temperature_2m),
    temp_max: round(forecast.daily?.temperature_2m_max?.[0]),
    temp_min: round(forecast.daily?.temperature_2m_min?.[0]),
    lluvia: round(forecast.daily?.precipitation_sum?.[0] ?? forecast.current?.precipitation),
    humedad_relativa: round(forecast.current?.relative_humidity_2m),
  };

  const summary = [
    `Ubicacion: ${resolvedCity || `${resolvedCoords.lat}, ${resolvedCoords.lon}`}`,
    `Temperatura actual: ${weather.temp_actual ?? 'sin dato'} C`,
    `Maxima hoy: ${weather.temp_max ?? 'sin dato'} C`,
    `Minima hoy: ${weather.temp_min ?? 'sin dato'} C`,
    `Lluvia estimada hoy: ${weather.lluvia ?? 0} mm`,
    `Humedad relativa actual: ${weather.humedad_relativa ?? 'sin dato'}%`,
  ].join('\n');

  return {
    city: resolvedCity || city || 'Ubicacion actual',
    lat: resolvedCoords.lat,
    lon: resolvedCoords.lon,
    weather,
    summary,
  };
}
