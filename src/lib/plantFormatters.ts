import { LightCategory, Plant, PlantContext, SoilMoistureRule, TargetHumidity } from '../types';

export const SOIL_RULE_LABELS: Record<SoilMoistureRule, string> = {
  top_2cm_seco: 'Regar cuando los 2 cm superiores estén secos',
  top_5cm_seco: 'Regar cuando los 5 cm superiores estén secos',
  secar_completo: 'Dejar secar el sustrato por completo',
  humedad_pareja: 'Mantener humedad pareja, sin encharcar',
};

export const LIGHT_LABELS: Record<LightCategory, string> = {
  baja_media: 'Luz baja/media cerca de una ventana',
  brillante_indirecta: 'Luz brillante indirecta',
  media_alta: 'Luz media/alta con sol suave',
  sol_directo_suave: 'Sol directo suave',
  sol_directo_alto: 'Sol alto, vigilar calor',
};

export const HUMIDITY_LABELS: Record<TargetHumidity, string> = {
  baja: 'Humedad baja',
  media: 'Humedad media',
  alta: 'Humedad alta ideal',
};

export function soilRuleText(rule?: SoilMoistureRule) {
  return rule ? SOIL_RULE_LABELS[rule] : 'Revisar el sustrato antes de regar';
}

export function lightText(category?: LightCategory, fallback?: string) {
  return category ? LIGHT_LABELS[category] : fallback || 'Luz indirecta brillante';
}

export function humidityText(target?: TargetHumidity) {
  return target ? HUMIDITY_LABELS[target] : 'Humedad interior normal';
}

export function buildContextSummary(context?: PlantContext) {
  if (!context) return undefined;

  return [
    `Ubicación de cultivo: ${context.ubicacion_tipo || 'sin dato'}`,
    `Maceta con drenaje: ${context.maceta_con_drenaje === false ? 'no' : 'sí'}`,
    `Tamaño de maceta: ${context.tamano_maceta || 'sin dato'}`,
    `Luz habitual indicada: ${context.luz_usuario || 'sin dato'}`,
  ].join('\n');
}

export function riskClass(risk?: 'bajo' | 'medio' | 'alto') {
  if (risk === 'alto') return 'bg-red-50 text-red-700 border-red-100';
  if (risk === 'medio') return 'bg-orange-50 text-orange-700 border-orange-100';
  return 'bg-green-50 text-green-700 border-green-100';
}

export function contextText(plant: Plant) {
  const context = plant.contexto;
  if (!context) return null;
  const location = context.ubicacion_tipo || 'maceta';
  const pot = context.tamano_maceta || 'tamaño no indicado';
  const drainage = context.maceta_con_drenaje === false ? 'sin drenaje' : 'con drenaje';
  return `${location} · ${pot} · ${drainage}`;
}

export function knowledgeSourceText(plant?: Plant) {
  if (!plant?.knowledge_source) return null;
  if (plant.knowledge_source.source === 'static_catalog') {
    return `Catálogo verificado${plant.knowledge_source.catalogVersion ? ` · ${plant.knowledge_source.catalogVersion}` : ''}`;
  }
  return 'Identificación IA por confirmar';
}

export function actionIcon(type: string) {
  if (type === 'riego') return 'water_drop';
  if (type === 'foto') return 'photo_camera';
  if (type === 'poda') return 'content_cut';
  if (type === 'nota') return 'edit_document';
  if (type === 'fertilizacion') return 'science';
  if (type === 'cosecha') return 'spa';
  if (type === 'revision_humedad') return 'humidity_percentage';
  if (type === 'revision_plagas' || type === 'plagas') return 'pest_control';
  return 'history';
}

export function actionLabel(type: string, fallback?: string) {
  if (type === 'riego') return 'Riego registrado';
  if (type === 'foto') return 'Seguimiento por foto';
  if (type === 'revision_humedad') return 'Revisión de humedad registrada';
  if (type === 'revision_plagas' || type === 'plagas') return 'Revisión de plagas registrada';
  if (type === 'fertilizacion') return 'Fertilización registrada';
  if (type === 'nota') return fallback || 'Nota agregada';
  return fallback || type;
}

export function dateAgo(timestamp: number) {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

export function nextWateringText(days: number) {
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${days} días`;
}

export function wateringRule(plant?: Plant) {
  const rule = plant?.plan_cuidados?.regla_humedad_sustrato;
  if (rule === 'secar_completo') return 'Deja secar el sustrato por completo antes de regar.';
  if (rule === 'humedad_pareja') return 'Mantener humedad pareja sin encharcar.';
  if (rule === 'top_5cm_seco') return 'Riega solo si los 5 cm superiores están secos.';
  if (rule === 'top_2cm_seco') return 'Riega solo si los 2 cm superiores están secos.';
  return 'Verifica la humedad del sustrato antes de volver a regar.';
}
