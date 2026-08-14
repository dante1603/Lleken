import type { CarePlan, Plant, WeatherConditions } from '../../src/types';
import {
  normalizeCarePlan,
  normalizeFollowUpResult,
  normalizePlantIdentification,
} from '../../src/lib/aiSchema';
import type { FollowUpResult } from '../../src/lib/plants';
import {
  buildConservativeCarePlan,
  buildStaticCarePlan,
  enrichPlantWithKnowledge,
  findPlantKnowledge,
} from '../../src/lib/plantKnowledge';
import { AiHttpError, isResourceExhausted, isTemporaryAiUnavailable } from './errors';
import { createGeminiGateway, GEMINI_MODEL, recordGeminiUsage } from './gemini';
import type { AiGateway, AiGenerationResponse } from './gemini';
import { imageDataUrlToInlineData } from './image';

export interface CarePlanInput {
  plantData: Partial<Plant>;
  city: string;
  weatherSummary: string;
  weather?: WeatherConditions;
  contextSummary?: string;
}

export interface FollowUpInput {
  plant: Plant;
  image: string;
}

export interface RefreshPlantFromPhotoInput extends CarePlanInput {
  image: string;
}

export interface RefreshPlantFromPhotoResult {
  plantData: Partial<Plant>;
  carePlan: CarePlan;
  updateFields: Partial<Plant>;
}

