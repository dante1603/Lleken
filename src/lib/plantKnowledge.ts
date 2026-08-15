import type { CarePlan, CareArchetype, GeneralInfo, Plant, WeatherConditions } from '../types';
import type { GenerateCarePlanInput } from './aiSchema';

export const PLANT_KNOWLEDGE_VERSION = '2026-05-04';

export interface PlantKnowledgeEntry {
  id: string;
  scientificName: string;
  commonNames: string[];
  aliases?: string[];
  family: string;
  info: Required<GeneralInfo>;
  care: Required<CarePlan>;
}

export interface PlantKnowledgeMatch {
  entry: PlantKnowledgeEntry;
  matchedBy: 'scientific_name' | 'common_name' | 'alias';
}

const DEFAULT_ALERTS = [
  'Si el sustrato sigue humedo, espera antes de regar aunque toque por calendario.',
  'En semanas frias o con poca luz, reduce el riego y evita fertilizar.',
];

export const PLANT_KNOWLEDGE_BASE: PlantKnowledgeEntry[] = [
  {
    id: 'monstera-deliciosa',
    scientificName: 'Monstera deliciosa',
    commonNames: ['Monstera', 'Costilla de Adan', 'Filodendro monstruoso'],
    aliases: ['costilla de adam', 'monstera deliciosa'],
    family: 'Araceae',
    info: {
      descripcion: 'Aroide tropical de hojas grandes que desarrollan perforaciones y cortes con la madurez y buena luz.',
      origen: 'Bosques tropicales de Mexico y Centroamerica.',
      curiosidades: ['Puede trepar con raices aereas.', 'Las hojas juveniles suelen salir enteras antes de fenestrarse.'],
      usos_comunes: ['Planta ornamental de interior', 'Decoracion de espacios luminosos'],
      condiciones_ideales: 'Luz brillante indirecta, sustrato aireado, humedad media y soporte para trepar.',
    },
    care: {
      riego_frecuencia_dias: 7,
      instrucciones: 'Riega cuando los 5 cm superiores del sustrato esten secos. Evita dejar agua acumulada en el plato.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor revisa humedad antes; con frio o baja luz alarga los intervalos.',
      exposicion_sol: 'Luz brillante indirecta. Tolera algo de sol suave de manana, no sol fuerte directo.',
      seguimiento_foto_dias: 10,
      tareas_adicionales: ['Limpiar hojas grandes con pano humedo', 'Guiar tallos a un tutor si crece desordenada'],
      arquetipo_cuidado: 'aroide_tropical',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'media',
      temp_min_segura_c: 12,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Hojas amarillas blandas', 'Manchas negras con sustrato humedo', 'Bordes secos por aire muy seco'],
    },
  },
  {
    id: 'epipremnum-aureum',
    scientificName: 'Epipremnum aureum',
    commonNames: ['Pothos', 'Potus', 'Photos', 'Hiedra del diablo'],
    aliases: ['potos', 'potus dorado', 'pothos dorado'],
    family: 'Araceae',
    info: {
      descripcion: 'Enredadera tropical resistente, de crecimiento rapido, con hojas verdes o variegadas segun el cultivar.',
      origen: 'Islas del Pacifico sur y sudeste asiatico tropical.',
      curiosidades: ['Pierde variegacion si recibe muy poca luz.', 'Puede cultivarse colgante o guiada en tutor.'],
      usos_comunes: ['Interior de bajo mantenimiento', 'Planta colgante'],
      condiciones_ideales: 'Luz media a brillante indirecta, riego moderado y sustrato con buen drenaje.',
    },
    care: {
      riego_frecuencia_dias: 8,
      instrucciones: 'Deja secar la capa superior del sustrato antes de regar. Es mas segura una leve sequia que exceso constante.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'En ambientes frios puede espaciarse bastante; con calor aumenta la revision del sustrato.',
      exposicion_sol: 'Luz indirecta media o brillante. Evita sol directo intenso.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Podar puntas para fomentar ramificacion', 'Revisar que la variegacion no se pierda por poca luz'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'media',
      temp_min_segura_c: 12,
      temp_max_confort_c: 32,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Hojas amarillas por exceso de agua', 'Tallos largos con pocas hojas', 'Puntas marrones'],
    },
  },
  {
    id: 'sansevieria-trifasciata',
    scientificName: 'Dracaena trifasciata',
    commonNames: ['Sansevieria', 'Lengua de suegra', 'Espada de San Jorge'],
    aliases: ['sansevieria trifasciata', 'snake plant', 'lengua suegra'],
    family: 'Asparagaceae',
    info: {
      descripcion: 'Planta rizomatosa de hojas rigidas y verticales, muy tolerante a interiores y olvidos de riego.',
      origen: 'Africa occidental tropical.',
      curiosidades: ['Antes se clasificaba en el genero Sansevieria.', 'Sus hojas almacenan agua y se pudren con exceso de riego.'],
      usos_comunes: ['Interior de bajo mantenimiento', 'Espacios con luz baja a media'],
      condiciones_ideales: 'Sustrato seco entre riegos, maceta con drenaje y luz media o brillante.',
    },
    care: {
      riego_frecuencia_dias: 18,
      instrucciones: 'Deja secar el sustrato por completo antes de regar. Riega poco y evita mojar el centro de las rosetas.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'En invierno o con poca luz puede pasar varias semanas sin agua; el exceso es el principal riesgo.',
      exposicion_sol: 'Tolera luz baja, pero crece mejor con luz media a brillante indirecta.',
      seguimiento_foto_dias: 21,
      tareas_adicionales: ['Usar sustrato mineral o muy drenante', 'Rotar la maceta para crecimiento parejo'],
      arquetipo_cuidado: 'suculenta_cactus',
      regla_humedad_sustrato: 'secar_completo',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'baja',
      temp_min_segura_c: 10,
      temp_max_confort_c: 32,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: false },
      senales_alerta: ['Hojas blandas en la base', 'Manchas acuosas', 'Arrugas por sequia prolongada'],
    },
  },
  {
    id: 'ficus-elastica',
    scientificName: 'Ficus elastica',
    commonNames: ['Ficus elastica', 'Gomero', 'Arbol del caucho'],
    aliases: ['rubber plant', 'ficus gomero'],
    family: 'Moraceae',
    info: {
      descripcion: 'Arbusto o arbol tropical de hojas grandes, brillantes y coriaceas, comun como planta de interior.',
      origen: 'India, Nepal, Butan, Myanmar, Malasia e Indonesia.',
      curiosidades: ['Produce latex lechoso irritante.', 'Las variedades variegadas necesitan mas luz que las verdes.'],
      usos_comunes: ['Planta focal de interior', 'Decoracion en macetas grandes'],
      condiciones_ideales: 'Luz brillante indirecta, riego moderado y temperatura estable.',
    },
    care: {
      riego_frecuencia_dias: 9,
      instrucciones: 'Riega cuando los primeros 5 cm esten secos. Mantiene mejor salud con riegos profundos y buen drenaje.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio reduce el riego; con calor revisa antes y evita cambios bruscos de ubicacion.',
      exposicion_sol: 'Luz brillante indirecta, con sol suave filtrado si esta aclimatado.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Limpiar polvo de hojas', 'Evitar corrientes frias'],
      arquetipo_cuidado: 'aroide_tropical',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'media',
      temp_min_segura_c: 13,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Caida de hojas por cambios bruscos', 'Hojas amarillas por exceso de agua', 'Bordes secos'],
    },
  },
  {
    id: 'spathiphyllum-wallisii',
    scientificName: 'Spathiphyllum wallisii',
    commonNames: ['Cuna de Moises', 'Espatifilo', 'Lirio de la paz'],
    aliases: ['peace lily', 'spatifilium'],
    family: 'Araceae',
    info: {
      descripcion: 'Planta tropical de hojas verdes brillantes y espatas blancas, sensible a sequias largas.',
      origen: 'Regiones tropicales de America Central y norte de Sudamerica.',
      curiosidades: ['Sus flores visibles son espatas que rodean el espadice.', 'Se marchita dramaticamente cuando falta agua, pero suele recuperarse.'],
      usos_comunes: ['Interior luminoso sin sol directo', 'Planta ornamental de floracion'],
      condiciones_ideales: 'Humedad pareja sin encharcar, luz indirecta y temperaturas templadas.',
    },
    care: {
      riego_frecuencia_dias: 5,
      instrucciones: 'Mantén el sustrato ligeramente humedo, dejando secar solo la capa superior. Evita agua estancada.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor se marchita mas rapido; con frio reduce cantidad y frecuencia.',
      exposicion_sol: 'Luz indirecta media a brillante. El sol directo quema hojas.',
      seguimiento_foto_dias: 7,
      tareas_adicionales: ['Retirar flores secas desde la base', 'Usar agua reposada si hay puntas marrones por sales'],
      arquetipo_cuidado: 'alta_humedad',
      regla_humedad_sustrato: 'humedad_pareja',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'alta',
      temp_min_segura_c: 14,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Marchitez frecuente', 'Puntas marrones', 'Hojas amarillas con sustrato mojado'],
    },
  },
  {
    id: 'zamioculcas-zamiifolia',
    scientificName: 'Zamioculcas zamiifolia',
    commonNames: ['Zamioculca', 'ZZ plant', 'Planta ZZ'],
    aliases: ['zanzibar gem'],
    family: 'Araceae',
    info: {
      descripcion: 'Planta de rizomas carnosos y hojas brillantes, muy tolerante a sequia y luz interior baja.',
      origen: 'Africa oriental.',
      curiosidades: ['Almacena agua en rizomas subterraneos.', 'Crece lento en luz baja pero se mantiene estable.'],
      usos_comunes: ['Oficinas e interiores de bajo mantenimiento', 'Espacios con poca luz'],
      condiciones_ideales: 'Sustrato seco entre riegos, drenaje excelente y luz indirecta.',
    },
    care: {
      riego_frecuencia_dias: 20,
      instrucciones: 'Deja secar completamente el sustrato antes de volver a regar. Evita macetas sin drenaje.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'En frio o sombra riega muy poco; en calor revisa si los tallos empiezan a arrugarse.',
      exposicion_sol: 'Luz baja a brillante indirecta. Evita sol directo fuerte.',
      seguimiento_foto_dias: 21,
      tareas_adicionales: ['Limpiar hojas para mejorar fotosintesis', 'No dividir rizomas si la planta esta estresada'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'secar_completo',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'baja',
      temp_min_segura_c: 12,
      temp_max_confort_c: 32,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Tallos blandos', 'Hojas amarillas por exceso de agua', 'Rizomas blandos'],
    },
  },
  {
    id: 'chlorophytum-comosum',
    scientificName: 'Chlorophytum comosum',
    commonNames: ['Cinta', 'Mala madre', 'Lazo de amor', 'Planta arana'],
    aliases: ['spider plant'],
    family: 'Asparagaceae',
    info: {
      descripcion: 'Planta herbacea en roseta con hojas arqueadas y estolones que producen hijuelos.',
      origen: 'Africa austral tropical y meridional.',
      curiosidades: ['Produce hijuelos colgantes faciles de propagar.', 'Las puntas marrones suelen asociarse a sales, sequia o baja humedad.'],
      usos_comunes: ['Planta colgante', 'Interior luminoso'],
      condiciones_ideales: 'Luz indirecta, riego cuando seca la capa superior y humedad media.',
    },
    care: {
      riego_frecuencia_dias: 6,
      instrucciones: 'Riega cuando los 2 cm superiores esten secos. No dejes la maceta permanentemente empapada.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor puede pedir agua antes; con frio espera a que el sustrato pierda humedad.',
      exposicion_sol: 'Luz indirecta media a brillante, con sol suave filtrado.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Cortar puntas secas si molestan visualmente', 'Separar hijuelos cuando tengan raices'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'top_2cm_seco',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'media',
      temp_min_segura_c: 8,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Puntas marrones', 'Centro blando', 'Hojas palidas por exceso de sol'],
    },
  },
  {
    id: 'aloe-vera',
    scientificName: 'Aloe vera',
    commonNames: ['Aloe vera', 'Sabila'],
    aliases: ['aloe barbadensis miller', 'savila'],
    family: 'Asphodelaceae',
    info: {
      descripcion: 'Suculenta de hojas carnosas con gel interno, adaptada a periodos secos y alta luz.',
      origen: 'Probablemente Peninsula Arabiga, ampliamente cultivada en zonas calidas.',
      curiosidades: ['El gel se usa de forma tradicional en piel, pero no reemplaza consejo medico.', 'Se pudre rapido con exceso de agua.'],
      usos_comunes: ['Suculenta ornamental', 'Uso domestico tradicional del gel'],
      condiciones_ideales: 'Mucha luz, sustrato mineral drenante y riegos espaciados.',
    },
    care: {
      riego_frecuencia_dias: 14,
      instrucciones: 'Riega profundo solo cuando el sustrato este completamente seco. Usa maceta con drenaje.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio reduce mucho el riego; con calor y sol puede necesitar revisiones mas frecuentes.',
      exposicion_sol: 'Luz alta y varias horas de sol suave o directo aclimatado.',
      seguimiento_foto_dias: 21,
      tareas_adicionales: ['Retirar hijuelos solo si tienen buen tamano', 'Evitar platos con agua'],
      arquetipo_cuidado: 'suculenta_cactus',
      regla_humedad_sustrato: 'secar_completo',
      luz_categoria: 'media_alta',
      humedad_objetivo: 'baja',
      temp_min_segura_c: 7,
      temp_max_confort_c: 35,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Hojas blandas o translucidas', 'Base negra', 'Hojas muy delgadas por falta de agua o luz'],
    },
  },
  {
    id: 'ficus-lyrata',
    scientificName: 'Ficus lyrata',
    commonNames: ['Ficus lyrata', 'Ficus lira', 'Higuera hoja de violin'],
    aliases: ['fiddle leaf fig'],
    family: 'Moraceae',
    info: {
      descripcion: 'Ficus tropical de hojas grandes con forma de violin, vistoso pero sensible a cambios bruscos.',
      origen: 'Africa occidental tropical.',
      curiosidades: ['Puede botar hojas por cambios de luz, frio o riego irregular.', 'Necesita mas luz que muchos interiores comunes.'],
      usos_comunes: ['Planta focal de interior', 'Macetas grandes decorativas'],
      condiciones_ideales: 'Luz brillante indirecta, riego uniforme y ubicacion estable.',
    },
    care: {
      riego_frecuencia_dias: 8,
      instrucciones: 'Riega cuando los 5 cm superiores esten secos. Mantén drenaje y evita cambios constantes de lugar.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio alarga intervalos; con calor revisa antes sin encharcar.',
      exposicion_sol: 'Luz brillante indirecta, ideal cerca de ventana luminosa con sol filtrado.',
      seguimiento_foto_dias: 10,
      tareas_adicionales: ['Limpiar hojas grandes', 'Rotar suavemente para crecimiento equilibrado'],
      arquetipo_cuidado: 'aroide_tropical',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'media',
      temp_min_segura_c: 15,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Manchas marrones', 'Caida de hojas', 'Bordes secos'],
    },
  },
  {
    id: 'ocimum-basilicum',
    scientificName: 'Ocimum basilicum',
    commonNames: ['Albahaca', 'Basilico'],
    aliases: ['basil', 'albaca'],
    family: 'Lamiaceae',
    info: {
      descripcion: 'Hierba aromatica anual o perenne corta, de crecimiento rapido y alta demanda de luz.',
      origen: 'Regiones tropicales de Asia y Africa, cultivada globalmente.',
      curiosidades: ['Pellizcar puntas retrasa floracion y produce plantas mas frondosas.', 'Sufre rapido con frio.'],
      usos_comunes: ['Cocina', 'Huerto urbano', 'Aromatica en maceta'],
      condiciones_ideales: 'Sol directo suave a alto, riego regular y sustrato fertil pero drenante.',
    },
    care: {
      riego_frecuencia_dias: 3,
      instrucciones: 'Mantén humedad pareja sin encharcar. Revisa a diario si esta al sol o en maceta pequena.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor y sol puede requerir agua frecuente; con frio protege y reduce riego.',
      exposicion_sol: 'Al menos varias horas de sol directo suave o luz muy alta.',
      seguimiento_foto_dias: 7,
      tareas_adicionales: ['Cosechar puntas para ramificar', 'Retirar flores si quieres hojas tiernas'],
      arquetipo_cuidado: 'comestible_aromatica',
      regla_humedad_sustrato: 'top_2cm_seco',
      luz_categoria: 'sol_directo_suave',
      humedad_objetivo: 'media',
      temp_min_segura_c: 10,
      temp_max_confort_c: 32,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Marchitez al mediodia', 'Tallos negros por frio o exceso de agua', 'Floracion temprana'],
    },
  },
  {
    id: 'dracaena-fragrans',
    scientificName: 'Dracaena fragrans',
    commonNames: ['Tronco del Brasil', 'Palo de agua', 'Dracena fragrans'],
    aliases: ['dracaena fragrans', 'corn plant', 'palo de brasil'],
    family: 'Asparagaceae',
    info: {
      descripcion: 'Planta de interior de tallos lenosos y rosetas de hojas largas, popular por tolerar luz media y cuidados moderados.',
      origen: 'Africa tropical.',
      curiosidades: ['Suele venderse como troncos brotados en maceta.', 'Es sensible al exceso de sales y al agua acumulada.'],
      usos_comunes: ['Interior luminoso', 'Oficinas y espacios con luz filtrada'],
      condiciones_ideales: 'Luz indirecta media a brillante, temperatura estable y sustrato que se seque parcialmente.',
    },
    care: {
      riego_frecuencia_dias: 10,
      instrucciones: 'Riega cuando los primeros 5 cm del sustrato esten secos. Evita que el tronco quede en sustrato empapado.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio o poca luz alarga el intervalo; con calor revisa antes, sin mantener humedad constante.',
      exposicion_sol: 'Luz indirecta media o brillante. Evita sol directo fuerte sobre las hojas.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Limpiar hojas largas para retirar polvo', 'Usar agua reposada si aparecen puntas marrones'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'media',
      temp_min_segura_c: 12,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: false },
      senales_alerta: ['Puntas marrones', 'Tronco blando', 'Hojas amarillas inferiores'],
    },
  },
  {
    id: 'calathea-orbifolia',
    scientificName: 'Goeppertia orbifolia',
    commonNames: ['Calathea orbifolia', 'Calatea', 'Calathea'],
    aliases: ['calatea orbifolia', 'goeppertia orbifolia'],
    family: 'Marantaceae',
    info: {
      descripcion: 'Planta tropical de hojas grandes y redondeadas con franjas plateadas, apreciada por su follaje ornamental.',
      origen: 'Bosques tropicales de Bolivia.',
      curiosidades: ['Muchas calatheas mueven sus hojas entre dia y noche.', 'Las puntas secas suelen revelar baja humedad o sales en el agua.'],
      usos_comunes: ['Interior humedo y luminoso', 'Planta ornamental de follaje'],
      condiciones_ideales: 'Luz indirecta, humedad ambiental alta y sustrato apenas humedo sin encharcar.',
    },
    care: {
      riego_frecuencia_dias: 5,
      instrucciones: 'Mantén humedad ligera y pareja. Riega cuando la capa superior empiece a secar, sin dejar agua en el plato.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con aire seco o calor revisa humedad mas seguido; con frio reduce para evitar pudricion.',
      exposicion_sol: 'Luz indirecta media a brillante. El sol directo marca o enrolla hojas.',
      seguimiento_foto_dias: 7,
      tareas_adicionales: ['Aumentar humedad agrupando plantas o con bandeja humeda', 'Evitar corrientes frias'],
      arquetipo_cuidado: 'alta_humedad',
      regla_humedad_sustrato: 'humedad_pareja',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'alta',
      temp_min_segura_c: 15,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Hojas enrolladas', 'Puntas secas', 'Manchas por sol directo'],
    },
  },
  {
    id: 'nephrolepis-exaltata',
    scientificName: 'Nephrolepis exaltata',
    commonNames: ['Helecho espada', 'Helecho Boston', 'Helecho peine'],
    aliases: ['boston fern', 'helecho comun', 'helecho'],
    family: 'Nephrolepidaceae',
    info: {
      descripcion: 'Helecho de frondas arqueadas y verdes, comun en interiores frescos, banos luminosos y patios sombreados.',
      origen: 'Regiones tropicales y subtropicales de America y otras zonas calidas.',
      curiosidades: ['No produce flores ni semillas visibles; se reproduce por esporas.', 'Pierde foliolos rapido si se seca demasiado.'],
      usos_comunes: ['Planta colgante', 'Interior humedo', 'Patios sombreados'],
      condiciones_ideales: 'Luz indirecta, humedad alta y sustrato constantemente fresco pero drenado.',
    },
    care: {
      riego_frecuencia_dias: 4,
      instrucciones: 'No dejes secar completamente el sustrato. Riega cuando la superficie pierda humedad y asegura drenaje.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor y viento se seca rapido; con frio reduce cantidad pero evita sequia total.',
      exposicion_sol: 'Sombra luminosa o luz indirecta. Evita sol directo de tarde.',
      seguimiento_foto_dias: 7,
      tareas_adicionales: ['Retirar frondas secas desde la base', 'Aumentar humedad ambiental si cruje o bota foliolos'],
      arquetipo_cuidado: 'alta_humedad',
      regla_humedad_sustrato: 'humedad_pareja',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'alta',
      temp_min_segura_c: 10,
      temp_max_confort_c: 28,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Frondas quebradizas', 'Foliolos cayendo', 'Centro con pudricion'],
    },
  },
  {
    id: 'tradescantia-zebrina',
    scientificName: 'Tradescantia zebrina',
    commonNames: ['Tradescantia zebrina', 'Amor de hombre', 'Panamena', 'Zebrina'],
    aliases: ['wandering dude', 'inch plant', 'tradescantia'],
    family: 'Commelinaceae',
    info: {
      descripcion: 'Planta colgante de crecimiento rapido, con hojas verde plateadas y reverso purpura.',
      origen: 'Mexico, Centroamerica y norte de Sudamerica.',
      curiosidades: ['Enraiza facilmente por esquejes.', 'Se vuelve mas compacta y colorida con buena luz indirecta.'],
      usos_comunes: ['Planta colgante', 'Cubresuelo en zonas protegidas', 'Interior luminoso'],
      condiciones_ideales: 'Luz brillante indirecta, riego moderado y podas regulares para renovar tallos.',
    },
    care: {
      riego_frecuencia_dias: 6,
      instrucciones: 'Riega cuando los 2 cm superiores esten secos. No mantengas tallos apoyados en sustrato encharcado.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor crece y bebe mas; con frio o poca luz alarga riegos para evitar tallos blandos.',
      exposicion_sol: 'Luz brillante indirecta o sol suave de manana. Mucha sombra apaga el color.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Pellizcar puntas para compactar', 'Reenraizar esquejes si la base queda pelada'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'top_2cm_seco',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'media',
      temp_min_segura_c: 8,
      temp_max_confort_c: 32,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: false, mascotas: true, irritante_piel: true },
      senales_alerta: ['Tallos blandos', 'Base pelada', 'Color apagado por poca luz'],
    },
  },
  {
    id: 'yucca-gigantea',
    scientificName: 'Yucca gigantea',
    commonNames: ['Yuca', 'Yucca', 'Yuca de interior', 'Izote'],
    aliases: ['yucca elephantipes', 'yuca pie de elefante', 'spineless yucca'],
    family: 'Asparagaceae',
    info: {
      descripcion: 'Planta de tallo lenoso y hojas rigidas en roseta, usada como planta estructural en interiores luminosos.',
      origen: 'Mexico y Centroamerica.',
      curiosidades: ['Se vende frecuentemente como troncos de distintas alturas.', 'Tolera sequia mejor que exceso de agua.'],
      usos_comunes: ['Interior muy luminoso', 'Terrazas protegidas', 'Planta focal'],
      condiciones_ideales: 'Mucha luz, sustrato drenante y riegos espaciados.',
    },
    care: {
      riego_frecuencia_dias: 14,
      instrucciones: 'Deja secar gran parte del sustrato antes de regar. Evita macetas sin drenaje.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con sol y calor puede pedir agua antes; con frio o interior sombrio riega muy poco.',
      exposicion_sol: 'Luz alta, ideal con sol suave o directo aclimatado.',
      seguimiento_foto_dias: 21,
      tareas_adicionales: ['Retirar hojas inferiores secas', 'Rotar si se inclina hacia la luz'],
      arquetipo_cuidado: 'suculenta_cactus',
      regla_humedad_sustrato: 'secar_completo',
      luz_categoria: 'media_alta',
      humedad_objetivo: 'baja',
      temp_min_segura_c: 7,
      temp_max_confort_c: 35,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: false },
      senales_alerta: ['Tronco blando', 'Hojas amarillas bajas', 'Puntas secas por baja humedad o roce'],
    },
  },
  {
    id: 'aspidistra-elatior',
    scientificName: 'Aspidistra elatior',
    commonNames: ['Aspidistra', 'Pilistra', 'Hoja de salon'],
    aliases: ['cast iron plant', 'planta de hierro'],
    family: 'Asparagaceae',
    info: {
      descripcion: 'Planta rizomatosa de hojas largas y coriaceas, famosa por resistir sombra, descuidos y ambientes interiores dificiles.',
      origen: 'Japon y Taiwan.',
      curiosidades: ['Crece lento y rara vez florece de forma visible en interior.', 'Es una clasica planta de sombra por su tolerancia.'],
      usos_comunes: ['Rincones de baja luz', 'Pasillos interiores', 'Planta de bajo mantenimiento'],
      condiciones_ideales: 'Luz baja o filtrada, riego moderado y temperaturas frescas a templadas.',
    },
    care: {
      riego_frecuencia_dias: 12,
      instrucciones: 'Riega cuando la capa superior este seca. Tolera sequias cortas mejor que sustrato empapado.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'En invierno o sombra profunda baja la frecuencia; en calor revisa antes sin saturar.',
      exposicion_sol: 'Luz baja a media filtrada. Evita sol directo.',
      seguimiento_foto_dias: 21,
      tareas_adicionales: ['Limpiar hojas ocasionalmente', 'Dividir rizomas solo cuando la planta este fuerte'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'media',
      temp_min_segura_c: 5,
      temp_max_confort_c: 25,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Hojas amarillas por exceso de agua', 'Puntas secas', 'Manchas por sol directo'],
    },
  },
  {
    id: 'ficus-benjamina',
    scientificName: 'Ficus benjamina',
    commonNames: ['Ficus benjamina', 'Ficus', 'Ficus lloron'],
    aliases: ['ficus espanol', 'weeping fig'],
    family: 'Moraceae',
    info: {
      descripcion: 'Arbol de interior de hojas pequenas y ramas arqueadas, comun en casas y oficinas luminosas.',
      origen: 'Asia tropical y Australia.',
      curiosidades: ['Suele botar hojas cuando cambia de ubicacion o luz.', 'Puede vivir muchos anos en maceta con podas suaves.'],
      usos_comunes: ['Interior luminoso', 'Oficinas', 'Macetas grandes'],
      condiciones_ideales: 'Luz indirecta brillante, riego estable y pocos cambios de lugar.',
    },
    care: {
      riego_frecuencia_dias: 8,
      instrucciones: 'Riega cuando los primeros 5 cm esten secos. Evita cambios bruscos de riego y ubicacion.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio o baja luz reduce; con calor revisa antes y evita que se seque por completo muchos dias.',
      exposicion_sol: 'Luz brillante indirecta, con algo de sol suave si esta aclimatado.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Rotar poco a poco si se inclina', 'Podar puntas para mantener forma'],
      arquetipo_cuidado: 'aroide_tropical',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'media',
      temp_min_segura_c: 12,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: true },
      senales_alerta: ['Caida repentina de hojas', 'Hojas amarillas', 'Arañita roja en ambiente seco'],
    },
  },
  {
    id: 'phalaenopsis-hybrid',
    scientificName: 'Phalaenopsis spp.',
    commonNames: ['Orquidea Phalaenopsis', 'Orquidea mariposa', 'Orquidea'],
    aliases: ['phalaenopsis', 'moth orchid'],
    family: 'Orchidaceae',
    info: {
      descripcion: 'Orquidea epifita de floracion duradera, muy vendida como planta de interior decorativa.',
      origen: 'Asia tropical y Australia, con muchos hibridos comerciales.',
      curiosidades: ['Sus raices necesitan aire, no tierra comun.', 'Puede reflorecer desde varas sanas con buen cuidado.'],
      usos_comunes: ['Interior luminoso', 'Planta de floracion', 'Regalo ornamental'],
      condiciones_ideales: 'Luz brillante indirecta, sustrato de corteza aireado y riegos cuando las raices aclaran.',
    },
    care: {
      riego_frecuencia_dias: 7,
      instrucciones: 'Riega cuando la corteza este casi seca y las raices se vean plateadas. No dejes agua en la corona.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio seca mas lento; con calor o calefaccion revisa raices y peso de la maceta.',
      exposicion_sol: 'Luz brillante indirecta. Evita sol directo que queme hojas.',
      seguimiento_foto_dias: 10,
      tareas_adicionales: ['Usar maceta con ventilacion', 'Cortar varas secas solo cuando esten completamente marrones'],
      arquetipo_cuidado: 'floracion_interior',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'brillante_indirecta',
      humedad_objetivo: 'media',
      temp_min_segura_c: 14,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Raices cafes y blandas', 'Hojas arrugadas', 'Agua acumulada en la corona'],
    },
  },
  {
    id: 'kalanchoe-blossfeldiana',
    scientificName: 'Kalanchoe blossfeldiana',
    commonNames: ['Kalanchoe', 'Calanchoe', 'Kalanchoe de flor'],
    aliases: ['flaming katy', 'flor de kalanchoe'],
    family: 'Crassulaceae',
    info: {
      descripcion: 'Suculenta compacta de hojas carnosas y floracion vistosa, comun en macetas pequenas.',
      origen: 'Madagascar.',
      curiosidades: ['Florece mejor con mucha luz y dias cortos.', 'Sus hojas almacenan agua, por eso sufre con exceso de riego.'],
      usos_comunes: ['Interior luminoso', 'Balcones protegidos', 'Planta de floracion'],
      condiciones_ideales: 'Luz alta, sustrato drenante y riego espaciado.',
    },
    care: {
      riego_frecuencia_dias: 10,
      instrucciones: 'Deja secar bien el sustrato antes de regar. No mojes flores ni mantengas agua en el plato.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio baja mucho el riego; con sol y calor revisa cuando las hojas pierdan firmeza.',
      exposicion_sol: 'Luz alta con sol suave. En interior necesita ventana luminosa.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Retirar flores secas', 'No fertilizar si esta en reposo o con poca luz'],
      arquetipo_cuidado: 'floracion_interior',
      regla_humedad_sustrato: 'secar_completo',
      luz_categoria: 'media_alta',
      humedad_objetivo: 'baja',
      temp_min_segura_c: 8,
      temp_max_confort_c: 32,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: true, mascotas: true, irritante_piel: false },
      senales_alerta: ['Tallos blandos', 'Hojas translucidas', 'Flores marchitas con sustrato mojado'],
    },
  },
  {
    id: 'cissus-antarctica',
    scientificName: 'Cissus antarctica',
    commonNames: ['Cissus antarctica', 'Parra de departamento', 'Ciso'],
    aliases: ['kangaroo vine', 'cissus'],
    family: 'Vitaceae',
    info: {
      descripcion: 'Trepadora o colgante de hojas verdes brillantes, usada en interior por su crecimiento vigoroso.',
      origen: 'Australia.',
      curiosidades: ['Se puede guiar en tutor o dejar colgante.', 'Agradece podas para mantenerse densa.'],
      usos_comunes: ['Interior luminoso', 'Planta colgante', 'Trepadora en tutor'],
      condiciones_ideales: 'Luz indirecta media, riego moderado y sustrato con buen drenaje.',
    },
    care: {
      riego_frecuencia_dias: 7,
      instrucciones: 'Riega cuando los primeros 2 a 5 cm esten secos. Evita sequias extremas y encharcamientos.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor y crecimiento activo revisa antes; con frio o baja luz reduce frecuencia.',
      exposicion_sol: 'Luz indirecta media a brillante. Evita sol fuerte de tarde.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Podar puntas largas', 'Revisar arañita roja si el ambiente esta seco'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'top_2cm_seco',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'media',
      temp_min_segura_c: 8,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Hojas secas y crujientes', 'Tallos muy largos sin hojas', 'Telaranas finas por arañita'],
    },
  },
  {
    id: 'peperomia-obtusifolia',
    scientificName: 'Peperomia obtusifolia',
    commonNames: ['Peperomia', 'Peperomia obtusifolia', 'Peperomia cuchara'],
    aliases: ['baby rubber plant', 'peperomia verde'],
    family: 'Piperaceae',
    info: {
      descripcion: 'Planta compacta de hojas carnosas y brillantes, facil de ubicar en repisas y escritorios luminosos.',
      origen: 'Florida, Mexico, Caribe y norte de Sudamerica.',
      curiosidades: ['Sus hojas carnosas guardan agua.', 'Se propaga con esquejes de tallo u hoja.'],
      usos_comunes: ['Escritorios', 'Repisas interiores', 'Macetas pequenas'],
      condiciones_ideales: 'Luz indirecta, sustrato aireado y riegos prudentes.',
    },
    care: {
      riego_frecuencia_dias: 9,
      instrucciones: 'Riega cuando la mitad superior del sustrato este seca. Prefiere quedarse algo corta de agua a estar empapada.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con frio o poca luz espera mas; con calor revisa si las hojas pierden firmeza.',
      exposicion_sol: 'Luz indirecta media a brillante. Evita sol directo intenso.',
      seguimiento_foto_dias: 14,
      tareas_adicionales: ['Usar sustrato aireado', 'Pellizcar puntas si se estira'],
      arquetipo_cuidado: 'baja_luz_resistente',
      regla_humedad_sustrato: 'top_5cm_seco',
      luz_categoria: 'baja_media',
      humedad_objetivo: 'media',
      temp_min_segura_c: 12,
      temp_max_confort_c: 30,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Hojas blandas por exceso de agua', 'Tallos estirados', 'Caida de hojas por frio'],
    },
  },
  {
    id: 'buddleja-globosa',
    scientificName: 'Buddleja globosa',
    commonNames: ['Matico', 'Panil', 'Palguin'],
    aliases: ['matico chileno', 'budleja globosa', 'buddleia globosa', 'panil', 'palguin'],
    family: 'Scrophulariaceae',
    info: {
      descripcion: 'Arbusto medicinal nativo de Chile y el sur de Sudamerica, de hojas lanceoladas rugosas y flores globosas anaranjadas.',
      origen: 'Chile, Argentina y zonas templadas del sur de Sudamerica.',
      curiosidades: ['Se usa tradicionalmente para cicatrizacion y malestares digestivos.', 'Enraiza por esquejes semilenosos si mantiene humedad y buena luz indirecta.'],
      usos_comunes: ['Planta medicinal tradicional', 'Arbusto nativo para jardines y huertos', 'Propagacion por esqueje'],
      condiciones_ideales: 'Luz natural brillante, sustrato drenante, humedad moderada durante el establecimiento y proteccion de frio fuerte.',
    },
    care: {
      riego_frecuencia_dias: 5,
      instrucciones: 'Durante el enraizamiento por esqueje, manten el medio humedo pero oxigenado. Si esta en agua, cambia el agua cada 48 a 72 horas y evita sol directo fuerte.',
      alertas_clima: [
        'Luz baja durante el enraizamiento aumenta riesgo de marchitez y falla.',
        'El exceso de hojas en el esqueje puede deshidratarlo antes de formar raices.',
        ...DEFAULT_ALERTS,
      ],
      riego_ajuste_clima: 'Con calor revisa perdida de turgencia y evapotranspiracion; con frio o sombra reduce riego y evita agua estancada.',
      exposicion_sol: 'Luz natural indirecta brillante. Cerca de ventana luminosa o exterior protegido; evita sombra profunda y sol fuerte de tarde en esquejes.',
      seguimiento_foto_dias: 3,
      tareas_adicionales: ['Recortar puntas de hojas grandes en esquejes', 'Cambiar agua cada 48 a 72 horas si propaga en botella', 'Mover a luz indirecta brillante'],
      arquetipo_cuidado: 'comestible_aromatica',
      regla_humedad_sustrato: 'humedad_pareja',
      luz_categoria: 'media_alta',
      humedad_objetivo: 'media',
      temp_min_segura_c: 5,
      temp_max_confort_c: 28,
      drenaje_requerido: true,
      fertilizacion_temporada: 'minima',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Marchitez de hojas superiores', 'Agua turbia o con mal olor', 'Base del tallo oscura o blanda', 'Hojas amarillas por baja luz'],
    },
  },
  {
    id: 'mentha-spicata',
    scientificName: 'Mentha spicata',
    commonNames: ['Hierbabuena', 'Menta verde', 'Spearmint'],
    aliases: ['menta', 'mentita', 'menta hierbabuena', 'yerbabuena'],
    family: 'Lamiaceae',
    info: {
      descripcion: 'Hierba aromatica perenne de crecimiento vigoroso, apreciada por sus hojas frescas, aroma intenso y uso culinario.',
      origen: 'Europa y Asia occidental, hoy cultivada ampliamente en huertos y macetas.',
      curiosidades: ['Se expande con facilidad por estolones y raices superficiales.', 'La poda frecuente mantiene hojas tiernas y una planta mas compacta.'],
      usos_comunes: ['Infusiones y cocina fresca', 'Aromatica de maceta o huerto', 'Planta atractiva para polinizadores cuando florece'],
      condiciones_ideales: 'Luz brillante indirecta o sol suave, sustrato fresco con buen drenaje y humedad ambiental media a alta.',
    },
    care: {
      riego_frecuencia_dias: 4,
      instrucciones: 'Mantiene el sustrato ligeramente humedo, regando cuando los 2 cm superiores empiezan a secarse. Evita encharcar.',
      alertas_clima: DEFAULT_ALERTS,
      riego_ajuste_clima: 'Con calor o viento revisa antes; con frio o poca luz alarga el intervalo y evita exceso de agua.',
      exposicion_sol: 'Luz brillante indirecta o sol suave de manana. Evita sol fuerte de tarde si esta en maceta pequena.',
      seguimiento_foto_dias: 7,
      tareas_adicionales: ['Podar puntas para fomentar brotes tiernos', 'Vigilar raices apretadas si el crecimiento se frena'],
      arquetipo_cuidado: 'comestible_aromatica',
      regla_humedad_sustrato: 'top_2cm_seco',
      luz_categoria: 'media_alta',
      humedad_objetivo: 'alta',
      temp_min_segura_c: 8,
      temp_max_confort_c: 28,
      drenaje_requerido: true,
      fertilizacion_temporada: 'crecimiento_activo',
      toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
      senales_alerta: ['Hojas amarillas por exceso o falta de agua', 'Bordes secos por baja humedad o sol fuerte', 'Crecimiento lento por poca luz, nutrientes o raices apretadas'],
    },
  },
];

