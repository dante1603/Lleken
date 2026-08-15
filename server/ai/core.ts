import type { CarePlan, Plant, WeatherConditions } from '../../src/types';
import type { FollowUpAssessment } from '../../src/domain/assessment';
import type { IdentificationProposal } from '../../src/domain/identification';
import {
  normalizeCarePlan,
  normalizeFollowUpResult,
  normalizePlantIdentification,
} from '../../src/lib/aiSchema.js';
import {
  buildConservativeCarePlan,
  buildStaticCarePlan,
  enrichPlantWithKnowledge,
  findPlantKnowledge,
} from '../../src/lib/plantKnowledge.js';
import { AiHttpError, isResourceExhausted, isTemporaryAiUnavailable } from './errors.js';
import { createGeminiGateway, GEMINI_MODEL, recordGeminiUsage } from './gemini.js';
import type { AiGateway, AiGenerationResponse } from './gemini';
import { imageDataUrlToInlineData } from './image.js';

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
  plantData: IdentificationProposal;
  carePlan: CarePlan;
  updateFields: IdentificationProposal & { plan_cuidados?: CarePlan };
}

export interface AiCore {
  identifyPlantFromImage(image: unknown): Promise<IdentificationProposal>;
  generateCarePlan(input: unknown): Promise<CarePlan>;
  analyzeFollowUpImage(input: unknown): Promise<FollowUpAssessment>;
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
  "estado": "saludable o null",
  "puntuacion_salud": "0-100 o null",
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
Sugiere un nombre de mascota, apodo carinoso o creativo en "nombre_sugerido" basado en la especie o apariencia.
Si algun dato no se puede determinar de forma confiable, dejalo como null. No inventes contexto.
Si no tienes confianza alta en la especie, usa nombre cientifico "Especie no confirmada" y conserva una descripcion prudente basada en la morfologia.
El estado y la puntuacion son solo un assessment visual: si la imagen no permite inferirlos, usa null. Si la planta claramente se ve maltratada, seca o enferma, marca el estado como "necesita_atencion" o "en_riesgo" y baja la puntuacion.`;

function carePlanPrompt(input: CarePlanInput) {
  const knownSpecies = findPlantKnowledge(input.plantData);
  return `Genera un plan de cuidados en JSON para la planta "${input.plantData.nombre_comun}" (${input.plantData.nombre_cientifico}) que se encuentra en "${input.city || 'ubicacion desconocida'}".
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
}

function followUpPrompt(plant: Plant) {
  return `Analiza esta foto de seguimiento de la planta "${plant.nombre_comun || 'planta'}" y responde solo JSON valido:
{
  "estado": "saludable, necesita_atencion, en_riesgo o null",
  "puntuacion_salud": "0-100 o null",
  "descripcion_estado": "...",
  "observaciones": "...",
  "recomendacion_inmediata": "...",
  "sintomas_observados": ["...", "..."],
  "causas_probables": ["...", "..."],
  "preguntas_de_confirmacion": ["...", "..."],
  "accion_segura_inmediata": "...",
  "riesgo": "bajo, medio, alto o null"
}
Contexto actual de la planta:
${JSON.stringify({
    nombre_comun: plant.nombre_comun,
    nombre_cientifico: plant.nombre_cientifico,
    estado_previo: plant.estado,
    puntuacion_previa: plant.puntuacion_salud,
    contexto_confirmado: plant.contexto,
    contexto_inferido: plant.contexto_inferido,
    plan_cuidados: plant.plan_cuidados,
  }, null, 2)}
El estado, puntaje y riesgo son assessments visuales derivados, no cambian salud factual. Usa null si la foto no permite inferirlos. Cuando los informes usa estado "saludable", "necesita_atencion" o "en_riesgo". Usa riesgo "bajo", "medio" o "alto".
Habla en probabilidades: hojas amarillas, marchitez y puntas marrones pueden tener varias causas. No recomiendes pesticidas sin una senal clara de plaga; primero sugiere revisar sustrato, drenaje, enves de hojas, tallos y agua acumulada.`;
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

    let plantData: IdentificationProposal;
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
        provenance: plantData.provenance,
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
