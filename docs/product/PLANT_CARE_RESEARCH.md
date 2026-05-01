# Investigacion de cuidados reales para Lleken

Fecha de investigacion: 2026-04-28

Este archivo resume informacion botanica practica para mejorar Lleken como app de cuidado de plantas. La investigacion se enfoca en plantas de interior y maceta, porque el producto actual identifica plantas por foto, guarda ciudad/clima, genera plan de riego/luz, crea calendario y permite seguimiento por foto.

## Contexto detectado en la app

Lleken ya tiene una base funcional para convertir esta investigacion en producto:

- `Plant` guarda nombre comun, nombre cientifico, familia, estado, salud, ciudad, clima, plan de cuidados, historial, ultimo riego y ultimo seguimiento.
- `CarePlan` contiene frecuencia de riego, instrucciones, alertas de clima, exposicion solar, frecuencia de seguimiento por foto y tareas adicionales.
- `server/index.ts` usa Gemini para identificar planta, generar plan y analizar seguimiento.
- `src/lib/weather.ts` ya consulta Open-Meteo para temperatura y lluvia.
- `Calendar.tsx` genera tareas de riego y foto desde `riego_frecuencia_dias` y `seguimiento_foto_dias`.
- `PlantProfile.tsx` muestra resumen de cuidados, alerta climatica, estado de suelo estimado e historial.

La principal mejora de dominio no es agregar mas texto: es hacer que el plan de cuidado sea menos rigido y mas explicable. Una frecuencia de riego debe ser una estimacion ajustada por planta, maceta, sustrato, luz, temperatura, humedad, estacion y clima.

## Hallazgos principales

### 1. El riego debe basarse en sustrato y drenaje, no solo en calendario

Oklahoma State University Extension resume que muchos problemas de plantas de interior vienen de riego incorrecto. La recomendacion base es regar a fondo y dejar drenar; la mayoria de plantas se riegan cuando el medio se aproxima a seco, pero cactus/suculentas deben secarse aun mas antes del siguiente riego.

Implicacion para Lleken:

- Mantener `riego_frecuencia_dias` solo como estimacion.
- Agregar o derivar una regla visible tipo: "regar cuando los primeros 2 cm esten secos", "regar cuando los primeros 5 cm esten secos" o "regar solo cuando el sustrato este completamente seco".
- En el calendario, mostrar una tarea de "revisar humedad" antes de sugerir riego automatico.
- Si el usuario marca riego pero la app detecta lluvia/frio/baja luz, mostrar advertencia de reduccion.

Reglas accionables:

- Plantas tropicales comunes: revisar los 2 a 5 cm superiores.
- Helechos y plantas de alta humedad: mantener humedad pareja, sin encharcar.
- Cactus y suculentas: dejar secar completamente y esperar algunos dias mas si el ambiente esta frio o con poca luz.
- Macetas chicas secan mas rapido; macetas grandes y sin drenaje son alto riesgo de pudricion.
- Nunca dejar agua acumulada en el cubremaceta o plato.

Fuente base: Oklahoma State University Extension, "Houseplant Care": https://extension.okstate.edu/fact-sheets/houseplant-care

### 2. La luz debe ser una categoria de cuidado, no texto libre

La misma fuente divide plantas de interior por rangos de luz: baja/media y media/alta. RHS tambien recomienda luz brillante indirecta para plantas como Epipremnum y evita sol directo de verano en especies sensibles.

Implicacion para Lleken:

- Normalizar `exposicion_sol` a una categoria interna:
  - `baja_media`
  - `brillante_indirecta`
  - `media_alta`
  - `sol_directo_suave`
  - `sol_directo_alto`
- Mostrar texto humano segun categoria y ventana sugerida:
  - baja/media: cerca de ventana iluminada, sin rincon oscuro.
  - brillante indirecta: este/oeste o sur filtrado.
  - sol alto: ventana norte/sur segun hemisferio y clima, evitando choque termico.

Nota para Chile/Sudamerica:

- En hemisferio sur, una ventana norte recibe mas sol directo que una ventana sur. La app debe evitar copiar recomendaciones anglosajonas de "south-facing window" sin adaptarlas al hemisferio.

Fuentes:

- Oklahoma State University Extension, "Houseplant Care": https://extension.okstate.edu/fact-sheets/houseplant-care
- RHS, "How to grow epipremnum": https://www.rhs.org.uk/plants/epipremnum/growing-guide

### 3. Temperatura y humedad explican muchos falsos positivos de enfermedad

OSU indica que muchas plantas de interior prosperan cerca de 18 a 24 C y que la humedad domestica suele ser baja para varias especies. RHS describe rangos mas tropicales de 18 a 27 C o 18 a 30 C para varias plantas de interior.

Implicacion para Lleken:

- Agregar en el plan una sensibilidad ambiental:
  - `humedad_objetivo`: baja, media, alta.
  - `temp_min_segura_c`, `temp_max_confort_c`.
  - `sensibilidad_corrientes`: baja, media, alta.
- Si clima local marca frio extremo, calor alto o baja humedad estimada, convertirlo en alerta.
- Para plantas tropicales, proponer humidificador o bandeja con piedras y agua sin que la base de la maceta toque el agua.
- Para suculentas/aloe/cactus, evitar misting como consejo general.

Fuentes:

- Oklahoma State University Extension, "Houseplant Care": https://extension.okstate.edu/fact-sheets/houseplant-care
- RHS, perfiles de plantas de alta humedad: https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-humidity
- RHS, perfiles de plantas de alta luz: https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-sunlight

### 4. Fertilizacion debe depender de crecimiento activo

OSU recomienda fertilizar menos o nada en invierno, habitaciones con poca luz o mezclas con suelo. RHS usa el mismo patron de alimentar durante temporada de crecimiento y reducir en frio/descanso.

Implicacion para Lleken:

- No crear tarea fija de fertilizacion todo el anio.
- Usar `hemisferio` o latitud para inferir temporada:
  - Chile: crecimiento principal aprox. septiembre a marzo/abril.
  - Hemisferio norte: marzo/abril a septiembre/octubre.
- Si `luz` es baja o temperatura es baja, posponer fertilizacion.
- Agregar alerta de exceso: puntas marrones + historial de fertilizacion reciente = posible sales/fertilizante.

Fuente base: Oklahoma State University Extension, "Houseplant Care": https://extension.okstate.edu/fact-sheets/houseplant-care

### 5. Diagnostico por foto debe hablar en probabilidades

University of Alaska Fairbanks Cooperative Extension advierte que sintomas como puntas marrones, hojas amarillas o marchitez pueden tener varias causas. Por ejemplo, marchitez puede venir de falta de agua, exceso de agua, raices enfermas o insectos chupadores.

Implicacion para Lleken:

- El analisis de seguimiento no debe afirmar una causa unica sin contexto.
- La IA deberia devolver:
  - `sintomas_observados`
  - `causas_probables`
  - `preguntas_de_confirmacion`
  - `accion_segura_inmediata`
  - `riesgo`
- La UI debe pedir confirmacion: "el sustrato esta humedo?", "hay agua acumulada?", "ves puntos/web/coton blanco?".

Fuente base: UAF Cooperative Extension, "Houseplant Pests and Control": https://www.uaf.edu/ces/publications/database/insects-pests/houseplant-pests.php

### 6. Plagas: inspeccion e aislamiento primero

University of Minnesota Extension recomienda examinar plantas regularmente, aislar plantas con plagas, revisar envases y undersides de hojas, y usar metodos no quimicos en infestaciones leves. UMD mantiene paginas actualizadas sobre pulgones, trips, acaros, cochinillas, mosca blanca, escamas y fungus gnats.

Implicacion para Lleken:

- Agregar tarea recurrente "revisar plagas" cada 7 a 14 dias.
- Si se detecta plaga por foto o checklist, sugerir:
  - aislar planta.
  - limpiar hojas.
  - revisar envase, tallos y envés.
  - evitar pesticidas sin identificacion.