export interface AiCore {
  identifyPlantFromImage(image: unknown): Promise<Partial<Plant>>;
  generateCarePlan(input: unknown): Promise<CarePlan>;
  analyzeFollowUpImage(input: unknown): Promise<FollowUpResult>;
  refreshPlantFromPhoto(input: unknown): Promise<RefreshPlantFromPhotoResult>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseJsonResponse(response: AiGenerationResponse) {
  if (!response.text) {
    throw new AiHttpError(502, 'INVALID_AI_RESPONSE', 'El servicio de IA devolvio una respuesta vacia.');
  }
  try {
    return JSON.parse(response.text);
  } catch (error) {
    throw new AiHttpError(502, 'INVALID_AI_RESPONSE', 'El servicio de IA devolvio una respuesta invalida.', { cause: error });
  }
}

function parseCarePlanInput(value: unknown): CarePlanInput {
  const input = asRecord(value);
  const plantData = asRecord(input?.plantData);
  if (!input || !plantData) {
    throw new AiHttpError(400, 'INVALID_PAYLOAD', 'Faltan los datos de la planta.');
  }
  if (typeof input.city !== 'string' || typeof input.weatherSummary !== 'string') {
    throw new AiHttpError(400, 'INVALID_PAYLOAD', 'La ciudad y el resumen climatico deben ser texto.');
  }
  if (input.weather !== undefined && !asRecord(input.weather)) {
    throw new AiHttpError(400, 'INVALID_PAYLOAD', 'Los datos climaticos no son validos.');
  }
  if (input.contextSummary !== undefined && typeof input.contextSummary !== 'string') {
    throw new AiHttpError(400, 'INVALID_PAYLOAD', 'El resumen de contexto no es valido.');
  }

  return {
    plantData: plantData as Partial<Plant>,
    city: input.city,
    weatherSummary: input.weatherSummary,
    weather: input.weather as WeatherConditions | undefined,
    contextSummary: input.contextSummary as string | undefined,
  };
}

function parseFollowUpInput(value: unknown): FollowUpInput {
  const input = asRecord(value);
  const plant = asRecord(input?.plant);
  if (!input || !plant) {
    throw new AiHttpError(400, 'INVALID_PAYLOAD', 'Faltan los datos de la planta.');
  }
  imageDataUrlToInlineData(input.image);
  return { plant: plant as unknown as Plant, image: input.image as string };
}

const IDENTIFY_PROMPT = `Analiza esta imagen y responde en un JSON valido con esta estructura exacta:
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
Infiere contexto visual solo si aparece claramente. Si algun dato no se puede determinar de forma confiable, usa null y no inventes contexto.
Si no tienes confianza alta en la especie, usa nombre cientifico "Especie no confirmada" y conserva una descripcion prudente basada en la morfologia.
Si la planta se ve maltratada, seca o enferma, usa estado "necesita_atencion" o "en_riesgo" y baja la puntuacion.`;

function carePlanPrompt(input: CarePlanInput) {
  const knownSpecies = findPlantKnowledge(input.plantData);
  return `Genera un plan de cuidados en JSON para la planta "${input.plantData.nombre_comun}" (${input.plantData.nombre_cientifico}) que se encuentra en "${input.city || 'ubicacion desconocida'}".
Su estado actual detectado es "${input.plantData.estado}".
La base estatica interna no tuvo una coincidencia completa${knownSpecies ? ', aunque existe una coincidencia parcial que debes usar con cautela' : ''}. Genera una respuesta conservadora y explicita incertidumbre si la especie no esta confirmada.
Clima resumido: ${input.weatherSummary}
Clima estructurado: ${JSON.stringify(input.weather || {})}
Contexto confirmado: ${input.contextSummary || 'Sin contexto de maceta/luz; asume riesgo conservador de exceso de riego.'}

Devuelve exactamente estas claves: riego_frecuencia_dias, instrucciones, alertas_clima, riego_ajuste_clima, exposicion_sol, seguimiento_foto_dias, tareas_adicionales, arquetipo_cuidado, regla_humedad_sustrato, luz_categoria, humedad_objetivo, temp_min_segura_c, temp_max_confort_c, drenaje_requerido, fertilizacion_temporada, toxicidad y senales_alerta.
Valores validos de arquetipo: suculenta_cactus, aroide_tropical, alta_humedad, baja_luz_resistente, floracion_interior, comestible_aromatica.
No bases el riego solo en dias: incluye una regla observable del sustrato. No afirmes toxicidad false si no tienes conocimiento confirmado de la especie.`;
}

function followUpPrompt(plant: Plant) {
  return `Analiza esta foto de seguimiento y responde solo JSON valido con estado, puntuacion_salud, descripcion_estado, observaciones, recomendacion_inmediata, sintomas_observados, causas_probables, preguntas_de_confirmacion, accion_segura_inmediata y riesgo.
Contexto de la planta: ${JSON.stringify({
    nombre_comun: plant.nombre_comun,
    nombre_cientifico: plant.nombre_cientifico,
    estado_previo: plant.estado,
    puntuacion_previa: plant.puntuacion_salud,
    contexto_confirmado: plant.contexto,
    contexto_inferido: plant.contexto_inferido,
    plan_cuidados: plant.plan_cuidados,
  })}
Usa estado saludable, necesita_atencion o en_riesgo; riesgo bajo, medio o alto.
Habla en probabilidades. No recomiendes pesticidas sin una senal clara de plaga; primero sugiere revisar sustrato, drenaje, enves de hojas, tallos y agua acumulada.`;
}

export function createAiCore(gateway: AiGateway = createGeminiGateway()): AiCore {
  async function generate(operation: string, contents: Array<string | ReturnType<typeof imageDataUrlToInlineData>>) {
    const response = await gateway.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { responseMimeType: 'application/json' },
    });
    recordGeminiUsage(operation, GEMINI_MODEL, response);
    return parseJsonResponse(response);
  }

  async function identifyPlantFromImage(image: unknown) {
    const inlineImage = imageDataUrlToInlineData(image);
    const result = await generate('identifyPlantFromImage', [IDENTIFY_PROMPT, inlineImage]);
    return enrichPlantWithKnowledge(normalizePlantIdentification(result));
  }

  async function generateCarePlan(value: unknown) {
    const input = parseCarePlanInput(value);
    const staticPlan = buildStaticCarePlan(input);
    if (staticPlan) return normalizeCarePlan(staticPlan);

    try {
      return normalizeCarePlan(await generate('generateCarePlan', [carePlanPrompt(input)]));
    } catch (error) {
      if (isResourceExhausted(error) || isTemporaryAiUnavailable(error)) {
        console.warn('Gemini unavailable for care plan; using local conservative care plan.', error);
        return normalizeCarePlan(buildConservativeCarePlan(input));
      }
      throw error;
    }
  }

  async function analyzeFollowUpImage(value: unknown) {
    const input = parseFollowUpInput(value);
    const result = await generate('analyzeFollowUpImage', [
      followUpPrompt(input.plant),
      imageDataUrlToInlineData(input.image),
    ]);
    return normalizeFollowUpResult(result);
  }

  async function refreshPlantFromPhoto(value: unknown) {
    const raw = asRecord(value);
    if (!raw) throw new AiHttpError(400, 'INVALID_PAYLOAD', 'La solicitud no es valida.');
    const careInput = parseCarePlanInput(raw);
    const inlineImage = imageDataUrlToInlineData(raw.image);

    let plantData: Partial<Plant>;
    try {
      plantData = await identifyPlantFromImage(`data:${inlineImage.inlineData.mimeType};base64,${inlineImage.inlineData.data}`);
    } catch (error) {
      if (!isResourceExhausted(error)) throw error;
      console.warn('Gemini credits depleted; keeping current plant identity for refresh preview.', error);
      plantData = enrichPlantWithKnowledge(normalizePlantIdentification(careInput.plantData));
    }

    const carePlan = await generateCarePlan({ ...careInput, plantData });
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

  return { identifyPlantFromImage, generateCarePlan, analyzeFollowUpImage, refreshPlantFromPhoto };
}

export const aiCore = createAiCore();
