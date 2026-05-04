import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  normalizeCarePlan,
  normalizeFollowUpResult,
  normalizePlantIdentification,
} from '../src/lib/aiSchema';
import {
  buildConservativeCarePlan,
  buildStaticCarePlan,
  enrichPlantWithKnowledge,
  findPlantKnowledge,
  PLANT_KNOWLEDGE_BASE,
  PLANT_KNOWLEDGE_VERSION,
} from '../src/lib/plantKnowledge';
import {
  DYNAMIC_PLANT_KNOWLEDGE_COLLECTION_VERSION,
  dynamicPlantKnowledgeRepository,
  ensureDynamicPlantKnowledge,
} from './dynamicPlantKnowledge';
import type {
  GenerateCarePlanInput,
  FollowUpAnalysisInput,
} from '../src/lib/aiSchema';

const GEMINI_MODEL = 'gemini-2.5-flash';
const PORT = Number(process.env.API_PORT || 8787);
const GEMINI_PRICING_USD_PER_1M = {
  'gemini-2.5-flash': {
    input: 0.30,
    output: 2.50,
  },
} as const;

dotenv.config({ path: '.env.local' });
dotenv.config();

type InlineImage = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

type GeminiUsageRecord = {
  timestamp: string;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

const geminiUsageRecords: GeminiUsageRecord[] = [];

interface RefreshPlantFromPhotoInput extends GenerateCarePlanInput {
  image?: string;
  imageUrl?: string;
}

function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key');
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function imageDataUrlToInlineData(image: string): InlineImage {
  const [metadata, data] = image.split(',');
  const mimeType = metadata?.split(';')[0]?.split(':')[1];

  if (!data || !mimeType) {
    throw new Error('Invalid image data URL');
  }

  return {
    inlineData: {
      data,
      mimeType,
    },
  };
}

async function imageUrlToDataUrl(imageUrl: string) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Could not fetch plant image: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    throw new Error('Plant image URL did not return an image.');
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

function parseJsonResponse(text?: string): unknown {
  if (!text) {
    throw new Error('No response from AI');
  }

  return JSON.parse(text);
}

function estimateGeminiCost(model: string, inputTokens: number, outputTokens: number) {
  const pricing = GEMINI_PRICING_USD_PER_1M[model as keyof typeof GEMINI_PRICING_USD_PER_1M];
  if (!pricing) return 0;

  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

function recordGeminiUsage(operation: string, model: string, response: unknown) {
  const usage = response && typeof response === 'object' && 'usageMetadata' in response
    ? (response as { usageMetadata?: Record<string, unknown> }).usageMetadata
    : undefined;

  const inputTokens = Number(usage?.promptTokenCount || 0);
  const totalTokens = Number(usage?.totalTokenCount || 0);
  const candidateTokens = Number(usage?.candidatesTokenCount || 0);
  const thoughtsTokens = Number(usage?.thoughtsTokenCount || 0);
  const outputTokens = candidateTokens + thoughtsTokens || Math.max(0, totalTokens - inputTokens);
  const estimatedCostUsd = estimateGeminiCost(model, inputTokens, outputTokens);

  const record = {
    timestamp: new Date().toISOString(),
    operation,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd,
  };

  geminiUsageRecords.unshift(record);
  geminiUsageRecords.splice(100);
  console.info('Gemini usage:', record);
}

export function summarizeGeminiUsage() {
  const totals = geminiUsageRecords.reduce((summary, record) => {
    summary.calls += 1;
    summary.inputTokens += record.inputTokens;
    summary.outputTokens += record.outputTokens;
    summary.totalTokens += record.totalTokens;
    summary.estimatedCostUsd += record.estimatedCostUsd;
    return summary;
  }, {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  });

  return {
    model: GEMINI_MODEL,
    pricingUsdPer1M: GEMINI_PRICING_USD_PER_1M,
    totals,
    recent: geminiUsageRecords.slice(0, 25),
  };
}

export function getHttpStatus(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('"code":429') || message.includes('credits are depleted')) {
    return 429;
  }
  if (message.includes('Missing Gemini API key')) {
    return 500;
  }
  return 400;
}

export function getClientError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('"code":429') || message.includes('credits are depleted')) {
    return 'RESOURCE_EXHAUSTED: Gemini credits are depleted.';
  }
  if (message.includes('Missing Gemini API key')) {
    return 'Missing Gemini API key.';
  }
  return message || 'AI request failed.';
}

