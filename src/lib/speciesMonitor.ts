import { supabase } from './supabase';

export interface SpeciesMonitorRow {
  species_id: string;
  species_key: string;
  scientific_name: string;
  common_names: string[];
  family?: string | null;
  knowledge_source: 'static_catalog' | 'ai_generated' | 'reviewed' | string;
  confidence: 'alta' | 'media' | 'baja' | string;
  created_at: string;
  updated_at?: string | null;
  plant_count: number;
  recent_plant_count: number;
  latest_plant_created_at?: string | null;
}

interface SpeciesCatalogRow {
  id: string;
  species_key: string;
  scientific_name: string;
  common_names?: string[] | null;
  family?: string | null;
  knowledge_source?: string | null;
  confidence?: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface PlantSpeciesRow {
  species_id?: string | null;
  created_at: string;
}

function asCount(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

function mapRpcRow(row: Partial<SpeciesMonitorRow>): SpeciesMonitorRow {
  return {
    species_id: row.species_id || '',
    species_key: row.species_key || '',
    scientific_name: row.scientific_name || 'Especie sin nombre',
    common_names: row.common_names || [],
    family: row.family,
    knowledge_source: row.knowledge_source || 'ai_generated',
    confidence: row.confidence || 'media',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
    plant_count: asCount(row.plant_count),
    recent_plant_count: asCount(row.recent_plant_count),
    latest_plant_created_at: row.latest_plant_created_at,
  };
}

async function loadFallbackSpeciesMonitor(): Promise<SpeciesMonitorRow[]> {
  const [{ data: speciesData, error: speciesError }, { data: plantsData, error: plantsError }] = await Promise.all([
    supabase
      .from('species_catalog')
      .select('id, species_key, scientific_name, common_names, family, knowledge_source, confidence, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('plants')
      .select('species_id, created_at')
      .not('species_id', 'is', null),
  ]);

  if (speciesError) throw speciesError;
  if (plantsError) console.warn('Conteo global no disponible; usando plantas visibles para el usuario.', plantsError);

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const plantsBySpecies = new Map<string, PlantSpeciesRow[]>();

  ((plantsData || []) as PlantSpeciesRow[]).forEach((plant) => {
    if (!plant.species_id) return;
    const current = plantsBySpecies.get(plant.species_id) || [];
    current.push(plant);
    plantsBySpecies.set(plant.species_id, current);
  });

  return ((speciesData || []) as SpeciesCatalogRow[]).map((species) => {
    const plants = plantsBySpecies.get(species.id) || [];
    const latestPlant = plants
      .map((plant) => plant.created_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    return {
      species_id: species.id,
      species_key: species.species_key,
      scientific_name: species.scientific_name,
      common_names: species.common_names || [],
      family: species.family,
      knowledge_source: species.knowledge_source || 'ai_generated',
      confidence: species.confidence || 'media',
      created_at: species.created_at,
      updated_at: species.updated_at,
      plant_count: plants.length,
      recent_plant_count: plants.filter((plant) => now - new Date(plant.created_at).getTime() <= weekMs).length,
      latest_plant_created_at: latestPlant,
    };
  });
}

export async function loadSpeciesMonitor(): Promise<{ rows: SpeciesMonitorRow[]; source: 'rpc' | 'fallback' }> {
  const { data, error } = await supabase.rpc('get_species_monitor');

  if (!error && data) {
    return {
      rows: (data as Partial<SpeciesMonitorRow>[]).map(mapRpcRow),
      source: 'rpc',
    };
  }

  console.warn('Monitor global de especies no disponible; usando fallback cliente.', error);
  return {
    rows: await loadFallbackSpeciesMonitor(),
    source: 'fallback',
  };
}
