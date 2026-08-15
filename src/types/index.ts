export interface WeatherConditions {
  temp_actual?: number;
  temp_max?: number;
  temp_min?: number;
  lluvia?: number;
  humedad_relativa?: number;
}

export type CareArchetype =
  | 'suculenta_cactus'
  | 'aroide_tropical'
  | 'alta_humedad'
  | 'baja_luz_resistente'
  | 'floracion_interior'
  | 'comestible_aromatica';

export type SoilMoistureRule =
  | 'top_2cm_seco'
  | 'top_5cm_seco'
  | 'secar_completo'
  | 'humedad_pareja';

export type LightCategory =
  | 'baja_media'
  | 'brillante_indirecta'
  | 'media_alta'
  | 'sol_directo_suave'
  | 'sol_directo_alto';

export type TargetHumidity = 'baja' | 'media' | 'alta';

export type FertilizationSeason = 'crecimiento_activo' | 'minima' | 'no_recomendada';

export interface CarePlan {
  /** Stable humidity-review reference; never an automatic watering order. */
  riego_frecuencia_dias?: number;
  instrucciones?: string;
  alertas_clima?: string[];
  riego_ajuste_clima?: string;
  exposicion_sol?: string;
  seguimiento_foto_dias?: number;
  tareas_adicionales?: string[];
  arquetipo_cuidado?: CareArchetype;
  regla_humedad_sustrato?: SoilMoistureRule;
  luz_categoria?: LightCategory;
  humedad_objetivo?: TargetHumidity;
  temp_min_segura_c?: number;
  temp_max_confort_c?: number;
  drenaje_requerido?: boolean;
  fertilizacion_temporada?: FertilizationSeason;
  toxicidad?: {
    humanos?: boolean;
    mascotas?: boolean;
    irritante_piel?: boolean;
  };
  senales_alerta?: string[];
}

export interface PlantKnowledgeSource {
  source: 'static_catalog' | 'ai_generated';
  catalogId?: string;
  catalogVersion?: string;
  matchedBy?: 'scientific_name' | 'common_name' | 'alias';
  confidence?: 'alta' | 'media' | 'baja';
  updatedAt?: string;
}

export interface GeneralInfo {
  descripcion?: string;
  origen?: string;
  curiosidades?: string[];
  usos_comunes?: string[];
  condiciones_ideales?: string;
}

import type {
  ConfirmedPlantContext as DomainConfirmedPlantContext,
  InferredPlantContext as DomainInferredPlantContext,
} from '../domain/context';

export type ConfirmedPlantContext = DomainConfirmedPlantContext;
export type InferredPlantContext = DomainInferredPlantContext;
export type PlantContext = DomainConfirmedPlantContext;

/**
 * @deprecated Legacy UI projection. New domain logic must use PlantInstance,
 * IdentificationProposal, ConfirmedIdentification and FollowUpAssessment.
 */
export interface Plant {
  id: string;
  userId?: string;
  ownerId?: string;
  caregiverIds?: string[];
  memberIds?: string[];
  fotoUrl?: string;
  fotoPath?: string;
  nombrePersonalizado?: string;
  nombre_sugerido?: string;
  nombre_comun?: string;
  nombre_cientifico?: string;
  species_key?: string;
  knowledge_source?: PlantKnowledgeSource;
  familia?: string;
  estado?: 'saludable' | 'necesita_atencion' | 'en_riesgo';
  puntuacion_salud?: number;
  ciudad?: string;
  lat?: number;
  lon?: number;
  clima_actual?: WeatherConditions;
  /** Timestamp of the environmental observation, not a claim that it is current. */
  clima_observado_en?: number;
  plan_cuidados?: CarePlan;
  info_general?: GeneralInfo;
  contexto_inferido?: InferredPlantContext;
  contexto?: PlantContext;
  fecha_creacion: number;
  fecha_ultimo_seguimiento?: number;
  fecha_ultimo_riego?: number;
  historial_acciones?: {
    tipo: PlantActionType | string;
    fecha: number;
    descripcion?: string;
    seguimiento?: Partial<Seguimiento>;
  }[];
}

export type PlantActionType =
  | 'creacion'
  | 'riego'
  | 'revision_humedad'
  | 'revision_plagas'
  | 'fertilizacion'
  | 'poda'
  | 'trasplante'
  | 'cosecha'
  | 'foto'
  | 'nota'
  | 'tratamiento_plaga';

export interface AppUserProfile {
  name: string;
  email: string | null;
  photoURL: string | null;
  plan: 'free' | 'paid';
  ownedPlantLimit: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Seguimiento {
  id: string;
  fotoUrl?: string;
  fecha: number;
  estado: string;
  puntuacion_salud?: number;
  descripcion_estado?: string;
  cambio_respecto_anterior?: string;
  observaciones?: string;
  recomendacion_inmediata?: string;
  sintomas_observados?: string[];
  causas_probables?: string[];
  preguntas_de_confirmacion?: string[];
  accion_segura_inmediata?: string;
  riesgo?: 'bajo' | 'medio' | 'alto';
}