function normalizeName(value?: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesName(candidate: string, names: string[]) {
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedCandidate) return false;
  return names.some((name) => normalizeName(name) === normalizedCandidate);
}

export function findPlantKnowledgeByName(value?: string): PlantKnowledgeMatch | null {
  if (!value) return null;

  for (const entry of PLANT_KNOWLEDGE_BASE) {
    if (matchesName(value, [entry.scientificName])) {
      return { entry, matchedBy: 'scientific_name' };
    }
  }

  for (const entry of PLANT_KNOWLEDGE_BASE) {
    if (matchesName(value, entry.commonNames)) {
      return { entry, matchedBy: 'common_name' };
    }
  }

  for (const entry of PLANT_KNOWLEDGE_BASE) {
    if (matchesName(value, entry.aliases || [])) {
      return { entry, matchedBy: 'alias' };
    }
  }

  return null;
}

export function findPlantKnowledgeByKey(value?: string): PlantKnowledgeEntry | null {
  const key = normalizeName(value).replace(/\s+/g, '-');
  if (!key) return null;
  return PLANT_KNOWLEDGE_BASE.find((entry) => entry.id === key) || null;
}

export function findPlantKnowledge(plantData: Partial<Plant>): PlantKnowledgeMatch | null {
  const keyedEntry = findPlantKnowledgeByKey(plantData.species_key);
  if (keyedEntry) return { entry: keyedEntry, matchedBy: 'alias' };

  return (
    findPlantKnowledgeByName(plantData.nombre_cientifico) ||
    findPlantKnowledgeByName(plantData.nombre_comun)
  );
}

