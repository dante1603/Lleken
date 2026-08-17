import { describe, expect, it } from 'vitest';
import { findPlantKnowledgeByKey } from '../plantKnowledge';
import {
  resolveSpeciesKnowledgeSources,
  type SpeciesCatalogRow,
} from '../speciesCatalog';

const mentha = findPlantKnowledgeByKey('mentha-spicata');

function catalogRow(overrides: Partial<SpeciesCatalogRow> = {}): SpeciesCatalogRow {
  return {
    id: 'species-1',
    species_key: 'test-species',
    scientific_name: 'Testus plantus',
    knowledge_source: 'ai_generated',
    source_payload: {},
    ...overrides,
  };
}

describe('resolveSpeciesKnowledgeSources', () => {
  it('uses static knowledge when it is the only source', () => {
    const resolved = resolveSpeciesKnowledgeSources(mentha);

    expect(resolved?.source).toBe('static_catalog');
    expect(resolved?.careBasis).toBe('static_species');
    expect(resolved?.scientificName).toBe('Mentha spicata');
    expect(resolved?.care.riego_frecuencia_dias).toBe(4);
  });

  it('keeps static knowledge ahead of an AI row for the same species', () => {
    const resolved = resolveSpeciesKnowledgeSources(mentha, catalogRow({
      species_key: 'mentha-spicata',
      scientific_name: 'Mentha spicata',
      source_payload: { care: { riego_frecuencia_dias: 99, luz_categoria: 'baja_media' } },
    }));

    expect(resolved?.source).toBe('static_catalog');
    expect(resolved?.care.riego_frecuencia_dias).toBe(4);
    expect(resolved?.care.luz_categoria).toBe('media_alta');
  });

  it('lets reviewed information override static information while static fills gaps', () => {
    const resolved = resolveSpeciesKnowledgeSources(mentha, catalogRow({
      knowledge_source: 'reviewed',
      species_key: 'mentha-spicata',
      scientific_name: 'Mentha spicata revisada',
      source_payload: { info_general: { descripcion: 'Descripción revisada' } },
    }));

    expect(resolved?.source).toBe('reviewed');
    expect(resolved?.scientificName).toBe('Mentha spicata revisada');
    expect(resolved?.info.descripcion).toBe('Descripción revisada');
    expect(resolved?.info.origen).toBe(mentha?.info.origen);
    expect(resolved?.info.curiosidades).toEqual(mentha?.info.curiosidades);
  });

  it('lets reviewed species care override static and archetype fields', () => {
    const resolved = resolveSpeciesKnowledgeSources(mentha, catalogRow({
      knowledge_source: 'reviewed',
      species_key: 'mentha-spicata',
      scientific_name: 'Mentha spicata',
      care_archetypes: { light_category: 'baja_media', drainage_required: false },
      source_payload: { care: { luz_categoria: 'sol_directo_alto', drenaje_requerido: true } },
    }));

    expect(resolved?.careBasis).toBe('reviewed_species');
    expect(resolved?.care.luz_categoria).toBe('sol_directo_alto');
    expect(resolved?.care.drenaje_requerido).toBe(true);
  });

  it('uses only mapped archetype fields for AI knowledge without species care', () => {
    const resolved = resolveSpeciesKnowledgeSources(null, catalogRow({
      care_archetypes: {
        key: 'suculenta_cactus',
        soil_moisture_rule: 'secar_completo',
        light_category: 'sol_directo_alto',
        target_humidity: 'baja',
        drainage_required: true,
        warning_signs: ['Tejido blando'],
      },
    }));

    expect(resolved?.source).toBe('ai_generated');
    expect(resolved?.careBasis).toBe('care_archetype');
    expect(resolved?.care.riego_frecuencia_dias).toBeUndefined();
    expect(resolved?.care.seguimiento_foto_dias).toBeUndefined();
    expect(resolved?.care.instrucciones).toBeUndefined();
    expect(resolved?.care.toxicidad).toBeUndefined();
  });

  it('does not manufacture general information from an empty AI payload', () => {
    const resolved = resolveSpeciesKnowledgeSources(null, catalogRow({ source_payload: {} }));

    expect(resolved?.info.descripcion).toBeUndefined();
    expect(resolved?.info.origen).toBeUndefined();
    expect(resolved?.info.curiosidades).toBeUndefined();
  });

  it('uses explicit persisted static catalog data without filling missing fields', () => {
    const resolved = resolveSpeciesKnowledgeSources(null, catalogRow({
      knowledge_source: 'static_catalog',
      source_payload: { info_general: { origen: 'Chile' }, care: { drenaje_requerido: true } },
    }));

    expect(resolved?.source).toBe('static_catalog');
    expect(resolved?.info.origen).toBe('Chile');
    expect(resolved?.info.descripcion).toBeUndefined();
    expect(resolved?.care.drenaje_requerido).toBe(true);
    expect(resolved?.care.riego_frecuencia_dias).toBeUndefined();
  });

  it('keeps explicit AI care provisional and distinct from archetype care', () => {
    const resolved = resolveSpeciesKnowledgeSources(null, catalogRow({
      source_payload: { care: { riego_frecuencia_dias: 12 } },
      care_archetypes: { drainage_required: true },
    }));

    expect(resolved?.source).toBe('ai_generated');
    expect(resolved?.careBasis).toBe('ai_species');
    expect(resolved?.care.riego_frecuencia_dias).toBe(12);
    expect(resolved?.care.drenaje_requerido).toBe(true);
  });

  it('returns null when neither source exists', () => {
    expect(resolveSpeciesKnowledgeSources(null, null)).toBeNull();
  });
});
