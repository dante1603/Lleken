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

function toSuggestion(result: OpenMeteoGeocodingResult) {
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
    const query = String(request.query.query || '').trim();
    const count = Number(request.query.count || 6);
    if (query.length < 2) {
      return response.status(200).json({ results: [] });
    }

    const params = new URLSearchParams({
      name: query,
      count: String(Number.isFinite(count) ? count : 6),
      language: 'es',
      format: 'json',
    });
    const apiResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!apiResponse.ok) {
      return response.status(200).json({ results: [] });
    }

    const data = await apiResponse.json();
    const results = Array.isArray(data.results) ? data.results as OpenMeteoGeocodingResult[] : [];
    return response.status(200).json({ results: results.map(toSuggestion) });
  } catch (error) {
    console.error('location-search failed:', error);
    return response.status(200).json({ results: [] });
  }
}