export function enrichPlantWithKnowledge<T extends Partial<Plant>>(plantData: T): T {
  const match = findPlantKnowledge(plantData);
  if (!match) {
    return {
      ...plantData,
      knowledge_source: {
        source: 'ai_generated',
        confidence: plantData.nombre_cientifico === 'Especie no confirmada' ? 'baja' : 'media',
        updatedAt: PLANT_KNOWLEDGE_VERSION,
      },
    } as T;
  }

  return {
    ...plantData,
    species_key: match.entry.id,
    nombre_comun: match.entry.commonNames[0],
    nombre_cientifico: match.entry.scientificName,
    familia: match.entry.family,
    info_general: match.entry.info,
    knowledge_source: {
      source: 'static_catalog',
      catalogId: match.entry.id,
      catalogVersion: PLANT_KNOWLEDGE_VERSION,
      matchedBy: match.matchedBy,
      confidence: 'alta',
      updatedAt: PLANT_KNOWLEDGE_VERSION,
    },
  } as T;
}

function contextCareNotes(contextSummary?: string) {
  if (!contextSummary) return [];

  const summary = normalizeName(contextSummary);
  const notes: string[] = [];

  if (summary.includes('maceta con drenaje no')) {
    notes.push('Como la maceta podria no drenar, riega menos cantidad y considera cambiar a una maceta con orificios.');
  }
  if (summary.includes('ubicacion de cultivo balcon') || summary.includes('ubicacion de cultivo exterior')) {
    notes.push('En exterior revisa viento, lluvia directa y sol de tarde antes de mantener la frecuencia base.');
  }
  if (summary.includes('luz habitual indicada baja')) {
    notes.push('Con luz baja el sustrato seca mas lento; prioriza la prueba de humedad antes del calendario.');
  }

  return notes;
}

