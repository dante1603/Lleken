export interface WeatherConditions {
  temp_actual?: number;
  temp_max?: number;
  temp_min?: number;
  lluvia?: number;
}

export interface CarePlan {
  riego_frecuencia_dias?: number;
  instrucciones?: string;
  alertas_clima?: string[];
  riego_ajuste_clima?: string;
  exposicion_sol?: string;
  seguimiento_foto_dias?: number;
  tareas_adicionales?: string[];
}

export interface GeneralInfo {
  descripcion?: string;
  origen?: string;
  curiosidades?: string[];
  usos_comunes?: string[];
  condiciones_ideales?: string;
}

export interface Plant {
  id: string;
  userId: string;
  fotoUrl?: string;
  nombrePersonalizado?: string;
  nombre_comun?: string;
  nombre_cientifico?: string;
  familia?: string;
  estado?: 'saludable' | 'necesita_atencion' | 'en_riesgo';
  puntuacion_salud?: number;
  ciudad?: string;
  lat?: number;
  lon?: number;
  clima_actual?: WeatherConditions;
  plan_cuidados?: CarePlan;
  info_general?: GeneralInfo;
  fecha_creacion: number;
  fecha_ultimo_seguimiento?: number;
  fecha_ultimo_riego?: number;
  historial_acciones?: { tipo: string; fecha: number; descripcion?: string }[];
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
}
