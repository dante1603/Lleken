import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  normalizeCarePlan,
  normalizeFollowUpResult,
  normalizePlantIdentification,
} from '../src/lib/aiSchema';
import type {
  GenerateCarePlanInput,
  FollowUpAnalysisInput,
} from '../src/lib/aiSchema';

const GEMINI_MODEL = 'gemini-2.5-flash';
const PORT = Number(process.env.API_PORT || 8787);

dotenv.config({ path: '.env.local' });
dotenv.config();

type InlineImage = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

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

function parseJsonResponse(text?: string): unknown {
  if (!text) {
    throw new Error('No response from AI');
  }

  return JSON.parse(text);
}

function getHttpStatus(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('"code":429') || message.includes('credits are depleted')) {
    return 429;
  }
  if (message.includes('Missing Gemini API key')) {
    return 500;
  }
  return 400;
}

function getClientError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('"code":429') || message.includes('credits are depleted')) {
    return 'RESOURCE_EXHAUSTED: Gemini credits are depleted.';
  }
  if (message.includes('Missing Gemini API key')) {
    return 'Missing Gemini API key.';
  }
  return message || 'AI request failed.';
}

async function identifyPlantFromImage(image: string) {
  const ai = getAiClient();
  const prompt = `Analiza esta imagen y responde en un JSON valido con esta estructura exacta:
{
  "nombre_comun": "...",
  "nombre_cientifico": "...",
  "familia": "...",
  "estado": "saludable",
  "puntuacion_salud": 85,
  "info_general": {
    "descripcion": "...",
    "origen": "...",
    "curiosidades": ["...", "..."],
    "usos_comunes": ["..."],
    "condiciones_ideales": "..."
  }
}
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

  return normalizePlantIdentification(parseJsonResponse(response.text));
}

async function generateCarePlan(input: GenerateCarePlanInput) {
  const ai = getAiClient();
  const prompt = `Genera un plan de cuidados en JSON para la planta "${input.plantData.nombre_comun}" (${input.plantData.nombre_cientifico}) que se encuentra en "${input.city || 'ubicacion desconocida'}".
Ten en cuenta que su estado actual detectado es "${input.plantData.estado}".
Usa estos datos reales de clima y ubicacion para ajustar riego, sol y alertas:
${input.weatherSummary}

El JSON debe seguir esta estructura exacta:
{
  "riego_frecuencia_dias": 5,
  "instrucciones": "...",
  "alertas_clima": ["...", "..."],
  "riego_ajuste_clima": "...",
  "exposicion_sol": "...",
  "seguimiento_foto_dias": 7,
  "tareas_adicionales": ["...", "..."]
}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [prompt],
    config: { responseMimeType: 'application/json' },
  });

  return normalizeCarePlan(parseJsonResponse(response.text));
}

async function analyzeFollowUpImage(input: FollowUpAnalysisInput) {
  const ai = getAiClient();
  const prompt = `Analiza esta foto de seguimiento de la planta "${input.plant.nombre_comun || 'planta'}" y responde solo JSON valido:
{
  "estado": "saludable",
  "puntuacion_salud": 85,
  "descripcion_estado": "...",
  "observaciones": "...",
  "recomendacion_inmediata": "..."
}
Usa estado "saludable", "necesita_atencion" o "en_riesgo".`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      prompt,
      imageDataUrlToInlineData(input.image),
    ],
    config: { responseMimeType: 'application/json' },
  });

  return normalizeFollowUpResult(parseJsonResponse(response.text));
}

const app = express();

app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
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

app.listen(PORT, () => {
  console.log(`Lleken API listening on http://localhost:${PORT}`);
});
