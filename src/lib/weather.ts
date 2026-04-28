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
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
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

function round(value: number | undefined) {
  return typeof value === 'number' ? Math.round(value * 10) / 10 : undefined;
}

async function geocodeCity(city: string): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: 'es',
    format: 'json',
  });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.results?.[0] || null;
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
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) return null;
  return response.json();
}

export async function getWeatherForPlant(city: string, coords?: LocationCoords | null): Promise<WeatherLookupResult | null> {
  let resolvedCity = city.trim();
  let resolvedCoords = coords || null;

  if (!resolvedCoords && resolvedCity) {
    const geocoded = await geocodeCity(resolvedCity);
    if (geocoded) {
      resolvedCoords = { lat: geocoded.latitude, lon: geocoded.longitude };
      resolvedCity = [geocoded.name, geocoded.admin1, geocoded.country].filter(Boolean).join(', ');
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
  };

  const summary = [
    `Ubicacion: ${resolvedCity || `${resolvedCoords.lat}, ${resolvedCoords.lon}`}`,
    `Temperatura actual: ${weather.temp_actual ?? 'sin dato'} C`,
    `Maxima hoy: ${weather.temp_max ?? 'sin dato'} C`,
    `Minima hoy: ${weather.temp_min ?? 'sin dato'} C`,
    `Lluvia estimada hoy: ${weather.lluvia ?? 0} mm`,
  ].join('\n');

  return {
    city: resolvedCity || city || 'Ubicacion actual',
    lat: resolvedCoords.lat,
    lon: resolvedCoords.lon,
    weather,
    summary,
  };
}