- Crear campos de historial: `plaga_detectada`, `tratamiento`, `aislamiento`, `revision_post_tratamiento`.

Fuentes:

- University of Minnesota Extension, "Managing insects on indoor plants": https://extension.umn.edu/product-and-houseplant-pests/insects-indoor-plants
- University of Maryland Extension, "Indoor Plant Insects": https://extension.umd.edu/resources/yard-garden/indoor-plants/indoor-plant-insects
- UAF Cooperative Extension, "Houseplant Pests and Control": https://www.uaf.edu/ces/publications/database/insects-pests/houseplant-pests.php

## Arquetipos de cuidado para usar en la app

Estos arquetipos permiten que Gemini entregue un plan mas estable. Si identifica una especie, el backend deberia mapearla a un arquetipo antes de guardar.

| Arquetipo | Ejemplos | Riego base | Luz | Humedad | Alertas clave |
| --- | --- | --- | --- | --- | --- |
| `suculenta_cactus` | Aloe, jade, cactus, opuntia | 10-21 dias; solo con sustrato seco | alta, brillante; algunas toleran sol | baja/media | no misting, no encharcar, reducir en invierno |
| `aroide_tropical` | Monstera, pothos, philodendron, syngonium | 5-10 dias; top 2-5 cm seco | brillante indirecta | media/alta | pudricion por exceso, toxicidad mascotas, soporte para trepadoras |
| `alta_humedad` | helechos, calathea, anthurium, alocasia | 3-7 dias; humedad pareja | indirecta filtrada | alta | puntas marrones por aire seco, evitar sol directo |
| `baja_luz_resistente` | sansevieria, zamioculcas, pothos verde, aspidistra | 10-21 dias segun especie | baja/media, no oscuridad total | baja/media | el crecimiento lento reduce necesidad de riego/fertilizante |
| `floracion_interior` | violeta africana, begonia rex, kalanchoe, orquideas | variable; evitar extremos | media/alta filtrada | media/alta | no mojar hojas sensibles, fertilizar solo en crecimiento |
| `comestible_aromatica` | albahaca, menta, cilantro, romero | 2-7 dias segun sol/maceta | alta | media | cosecha, sol real, exterior/interior, ciclo corto |

## Reglas de ajuste por clima y contexto

Estas reglas pueden aplicarse despues de que Gemini genere un plan, para que la app sea consistente.

| Condicion | Ajuste sugerido |
| --- | --- |
| `temp_max >= 30 C` y planta no suculenta | revisar humedad 1-2 dias antes de lo normal; alertar por sol de tarde |
| `temp_max >= 32 C` y sol directo | sugerir mover a luz filtrada en horas fuertes si la especie no es de sol alto |
| `temp_min <= 10 C` | reducir riego; proteger de corrientes/frio; no fertilizar |
| lluvia > 5 mm y planta exterior/balcon | retrasar riego y revisar drenaje |
| humedad ambiental baja + arquetipo alta_humedad | sugerir humidificador/bandeja de piedras; revisar puntas marrones |
| planta en baja luz | alargar intervalo de riego y suspender fertilizacion |
| maceta sin drenaje | reducir volumen/frecuencia; mostrar advertencia persistente |
| foto con hojas amarillas + sustrato humedo | sospechar exceso de riego/pudricion; pedir revisar raices/drenaje |
| foto con hojas caidas + sustrato seco | sospechar falta de agua; sugerir riego profundo si especie lo tolera |
| sticky leaves / residuo negro | revisar pulgones, cochinilla, escamas o mosca blanca |
| web fina + hojas punteadas | revisar acaros/arana roja, especialmente con calor y baja humedad |
| mosquitos pequenos alrededor del sustrato | sospechar fungus gnats; revisar exceso de humedad |

## Semilla de datos por plantas comunes

Esta tabla no reemplaza identificacion botanica; sirve para defaults razonables cuando la IA reconoce una especie comun.