function isResourceExhausted(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  return status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('"code":429') || message.includes('credits are depleted');
}

function isTemporaryAiUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  const lower = message.toLowerCase();
  return status === 503
    || message.includes('"code":503')
    || lower.includes('unavailable')
    || lower.includes('high demand')
    || lower.includes('try again later');
}

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
  return [
    result.name,
    result.admin4,
    result.admin3,
    result.admin2,
    result.admin1,
    result.country,
  ].filter(Boolean).join(', ');
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
  const params = new URLSearchParams({
    name: query,
    count: String(count),
    language: 'es',
    format: 'json',
  });
  const apiResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!apiResponse.ok) {
    throw new Error(`Open-Meteo geocoding failed: ${apiResponse.status}`);
  }
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
  if (!apiResponse.ok) {
    throw new Error(`Open-Meteo reverse geocoding failed: ${apiResponse.status}`);
  }
  const data = await apiResponse.json();
  const result = Array.isArray(data.results) ? data.results[0] as OpenMeteoGeocodingResult | undefined : undefined;
  return result ? toLocationSuggestion(result) : null;
}

export async function identifyPlantFromImage(image: string) {
  const ai = getAiClient();
  const prompt = `Analiza esta imagen y responde en un JSON valido con esta estructura exacta:
{
  "nombre_comun": "...",
  "nombre_cientifico": "...",
  "nombre_sugerido": "...",
  "familia": "...",
  "estado": "saludable",
  "puntuacion_salud": 85,
  "info_general": {
    "descripcion": "...",
    "origen": "...",
    "curiosidades": ["...", "..."],
    "usos_comunes": ["..."],
    "condiciones_ideales": "..."
  },
  "contexto_inferido": {
    "ubicacion_tipo": "interior",
    "maceta_con_drenaje": true,
    "tamano_maceta": "mediana",
    "luz_usuario": "brillante_indirecta"
  }
}
Ademas de identificar la especie, piensa en su arquetipo de cuidado para que el siguiente plan sea estable:
suculenta_cactus, aroide_tropical, alta_humedad, baja_luz_resistente, floracion_interior o comestible_aromatica.
Tambien intenta inferir contexto visual solo si aparece claramente en la foto:
- ubicacion_tipo: "interior", "balcon" o "exterior".
- maceta_con_drenaje: true o false si se ven orificios/plato/agua o ausencia clara; null si no se puede saber.
- tamano_maceta: "pequena", "mediana" o "grande" segun escala visual; null si no se puede saber.
- luz_usuario: "baja", "media", "brillante_indirecta" o "sol_directo"; null si no se puede saber.
Sugiere un nombre de mascota, apodo cariñoso o creativo en "nombre_sugerido" basado en la especie o apariencia.
Si algun dato no se puede determinar de forma confiable, dejalo como null. No inventes contexto.
Si no tienes confianza alta en la especie, usa nombre cientifico "Especie no confirmada" y conserva una descripcion prudente basada en la morfologia.
Si la planta claramente se ve maltratada, seca o enferma, marca el estado como "necesita_atencion" o "en_riesgo" y baja la puntuacion.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      prompt,
      imageDataUrlToInlineData(image),
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });
  recordGeminiUsage('identifyPlantFromImage', GEMINI_MODEL, response);

  return enrichPlantWithKnowledge(normalizePlantIdentification(parseJsonResponse(response.text)));
}

export async function generateCarePlan(input: GenerateCarePlanInput) {
  const staticPlan = buildStaticCarePlan(input);
  if (staticPlan) {
    return normalizeCarePlan(staticPlan);
  }

  const ai = getAiClient();
  const knownSpecies = findPlantKnowledge(input.plantData);
  const prompt = `Genera un plan de cuidados en JSON para la planta "${input.plantData.nombre_comun}" (${input.plantData.nombre_cientifico}) que se encuentra en "${input.city || 'ubicacion desconocida'}".
Ten en cuenta que su estado actual detectado es "${input.plantData.estado}".
Primero se reviso la base estatica interna de plantas y no hubo coincidencia registrada${knownSpecies ? ', aunque existe una coincidencia parcial que debes usar con cautela' : ''}. Genera una respuesta conservadora y marca incertidumbre en instrucciones si la especie no esta confirmada.
Usa estos datos reales de clima y ubicacion para ajustar riego, sol y alertas:
${input.weatherSummary}
Datos estructurados de clima:
${JSON.stringify(input.weather || {}, null, 2)}
Contexto aportado por la persona:
${input.contextSummary || 'Sin contexto de maceta/luz. Asume interior en maceta mediana con drenaje desconocido y riesgo conservador de exceso de riego.'}

El JSON debe seguir esta estructura exacta:
{
  "riego_frecuencia_dias": 5,
  "instrucciones": "...",
  "alertas_clima": ["...", "..."],
  "riego_ajuste_clima": "...",
  "exposicion_sol": "...",
  "seguimiento_foto_dias": 7,
  "tareas_adicionales": ["...", "..."],
  "arquetipo_cuidado": "aroide_tropical",
  "regla_humedad_sustrato": "top_5cm_seco",
  "luz_categoria": "brillante_indirecta",
  "humedad_objetivo": "media",
  "temp_min_segura_c": 12,
  "temp_max_confort_c": 30,
  "drenaje_requerido": true,
  "fertilizacion_temporada": "crecimiento_activo",
  "toxicidad": {
    "humanos": false,
    "mascotas": false,
    "irritante_piel": false
  },
  "senales_alerta": ["...", "..."]
}
Valores validos:
- arquetipo_cuidado: suculenta_cactus, aroide_tropical, alta_humedad, baja_luz_resistente, floracion_interior, comestible_aromatica.
- regla_humedad_sustrato: top_2cm_seco, top_5cm_seco, secar_completo, humedad_pareja.
- luz_categoria: baja_media, brillante_indirecta, media_alta, sol_directo_suave, sol_directo_alto.
- humedad_objetivo: baja, media, alta.
- fertilizacion_temporada: crecimiento_activo, minima, no_recomendada.

No bases el riego solo en dias: entrega frecuencia estimada y una regla observable del sustrato. En Chile o hemisferio sur, recuerda que ventana norte recibe mas sol que ventana sur. Explica alertas con causa concreta: frio seca mas lento, calor pide revisar antes, lluvia o baja luz reducen riego y fertilizacion. Si falta informacion de maceta o drenaje, asume riesgo conservador de exceso de agua.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [prompt],
      config: { responseMimeType: 'application/json' },
    });
    recordGeminiUsage('generateCarePlan', GEMINI_MODEL, response);

    return normalizeCarePlan(parseJsonResponse(response.text));
  } catch (error) {
    if (isResourceExhausted(error) || isTemporaryAiUnavailable(error)) {
      console.warn('Gemini unavailable for care plan; using local conservative weather care plan.', error);
      return normalizeCarePlan(buildConservativeCarePlan(input));
    }
    throw error;
  }
}