function isOutdoorContext(contextSummary?: string) {
  if (!contextSummary) return false;
  const summary = normalizeName(contextSummary);
  return summary.includes('ubicacion de cultivo balcon') || summary.includes('ubicacion de cultivo exterior');
}

function isLowLightContext(contextSummary?: string) {
  return normalizeName(contextSummary).includes('luz habitual indicada baja');
}

type ConservativeCarePlan = Omit<Required<CarePlan>, 'arquetipo_cuidado'> & {
  arquetipo_cuidado?: CareArchetype;
};

function climateCareAdjustments(
  care: ConservativeCarePlan,
  weather?: WeatherConditions,
  contextSummary?: string,
) {
  const alerts: string[] = [];
  const wateringNotes: string[] = [];
  const taskNotes: string[] = [];
  let fertilization = care.fertilizacion_temporada;
  let light = care.exposicion_sol;
  const archetype = care.arquetipo_cuidado;
  const isSucculent = archetype === 'suculenta_cactus';
  const isHighHumidity = archetype === 'alta_humedad';

  if (!weather) {
    alerts.push('Clima real no disponible: usa la prueba de humedad del sustrato antes del calendario.');
    return { fertilization, light, alerts, wateringNotes, taskNotes };
  }

  if (weather.temp_max !== undefined && weather.temp_max >= 30) {
    if (!isSucculent) {
      wateringNotes.push('Por calor alto, revisa humedad 1 a 2 dias antes de la frecuencia base.');
    }
    alerts.push(`Maxima local cercana a ${weather.temp_max} C: evita sol fuerte de tarde y vigila marchitez.`);
  }

  if (weather.temp_max !== undefined && weather.temp_max >= 32 && care.luz_categoria !== 'sol_directo_alto') {
    light = `${light} En calor extremo, filtra el sol directo de tarde aunque la planta tolere buena luz.`;
  }

  if (weather.temp_min !== undefined && weather.temp_min <= 10) {
    fertilization = 'no_recomendada';
    wateringNotes.push('Con frio, el sustrato seca mas lento: reduce cantidad de agua y espera senales claras de secado.');
    alerts.push(`Minima local cercana a ${weather.temp_min} C: protege de corrientes frias y suspende fertilizacion.`);
  }

  if (weather.lluvia !== undefined && weather.lluvia > 5 && isOutdoorContext(contextSummary)) {
    wateringNotes.push('Como hay lluvia y la planta esta fuera o en balcon, retrasa riego y revisa drenaje primero.');
    alerts.push(`Lluvia estimada de ${weather.lluvia} mm: revisa que la maceta no quede con agua acumulada.`);
  }

  if (weather.humedad_relativa !== undefined && weather.humedad_relativa < 40 && isHighHumidity) {
    alerts.push(`Humedad ambiental baja (${weather.humedad_relativa}%): aumenta humedad ambiental sin mojar permanentemente hojas ni sustrato.`);
    taskNotes.push('Agrupar plantas o usar bandeja con piedras y agua sin que la maceta toque el agua.');
  }

  if (isLowLightContext(contextSummary)) {
    fertilization = fertilization === 'crecimiento_activo' ? 'minima' : fertilization;
    wateringNotes.push('Con luz baja, prioriza revisar sustrato: normalmente seca mas lento.');
  }

  return { fertilization, light, alerts, wateringNotes, taskNotes };
}