| Nombre comun | Cientifico probable | Arquetipo | Riego | Luz | Humedad/temp | Riesgos |
| --- | --- | --- | --- | --- | --- | --- |
| Pothos / potus | Epipremnum aureum | aroide_tropical / baja_luz_resistente | regar cuando el compost se aproxime a seco; evitar agua estancada | brillante indirecta; tolera algo de sombra | 18-30 C | pierde variegacion con poca luz; toxica si se ingiere |
| Monstera | Monstera deliciosa | aroide_tropical | top 2-5 cm seco; no encharcar | brillante indirecta | alta humedad ideal, 18-27 C aprox. | cochinilla/escama; toxica si se ingiere |
| Aloe vera | Aloe vera | suculenta_cactus | profundo e infrecuente; dejar secar por completo | brillante indirecta o sol suave | 13-27 C; humedad normal/baja | pudricion por exceso; no misting; toxica si se ingiere |
| Jade | Crassula ovata | suculenta_cactus | dejar secar bien | media/alta, sol suave | baja/media | pudricion por exceso |
| Sansevieria | Dracaena trifasciata | baja_luz_resistente / suculenta | 14-30 dias segun luz; secar bien | baja/media a brillante indirecta | tolerante | exceso de agua en baja luz |
| ZZ | Zamioculcas zamiifolia | baja_luz_resistente | 14-30 dias; secar entre riegos | baja/media | normal interior | pudricion por exceso |
| Helecho nido de ave | Asplenium spp. | alta_humedad | mantener humedad pareja, sin agua en corona | indirecta brillante | humedad 60%+; 18-27 C | pudricion en centro si se moja corona |
| Calathea / stromanthe | Calathea/Stromanthe spp. | alta_humedad | humedad pareja, no encharcar | indirecta filtrada | humedad 60%+ | puntas marrones por aire seco/agua dura |
| Anturio | Anthurium spp. | alta_humedad | top pocos cm seco; drenaje | brillante indirecta | humedad alta, 18-27 C | hongos si hojas quedan mojadas |
| Alocasia | Alocasia spp. | alta_humedad | mantener algo humedo; drenaje estricto | brillante indirecta | humedad 60-80%; 18-27 C | arana roja, pudricion |
| Ficus elastica | Ficus elastica | media_alta | dejar secar parcialmente | brillante indirecta/alta | normal interior | estres por cambios, escamas |
| Albahaca | Ocimum basilicum | comestible_aromatica | frecuente en maceta, sin encharcar | sol alto | calor moderado | ciclo corto, espigado/floracion cambia sabor |

## Datos sugeridos para el modelo

`CarePlan` podria crecer sin romper lo actual agregando campos opcionales:

```ts
export interface CarePlan {
  riego_frecuencia_dias?: number;
  instrucciones?: string;
  alertas_clima?: string[];
  riego_ajuste_clima?: string;
  exposicion_sol?: string;
  seguimiento_foto_dias?: number;
  tareas_adicionales?: string[];

  // Nuevos campos sugeridos
  arquetipo_cuidado?: 'suculenta_cactus' | 'aroide_tropical' | 'alta_humedad' | 'baja_luz_resistente' | 'floracion_interior' | 'comestible_aromatica';
  regla_humedad_sustrato?: 'top_2cm_seco' | 'top_5cm_seco' | 'secar_completo' | 'humedad_pareja';
  luz_categoria?: 'baja_media' | 'brillante_indirecta' | 'media_alta' | 'sol_directo_suave' | 'sol_directo_alto';
  humedad_objetivo?: 'baja' | 'media' | 'alta';
  temp_min_segura_c?: number;
  temp_max_confort_c?: number;
  drenaje_requerido?: boolean;
  fertilizacion_temporada?: 'crecimiento_activo' | 'minima' | 'no_recomendada';
  toxicidad?: {
    humanos?: boolean;
    mascotas?: boolean;
    irritante_piel?: boolean;
  };
  senales_alerta?: string[];
}
```

`WeatherConditions` podria incluir humedad relativa si Open-Meteo la entrega:

```ts
export interface WeatherConditions {
  temp_actual?: number;
  temp_max?: number;
  temp_min?: number;
  lluvia?: number;
  humedad_relativa?: number;
}
```

`historial_acciones` podria normalizar `tipo`:

```ts
type PlantActionType =
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
```

## Cambios sugeridos para prompts de IA

### Identificacion por foto

Pedir a Gemini que no solo identifique especie, sino tambien arquetipo:

```text
Ademas de identificar la planta, clasificala en un arquetipo de cuidado:
suculenta_cactus, aroide_tropical, alta_humedad, baja_luz_resistente,
floracion_interior o comestible_aromatica.

Si no tienes confianza alta en la especie, devuelve confianza_especie baja/media,
pero conserva un arquetipo prudente basado en la morfologia.
```

### Plan de cuidados

El plan deberia exigir reglas verificables:

```text
No bases el riego solo en dias. Devuelve una frecuencia estimada y una regla
de humedad del sustrato observable por el usuario. Ajusta por temperatura,
lluvia, luz y estacion. Si falta informacion de maceta o drenaje, asume riesgo
conservador de exceso de agua.
```

### Seguimiento por foto

El analisis deberia evitar diagnostico absoluto:

```text
Devuelve sintomas observados, causas probables ordenadas por probabilidad,
preguntas para confirmar y una accion segura inmediata. Si hojas amarillas,
marchitez o puntas marrones pueden deberse a varias causas, dilo explicitamente.
No recomiendes pesticidas sin senal clara de plaga.
```

## UX recomendada

- En ficha de planta, cambiar "Estado suelo: humedo/seco" por "Estimacion" y pedir confirmacion manual.
- Agregar check-in rapido:
  - sustrato seco arriba
  - sustrato humedo
  - agua acumulada
  - hojas amarillas
  - hojas caidas
  - puntos/web/manchas
  - residuo pegajoso
- En calendario, separar:
  - revisar humedad
  - regar
  - subir foto
  - revisar plagas
  - fertilizar
- En plantas nuevas, preguntar:
  - interior/exterior/balcon
  - maceta con drenaje
  - tamano aproximado de maceta
  - luz donde vivira
- En alertas, explicar el "por que":
  - "Hace frio: el sustrato seca mas lento, espera a confirmar humedad antes de regar."
  - "Alta temperatura: revisa humedad antes de lo habitual, pero evita encharcar."
  - "Baja luz: reduce riego y fertilizacion."

## Fuentes consultadas

- Oklahoma State University Extension. "Houseplant Care." https://extension.okstate.edu/fact-sheets/houseplant-care
- University of Minnesota Extension. "Managing insects on indoor plants." https://extension.umn.edu/product-and-houseplant-pests/insects-indoor-plants
- University of Maryland Extension. "Indoor Plant Insects." https://extension.umd.edu/resources/yard-garden/indoor-plants/indoor-plant-insects
- University of Alaska Fairbanks Cooperative Extension. "Houseplant Pests and Control." https://www.uaf.edu/ces/publications/database/insects-pests/houseplant-pests.php
- Royal Horticultural Society. "How to grow epipremnum." https://www.rhs.org.uk/plants/epipremnum/growing-guide
- Royal Horticultural Society. "Care tips for light-loving houseplants." https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-sunlight
- Royal Horticultural Society. "Care tips for thirsty houseplants." https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-humidity

## Proxima implementacion sugerida

1. Extender `CarePlan` con campos opcionales de arquetipo, regla de sustrato, luz, humedad, temperatura, drenaje, fertilizacion y toxicidad.
2. Actualizar prompts de `server/index.ts` para generar esos campos.
3. Normalizar esos campos en `src/lib/aiSchema.ts` con defaults conservadores.
4. Ajustar `Calendar.tsx` para crear tareas de revision de humedad y plagas ademas de riego/foto.
5. Ajustar `PlantProfile.tsx` para mostrar la regla de humedad y alertas explicadas por clima/contexto.
