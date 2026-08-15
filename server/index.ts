import dotenv from 'dotenv';
import express from 'express';
import {
  PLANT_KNOWLEDGE_BASE,
  PLANT_KNOWLEDGE_VERSION,
} from '../src/lib/plantKnowledge';
import {
  DYNAMIC_PLANT_KNOWLEDGE_COLLECTION_VERSION,
  dynamicPlantKnowledgeRepository,
  ensureDynamicPlantKnowledge,
} from './dynamicPlantKnowledge';
import { toAiHttpError } from './ai/errors';
import { getGeminiClient, GEMINI_MODEL, summarizeGeminiUsage } from './ai/gemini';
import { createAiHttpHandler } from './ai/http';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = Number(process.env.API_PORT || 8787);

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

function locationDisplayName(result: OpenMeteoGeocodingResult) {
  return [result.name, result.admin4, result.admin3, result.admin2, result.admin1, result.country]
    .filter(Boolean)
    .join(', ');
}

function toLocationSuggestion(result: OpenMeteoGeocodingResult) {
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

export async function searchOpenMeteoLocations(query: string, count: number) {
  const params = new URLSearchParams({ name: query, count: String(count), language: 'es', format: 'json' });
  const apiResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!apiResponse.ok) throw new Error(`Open-Meteo geocoding failed: ${apiResponse.status}`);
  const data = await apiResponse.json();
  const results = Array.isArray(data.results) ? data.results as OpenMeteoGeocodingResult[] : [];
  return results.map(toLocationSuggestion);
}

export async function reverseOpenMeteoLocation(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    language: 'es',
    format: 'json',
  });
  const apiResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?${params}`);
  if (!apiResponse.ok) throw new Error(`Open-Meteo reverse geocoding failed: ${apiResponse.status}`);
  const data = await apiResponse.json();
  const result = Array.isArray(data.results)
    ? data.results[0] as OpenMeteoGeocodingResult | undefined
    : undefined;
  return result ? toLocationSuggestion(result) : null;
}

export const app = express();

app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_request, response) => response.json({ ok: true }));
app.get('/api/ai/usage', (_request, response) => response.json(summarizeGeminiUsage()));

const handleLocationSearch: express.RequestHandler = async (request, response) => {
  try {
    const query = String(request.query.query || '').trim();
    const limit = Number(request.query.count || 6);
    if (query.length < 2) {
      response.json({ results: [] });
      return;
    }
    response.json({ results: await searchOpenMeteoLocations(query, Number.isFinite(limit) ? limit : 6) });
  } catch (error) {
    console.error('location search failed:', error);
    response.json({ results: [] });
  }
};

const handleLocationReverse: express.RequestHandler = async (request, response) => {
  try {
    const latitude = Number(request.query.latitude);
    const longitude = Number(request.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      response.status(400).json({ error: 'Invalid coordinates.' });
      return;
    }
    response.json({ result: await reverseOpenMeteoLocation(latitude, longitude) });
  } catch (error) {
    console.error('location reverse failed:', error);
    response.json({ result: null });
  }
};

app.get('/api/location/search', handleLocationSearch);
app.get('/api/location-search', handleLocationSearch);
app.get('/api/location/reverse', handleLocationReverse);
app.get('/api/location-reverse', handleLocationReverse);

app.get('/api/plants/knowledge', (_request, response) => {
  response.json({
    version: PLANT_KNOWLEDGE_VERSION,
    count: PLANT_KNOWLEDGE_BASE.length,
    dynamicVersion: DYNAMIC_PLANT_KNOWLEDGE_COLLECTION_VERSION,
    plants: PLANT_KNOWLEDGE_BASE.map((plant) => ({
      id: plant.id,
      scientificName: plant.scientificName,
      commonNames: plant.commonNames,
      family: plant.family,
      archetype: plant.care.arquetipo_cuidado,
    })),
  });
});

app.get('/api/plants/knowledge/dynamic', async (request, response) => {
  try {
    const limit = Number(request.query.limit || 50);
    const plants = await dynamicPlantKnowledgeRepository.list(Number.isFinite(limit) ? limit : 50);
    response.json({ version: DYNAMIC_PLANT_KNOWLEDGE_COLLECTION_VERSION, count: plants.length, plants });
  } catch (error) {
    console.error('dynamic knowledge list failed:', error);
    const httpError = toAiHttpError(error);
    response.status(httpError.status).json({ error: httpError.safeMessage, code: httpError.code });
  }
});

app.get('/api/plants/knowledge/dynamic/:speciesKey', async (request, response) => {
  try {
    const record = await dynamicPlantKnowledgeRepository.getBySpeciesKey(request.params.speciesKey);
    if (!record) {
      response.status(404).json({ error: 'Dynamic plant knowledge record not found.' });
      return;
    }
    response.json(record);
  } catch (error) {
    console.error('dynamic knowledge get failed:', error);
    const httpError = toAiHttpError(error);
    response.status(httpError.status).json({ error: httpError.safeMessage, code: httpError.code });
  }
});

app.post('/api/plants/knowledge/dynamic/ensure', async (request, response) => {
  try {
    const result = await ensureDynamicPlantKnowledge(
      dynamicPlantKnowledgeRepository,
      getGeminiClient(),
      GEMINI_MODEL,
      { plantData: request.body?.plantData || {}, requestedBy: request.body?.requestedBy },
    );
    response.json(result);
  } catch (error) {
    console.error('dynamic knowledge ensure failed:', error);
    const httpError = toAiHttpError(error);
    response.status(httpError.status).json({ error: httpError.safeMessage, code: httpError.code });
  }
});

const handleIdentifyPlant = createAiHttpHandler('identify') as express.RequestHandler;
const handleCarePlan = createAiHttpHandler('carePlan') as express.RequestHandler;
const handleFollowUp = createAiHttpHandler('followUp') as express.RequestHandler;
const handleRefreshPlantFromPhoto = createAiHttpHandler('refresh') as express.RequestHandler;

app.post('/api/ai/identify-plant', handleIdentifyPlant);
app.post('/api/ai-identify-plant', handleIdentifyPlant);
app.post('/api/ai/care-plan', handleCarePlan);
app.post('/api/ai-care-plan', handleCarePlan);
app.post('/api/ai/follow-up', handleFollowUp);
app.post('/api/ai-follow-up', handleFollowUp);
app.post('/api/ai/refresh-plant-from-photo', handleRefreshPlantFromPhoto);
app.post('/api/ai-refresh-plant-from-photo', handleRefreshPlantFromPhoto);

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`Lleken API listening on http://localhost:${PORT}`));
}

export default app;