function conservativeBaseCarePlan(input: GenerateCarePlanInput): ConservativeCarePlan {
  const existing = input.plantData.plan_cuidados || {};
  const confirmedArchetype = existing.arquetipo_cuidado;
  const conservativeArchetype = confirmedArchetype || 'aroide_tropical';
  const soilRule = existing.regla_humedad_sustrato || (
    conservativeArchetype === 'suculenta_cactus'
      ? 'secar_completo'
      : conservativeArchetype === 'alta_humedad'
        ? 'humedad_pareja'
        : 'top_5cm_seco'
  );

  return {
    riego_frecuencia_dias: existing.riego_frecuencia_dias || 7,
    instrucciones: existing.instrucciones || 'Revisa la humedad del sustrato antes de regar. Si aun esta humedo, espera aunque toque por calendario.',
    alertas_clima: existing.alertas_clima || DEFAULT_ALERTS,
    riego_ajuste_clima: existing.riego_ajuste_clima || 'Reduce riego con frio, lluvia o baja luz; revisa antes con calor.',
    exposicion_sol: existing.exposicion_sol || 'Luz indirecta brillante, evitando sol fuerte de tarde si la planta no esta aclimatada.',
    seguimiento_foto_dias: existing.seguimiento_foto_dias || 10,
    tareas_adicionales: existing.tareas_adicionales || ['Revisar drenaje y peso de la maceta antes de regar'],
    arquetipo_cuidado: confirmedArchetype,
    regla_humedad_sustrato: soilRule,
    luz_categoria: existing.luz_categoria || 'brillante_indirecta',
    humedad_objetivo: existing.humedad_objetivo || (conservativeArchetype === 'alta_humedad' ? 'alta' : 'media'),
    temp_min_segura_c: existing.temp_min_segura_c ?? 10,
    temp_max_confort_c: existing.temp_max_confort_c ?? 30,
    drenaje_requerido: existing.drenaje_requerido ?? true,
    fertilizacion_temporada: existing.fertilizacion_temporada || 'minima',
    toxicidad: existing.toxicidad || {},
    senales_alerta: existing.senales_alerta || ['Hojas amarillas', 'Marchitez persistente', 'Sustrato con mal olor o siempre mojado'],
  };
}

