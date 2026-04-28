import { GoogleGenAI } from '@google/genai';
import { normalizeCarePlan, normalizePlantIdentification } from '../src/lib/aiSchema';
import {
  findPlantKnowledge,
  findPlantKnowledgeByName,
  PLANT_KNOWLEDGE_VERSION,
  type PlantKnowledgeEntry,
  type PlantKnowledgeMatch,
} from '../src/lib/plantKnowledge';
import type { CarePlan, GeneralInfo, Plant } from '../src/types';

export type DynamicPlantKnowledgeStatus = 'ai_generated' | 'reviewed' | 'rejected' | 'merged';

export interface DynamicPlantKnowledgeRecord extends PlantKnowledgeEntry {
  speciesKey: string;
  status: DynamicPlantKnowledgeStatus;
  source: 'dynamic_ai';
  confidence: 'alta' | 'media' | 'baja';
  usageCount: number;
  generatedFrom: {
    commonName?: string;
    scientificName?: string;
    requestedBy?: string;
  };
  review?: {
    reviewedBy?: string;
    reviewedAt?: string;
    notes?: string;
  };
  mergedInto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicKnowledgeMatch {
  record: DynamicPlantKnowledgeRecord;
  matchedBy: PlantKnowledgeMatch['matchedBy'];
}

export interface DynamicPlantKnowledgeRepository {
  findByPlantData(plantData: Partial<Plant>): Promise<DynamicKnowledgeMatch | null>;
  getBySpeciesKey(speciesKey: string): Promise<DynamicPlantKnowledgeRecord | null>;
  upsert(record: DynamicPlantKnowledgeRecord): Promise<DynamicPlantKnowledgeRecord>;
  incrementUsage(speciesKey: string): Promise<void>;
  list(limit?: number): Promise<DynamicPlantKnowledgeRecord[]>;
}

export interface EnsureDynamicPlantKnowledgeInput {
  plantData: Partial<Plant>;
  requestedBy?: string;
}

export interface EnsureDynamicPlantKnowledgeResult {
  source: 'static_catalog' | 'dynamic_catalog' | 'generated_dynamic_catalog' | 'unresolved';
  match?: PlantKnowledgeMatch | DynamicKnowledgeMatch;
  record?: DynamicPlantKnowledgeRecord;
  reason?: string;
}

const COLLECTION_VERSION = `dynamic-${PLANT_KNOWLEDGE_VERSION}`;

function normalizeName(value?: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value?: string) {
  const normalized = normalizeName(value).replace(/\s+/g, '-');
  return normalized || `unknown-${Date.now()}`;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 10);
}