export async function analyzeFollowUpImage(input: FollowUpAnalysisInput) {
  const ai = getAiClient();
  const prompt = `Analiza esta foto de seguimiento de la planta "${input.plant.nombre_comun || 'planta'}" y responde solo JSON valido:
{
  "estado": "saludable",
  "puntuacion_salud": 85,
  "descripcion_estado": "...",
  "observaciones": "...",
  "recomendacion_inmediata": "...",
  "sintomas_observados": ["...", "..."],
  "causas_probables": ["...", "..."],
  "preguntas_de_confirmacion": ["...", "..."],
  "accion_segura_inmediata": "...",
  "riesgo": "bajo"
}
Usa estado "saludable", "necesita_atencion" o "en_riesgo". Usa riesgo "bajo", "medio" o "alto".
Habla en probabilidades: hojas amarillas, marchitez y puntas marrones pueden tener varias causas. No recomiendes pesticidas sin una senal clara de plaga; primero sugiere revisar sustrato, drenaje, enves de hojas, tallos y agua acumulada.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      prompt,
      imageDataUrlToInlineData(input.image),
    ],
    config: { responseMimeType: 'application/json' },
  });
  recordGeminiUsage('analyzeFollowUpImage', GEMINI_MODEL, response);

  return normalizeFollowUpResult(parseJsonResponse(response.text));
}

export async function refreshPlantFromPhoto(input: RefreshPlantFromPhotoInput) {
  const image = input.image || (input.imageUrl ? await imageUrlToDataUrl(input.imageUrl) : '');
  if (!image) {
    throw new Error('Missing plant image or imageUrl.');
  }

  let plantData: Partial<GenerateCarePlanInput['plantData']>;
  try {
    plantData = await identifyPlantFromImage(image);
  } catch (error) {
    if (!isResourceExhausted(error)) {
      throw error;
    }
    console.warn('Gemini credits depleted; keeping current plant identity for refresh preview.');
    plantData = enrichPlantWithKnowledge(normalizePlantIdentification(input.plantData || {}));
  }
  const carePlan = await generateCarePlan({
    plantData,
    city: input.city,
    weatherSummary: input.weatherSummary,
    weather: input.weather,
    contextSummary: input.contextSummary,
  });

  return {
    plantData,
    carePlan,
    updateFields: {
      nombre_comun: plantData.nombre_comun,
      nombre_cientifico: plantData.nombre_cientifico,
      nombre_sugerido: plantData.nombre_sugerido,
      species_key: plantData.species_key,
      knowledge_source: plantData.knowledge_source,
      familia: plantData.familia,
      estado: plantData.estado,
      puntuacion_salud: plantData.puntuacion_salud,
      info_general: plantData.info_general,
      plan_cuidados: carePlan,
    },
  };
}

export const app = express();

app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/ai/usage', (_request, response) => {
  response.json(summarizeGeminiUsage());
});

app.get('/api/location/search', async (request, response) => {
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
});

app.get('/api/location/reverse', async (request, response) => {
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
});

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
    response.json({
      version: DYNAMIC_PLANT_KNOWLEDGE_COLLECTION_VERSION,
      count: plants.length,
      plants,
    });
  } catch (error) {
    console.error('dynamic knowledge list failed:', error);
    response.status(400).json({ error: getClientError(error) });
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
    response.status(400).json({ error: getClientError(error) });
  }
});

app.post('/api/plants/knowledge/dynamic/ensure', async (request, response) => {
  try {
    const result = await ensureDynamicPlantKnowledge(
      dynamicPlantKnowledgeRepository,
      getAiClient(),
      GEMINI_MODEL,
      {
        plantData: request.body?.plantData || {},
        requestedBy: request.body?.requestedBy,
      },
    );
    response.json(result);
  } catch (error) {
    console.error('dynamic knowledge ensure failed:', error);
    response.status(getHttpStatus(error)).json({ error: getClientError(error) });
  }
});

app.post('/api/ai/identify-plant', async (request, response) => {
  try {
    response.json(await identifyPlantFromImage(String(request.body?.image || '')));
  } catch (error) {
    console.error('identify-plant failed:', error);
    response.status(getHttpStatus(error)).json({ error: getClientError(error) });
  }
});

app.post('/api/ai/care-plan', async (request, response) => {
  try {
    response.json(await generateCarePlan(request.body as GenerateCarePlanInput));
  } catch (error) {
    console.error('care-plan failed:', error);
    response.status(getHttpStatus(error)).json({ error: getClientError(error) });
  }
});

app.post('/api/ai/follow-up', async (request, response) => {
  try {
    response.json(await analyzeFollowUpImage(request.body as FollowUpAnalysisInput));
  } catch (error) {
    console.error('follow-up failed:', error);
    response.status(getHttpStatus(error)).json({ error: getClientError(error) });
  }
});

app.post('/api/ai/refresh-plant-from-photo', async (request, response) => {
  try {
    response.json(await refreshPlantFromPhoto(request.body as RefreshPlantFromPhotoInput));
  } catch (error) {
    console.error('refresh-plant-from-photo failed:', error);
    response.status(getHttpStatus(error)).json({ error: getClientError(error) });
  }
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Lleken API listening on http://localhost:${PORT}`);
  });
}

export default app;