export function buildConservativeCarePlan(input: GenerateCarePlanInput): CarePlan {
  const care = conservativeBaseCarePlan(input);
  const location = input.city ? ` en ${input.city}` : '';
  const contextNotes = contextCareNotes(input.contextSummary);
  const climate = climateCareAdjustments(care, input.weather, input.contextSummary);
  const localWeatherLine = input.weather
    ? `Ajuste local${location}: ${input.weatherSummary}`
    : `Ajuste local${location}: sin clima real disponible; usa revision manual del sustrato.`;

  return {
    ...care,
    // Reference review interval: current weather may explain care, never rewrite it.
    riego_frecuencia_dias: care.riego_frecuencia_dias,
    exposicion_sol: climate.light,
    fertilizacion_temporada: climate.fertilization,
    tareas_adicionales: [
      ...care.tareas_adicionales,
      ...climate.taskNotes,
    ].slice(0, 6),
    alertas_clima: [
      ...climate.alerts,
      localWeatherLine,
      ...contextNotes,
      ...care.alertas_clima,
    ].slice(0, 6),
    instrucciones: `${care.instrucciones} Plan local conservador usado cuando la IA no esta disponible.`,
    riego_ajuste_clima: [
      care.riego_ajuste_clima,
      ...climate.wateringNotes,
      'Ajuste generado localmente con el clima disponible.',
    ].join(' '),
  };
}