function matchesName(candidate: string | undefined, names: string[]) {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return false;
  return names.some((name) => normalizeName(name) === normalizedCandidate);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function entryFromGeneratedPayload(payload: unknown, input: EnsureDynamicPlantKnowledgeInput): PlantKnowledgeEntry {
  const data = asRecord(payload);
  const normalizedPlant = normalizePlantIdentification(data);
  const care = normalizeCarePlan(data.care || data.plan_cuidados || data.carePlan);
  const info = normalizedPlant.info_general || {};
  const scientificName = normalizedPlant.nombre_cientifico || input.plantData.nombre_cientifico || 'Especie no confirmada';
  const commonName = normalizedPlant.nombre_comun || input.plantData.nombre_comun || 'Planta sin identificar';
  const aliases = uniqueStrings([
    ...asStringArray(data.aliases),
    ...asStringArray(data.nombres_alternativos),
    input.plantData.nombre_comun || '',
    input.plantData.nombre_cientifico || '',
  ]);

  return {
    id: slugify(scientificName !== 'Especie no confirmada' ? scientificName : commonName),
    scientificName,
    commonNames: uniqueStrings([commonName, ...asStringArray(data.commonNames), ...asStringArray(data.nombres_comunes)]),
    aliases,
    family: normalizedPlant.familia || asString(data.family) || asString(data.familia),
    info: {
      descripcion: info.descripcion || 'Ficha generada por IA pendiente de revision interna.',
      origen: info.origen || '',
      curiosidades: info.curiosidades || [],
      usos_comunes: info.usos_comunes || [],
      condiciones_ideales: info.condiciones_ideales || '',
    } satisfies Required<GeneralInfo>,
    care: {
      ...care,
      riego_frecuencia_dias: care.riego_frecuencia_dias || 7,
      instrucciones: care.instrucciones || 'Revisar humedad del sustrato antes de regar.',
      alertas_clima: care.alertas_clima || [],
      riego_ajuste_clima: care.riego_ajuste_clima || 'Ajustar segun temperatura, luz y velocidad de secado del sustrato.',
      exposicion_sol: care.exposicion_sol || 'Luz indirecta brillante.',
      seguimiento_foto_dias: care.seguimiento_foto_dias || 10,
      tareas_adicionales: care.tareas_adicionales || [],
      arquetipo_cuidado: care.arquetipo_cuidado || 'aroide_tropical',
      regla_humedad_sustrato: care.regla_humedad_sustrato || 'top_5cm_seco',
      luz_categoria: care.luz_categoria || 'brillante_indirecta',
      humedad_objetivo: care.humedad_objetivo || 'media',
      temp_min_segura_c: care.temp_min_segura_c ?? 10,
      temp_max_confort_c: care.temp_max_confort_c ?? 30,
      drenaje_requerido: care.drenaje_requerido ?? true,
      fertilizacion_temporada: care.fertilizacion_temporada || 'crecimiento_activo',
      toxicidad: care.toxicidad || { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: care.senales_alerta || [],
    } satisfies Required<CarePlan>,
  };
}

function recordFromEntry(entry: PlantKnowledgeEntry, input: EnsureDynamicPlantKnowledgeInput): DynamicPlantKnowledgeRecord {
  const now = new Date().toISOString();

  return {
    ...entry,
    speciesKey: entry.id,
    status: 'ai_generated',
    source: 'dynamic_ai',
    confidence: entry.scientificName === 'Especie no confirmada' ? 'baja' : 'media',
    usageCount: 1,
    generatedFrom: {
      commonName: input.plantData.nombre_comun,
      scientificName: input.plantData.nombre_cientifico,
      requestedBy: input.requestedBy,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export class InMemoryDynamicPlantKnowledgeRepository implements DynamicPlantKnowledgeRepository {
  private records = new Map<string, DynamicPlantKnowledgeRecord>();

  async findByPlantData(plantData: Partial<Plant>): Promise<DynamicKnowledgeMatch | null> {
    for (const record of this.records.values()) {
      if (matchesName(plantData.nombre_cientifico, [record.scientificName])) {
        return { record, matchedBy: 'scientific_name' };
      }
    }

    for (const record of this.records.values()) {
      if (matchesName(plantData.nombre_comun, record.commonNames)) {
        return { record, matchedBy: 'common_name' };
      }
    }

    for (const record of this.records.values()) {
      if (matchesName(plantData.nombre_comun, record.aliases || []) || matchesName(plantData.nombre_cientifico, record.aliases || [])) {
        return { record, matchedBy: 'alias' };
      }
    }

    return null;
  }

  async getBySpeciesKey(speciesKey: string) {
    return this.records.get(speciesKey) || null;
  }

  async upsert(record: DynamicPlantKnowledgeRecord) {
    this.records.set(record.speciesKey, {
      ...record,
      updatedAt: new Date().toISOString(),
    });
    return this.records.get(record.speciesKey) as DynamicPlantKnowledgeRecord;
  }

  async incrementUsage(speciesKey: string) {
    const current = this.records.get(speciesKey);
    if (!current) return;

    this.records.set(speciesKey, {
      ...current,
      usageCount: current.usageCount + 1,
      updatedAt: new Date().toISOString(),
    });
  }

  async list(limit = 50) {
    return Array.from(this.records.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }
}

export async function generateDynamicPlantKnowledge(
  ai: GoogleGenAI,
  model: string,
  input: EnsureDynamicPlantKnowledgeInput,
) {
  const prompt = `Genera una ficha botanica reutilizable para la app Lleken.
La especie no existe en el catalogo interno curado ni dinamico.

Datos detectados:
- nombre comun: ${input.plantData.nombre_comun || 'sin dato'}
- nombre cientifico: ${input.plantData.nombre_cientifico || 'sin dato'}
- familia: ${input.plantData.familia || 'sin dato'}

Responde solo JSON valido con esta estructura:
{
  "nombre_comun": "...",
  "nombre_cientifico": "...",
  "familia": "...",
  "aliases": ["...", "..."],
  "info_general": {
    "descripcion": "...",
    "origen": "...",
    "curiosidades": ["...", "..."],
    "usos_comunes": ["..."],
    "condiciones_ideales": "..."
  },
  "care": {
    "riego_frecuencia_dias": 7,
    "instrucciones": "...",
    "alertas_clima": ["...", "..."],
    "riego_ajuste_clima": "...",
    "exposicion_sol": "...",
    "seguimiento_foto_dias": 10,
    "tareas_adicionales": ["...", "..."],
    "arquetipo_cuidado": "aroide_tropical",
    "regla_humedad_sustrato": "top_5cm_seco",
    "luz_categoria": "brillante_indirecta",
    "humedad_objetivo": "media",
    "temp_min_segura_c": 10,
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
}

Usa datos conservadores para cultivo en maceta en Chile. Si la especie no esta confirmada, conserva "Especie no confirmada" y genera una ficha de genero prudente.`;

  const response = await ai.models.generateContent({
    model,
    contents: [prompt],
    config: { responseMimeType: 'application/json' },
  });

  if (!response.text) {
    throw new Error('No response from AI');
  }

  return JSON.parse(response.text);
}

export async function ensureDynamicPlantKnowledge(
  repository: DynamicPlantKnowledgeRepository,
  ai: GoogleGenAI,
  model: string,
  input: EnsureDynamicPlantKnowledgeInput,
): Promise<EnsureDynamicPlantKnowledgeResult> {
  const staticMatch = findPlantKnowledge(input.plantData);
  if (staticMatch) {
    return { source: 'static_catalog', match: staticMatch };
  }

  const dynamicMatch = await repository.findByPlantData(input.plantData);
  if (dynamicMatch) {
    await repository.incrementUsage(dynamicMatch.record.speciesKey);
    return { source: 'dynamic_catalog', match: dynamicMatch, record: dynamicMatch.record };
  }

  if (findPlantKnowledgeByName(input.plantData.nombre_cientifico || input.plantData.nombre_comun)) {
    return { source: 'unresolved', reason: 'Static catalog lookup was inconclusive.' };
  }

  const payload = await generateDynamicPlantKnowledge(ai, model, input);
  const entry = entryFromGeneratedPayload(payload, input);
  const record = await repository.upsert(recordFromEntry(entry, input));

  return {
    source: 'generated_dynamic_catalog',
    record,
  };
}

export const dynamicPlantKnowledgeRepository = new InMemoryDynamicPlantKnowledgeRepository();
export const DYNAMIC_PLANT_KNOWLEDGE_COLLECTION_VERSION = COLLECTION_VERSION;
