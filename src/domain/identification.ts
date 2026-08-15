import type { GeneralInfo, PlantKnowledgeSource } from '../types';
import type { InferredPlantContext } from './context';

export interface VisualAssessment {
  estado?: 'saludable' | 'necesita_atencion' | 'en_riesgo';
  puntuacion_salud?: number;
}

/** A fallible candidate produced by a model or another non-confirming source. */
export interface IdentificationProposal extends VisualAssessment {
  nombre_comun?: string;
  nombre_cientifico?: string;
  nombre_sugerido?: string;
  species_key?: string;
  familia?: string;
  knowledge_source?: PlantKnowledgeSource;
  info_general?: GeneralInfo;
  contexto_inferido?: InferredPlantContext;
  provenance: 'ai_inferred';
}

/** Identity accepted or corrected explicitly by a person. */
export interface ConfirmedIdentification {
  nombre_comun?: string;
  nombre_cientifico?: string;
  species_key?: string;
  familia?: string;
  provenance: 'user_confirmed' | 'external';
}