export function buildStaticCarePlan(input: GenerateCarePlanInput): CarePlan | null {
  const match = findPlantKnowledge(input.plantData);
  if (!match) return null;

  const care = match.entry.care;
  const location = input.city ? ` en ${input.city}` : '';
  const contextNotes = contextCareNotes(input.contextSummary);
  const climate = climateCareAdjustments(care, input.weather, input.contextSummary);
  const localWeatherLine = input.weather
    ? `Ajuste local${location}: ${input.weatherSummary}`
    : `Ajuste local${location}: sin clima real disponible; conserva riego prudente hasta poder consultar el tiempo.`;

  return {
    ...care,
    // Reference review interval: current weather may explain care, never rewrite it.
    riego_frecuencia_dias: care.riego_frecuencia_dias,
    exposicion_sol: climate.light,
    fertilizacion_temporada: climate.fertilization,
    tareas_adicionales: [
      ...care.tareas_adicionales,
      ...climate.taskNotes,
    ].slice(0, 6),
    alertas_clima: [
      ...climate.alerts,
      ...care.alertas_clima,
      localWeatherLine,
      ...contextNotes,
    ].slice(0, 6),
    instrucciones: `${care.instrucciones} Usa esta regla por sobre el calendario si notas que el sustrato aun esta humedo.`,
    riego_ajuste_clima: [
      care.riego_ajuste_clima,
      ...climate.wateringNotes,
      'Recalibra con el clima real de tu ciudad y el secado observado en la maceta.',
    ].join(' '),
  };
}
