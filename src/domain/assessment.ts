import type { VisualAssessment } from './identification';

/** Derived visual evidence. It never silently becomes factual plant health. */
export interface FollowUpAssessment extends VisualAssessment {
  descripcion_estado?: string;
  observaciones?: string;
  recomendacion_inmediata?: string;
  sintomas_observados?: string[];
  causas_probables?: string[];
  preguntas_de_confirmacion?: string[];
  accion_segura_inmediata?: string;
  riesgo?: 'bajo' | 'medio' | 'alto';
  provenance: 'ai_inferred';
}
