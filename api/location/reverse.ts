import type { LocationSuggestion } from '../../src/lib/weather';

type OpenMeteoGeocodingResult = {
  id?: number;
  name: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  latitude: number;
  longitude: number;
};

function displayName(result: OpenMeteoGeocodingResult) {
  return [
    result.name,
    result.admin4,
    result.admin3,
    result.admin2,
    result.admin1,
    result.country,
  ].filter(Boolean).join(', ');
}

function toSuggestion(result: OpenMeteoGeocodingResult): LocationSuggestion {
  return {
    id: String(result.id || `${result.latitude},${result.longitude},${result.name}`),
    name: result.name,
    displayName: displayName(result),
    lat: result.latitude,
    lon: result.longitude,
    country: result.country,
    admin1: result.admin1,
    admin2: result.admin2,
    admin3: result.admin3,
    admin4: result.admin4,
  };
}

export default async function handler(request: any, response: any) {
  try {
    const latitude = Number(request.query.latitude);
    const longitude = Number(request.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return response.status(400).json({ error: 'Invalid coordinates.' });
    }

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      language: 'es',
      format: 'json',
    });
    const apiResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?${params}`);
    if (!apiResponse.ok) {
      return response.status(200).json({ result: null });
    }
    const data = await apiResponse.json();
    const result = Array.isArray(data.results) ? data.results[0] as OpenMeteoGeocodingResult | undefined : undefined;
    return response.status(200).json({ result: result ? toSuggestion(result) : null });
  } catch (error) {
    console.error('location-reverse failed:', error);
    return response.status(200).json({ result: null });
  }
}
