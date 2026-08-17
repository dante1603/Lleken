# Piloto con datos reales PAC

Fecha: 2026-05-04

## Contexto

El lunes 2026-05-04 empieza una nueva etapa de testing con datos reales del huerto PAC.

Datos iniciales:

- Cuenta principal: primer usuario del proyecto.
- Primer cuidador: cuenta del amigo que participa en el piloto.
- Primer caso botanico real: propagacion de matico para Dante.
- Estrategia inicial: operacion manual por detras de la primera cuenta, con mejoras de front a medida que aparezcan escenarios reales.
- Primer deploy funcional: Vercel + Supabase + Gemini, validado con creacion de planta nueva.

## Principio de trabajo

La primera fase no busca automatizar todo.

El objetivo es capturar evidencia real, ordenar datos y mejorar el producto con casos concretos:

- fotos reales;
- especie identificada;
- contexto del lugar;
- accion recomendada;
- accion tomada;
- resultado posterior;
- ajuste necesario en UI, copy, datos o algoritmo.

## Flujo manual recomendado

1. Crear o actualizar la planta desde la cuenta principal.
2. Registrar quien cuida o reporta la observacion.
3. Guardar foto inicial y contexto.
4. Generar plan con IA/catalogo.
5. Revisar manualmente el plan antes de usarlo como verdad.
6. Registrar acciones concretas como eventos: riego, cambio de ubicacion, recorte, cambio de agua, nota.
7. Hacer seguimiento con foto en pocos dias.
8. Comparar prediccion inicial contra resultado real.

## Datos que conviene empezar a capturar

- `source_context`: PAC, casa, interior, balcon, exterior, propagacion.
- `reporter`: usuario que tomo la foto o entrego el dato.
- `confidence`: confianza de identificacion y plan.
- `manual_review_status`: pendiente, revisado, corregido.
- `recommended_action`: accion sugerida.
- `actual_action`: accion tomada por la persona.
- `outcome`: mejoro, igual, empeoro, desconocido.
- `follow_up_due_at`: fecha sugerida de revision.

Estas claves pueden vivir al inicio en notas/eventos. Mas adelante deben mapearse a `ai_analyses`, `diagnoses`, `recommendations` y `recommendation_outcomes`.

## Primeras mejoras de producto esperadas

- Vista de "caso real" dentro de la ficha o historial.
- Eventos mas visibles que expliquen que paso entre foto inicial y seguimiento.
- Estado de recomendacion: sugerida, aplicada, descartada, resultado observado.
- Indicador honesto de incertidumbre.
- Mejor soporte para propagacion, esquejes y plantas que aun no estan en maceta final.

## Checkpoint real 2026-05-04

El usuario confirmo que pudo incluir una planta nueva en la app desplegada.

Esto valida para el piloto:

- Auth Google en produccion.
- Supabase como persistencia.
- Storage de imagenes.
- Funciones Vercel.
- Llamadas IA a Gemini.
- Flujo base foto -> IA -> ubicacion/clima -> plan -> guardado.

El trabajo con datos reales debe seguir manual y ordenado:

- usar la cuenta principal para cargar datos iniciales;
- registrar el primer cuidador como actor del piloto;
- cargar fotos PAC como casos concretos;
- usar el caso matico para probar propagacion y seguimiento corto;
- mejorar front solo cuando una friccion aparezca en uso real.

## Checkpoint produccion 2026-08-17 — datos reales -> correcciones

Se cruzo un snapshot read-only de Supabase de produccion contra `main`. En ese corte existian 14 plantas, 50 eventos, 16 registros ambientales, 21 entradas de especie y 15 medios; `ai_analyses`, `diagnoses` y `recommendations` seguian sin filas.

Este checkpoint valida la estrategia del piloto: los datos reales ya permiten detectar fallos de dominio que no eran evidentes solo leyendo el diseño.

### Caso 1 — recomendacion de riego contradictoria

Una Echeveria creada con clima frio, lluvia y humedad alta recibio un plan que advertia riesgo de pudricion y recomendaba evitar riego. Segundos despues, una observacion `dry` bajo la regla `secar_completo` produjo una recomendacion `water` / "Puedes regar".

Causa tecnica confirmada: `evaluateMoistureDecision()` decide desde humedad + regla y CARE-01B habia excluido deliberadamente clima/contexto de la decision final. La evidencia real demuestra que hace falta una capa pequena de guardas activas con procedencia y frescura antes de emitir una recomendacion de riego contradictoria.

Accion: `CARE-02 — Coherencia de riego con guardas activas`, P0 candidato antes de QA/FREEZE. Mantener la observacion directa como evidencia primaria; no convertir weather exterior en oraculo.

### Caso 2 — contaminacion de arquetipos de especie

Produccion contiene especies distintas enlazadas a `aroide_tropical`, incluyendo `Moringa oleifera`, `Lapageria rosea`, `Portulaca oleracea` y `Yucca elephantipes`.

El patron coincide con tres puntos del codigo:

- `normalizeCarePlan()` usa `aroide_tropical` como fallback;
- el prompt del plan usa ese valor como ejemplo concreto;
- `ensureSpeciesCatalogEntry()` puede persistir el arquetipo derivado del plan de una instancia al crear/enlazar la especie.

Ademas, instancias de la misma `Echeveria 'Perle von Nürnberg'` muestran variacion en campos estructurales como temperatura minima, frecuencia de riego y luz.

Accion: absorber como evidencia/regresiones de `SPEC-KB-01A`. `unknown` debe sobrevivir; confirmar taxonomia no debe confirmar cuidado; un `SpeciesCareBaseline` versionado debe convertirse en la fuente estructural estable del motor. No duplicar el trabajo ya integrado de SPECIES-TRUTH sobre precedencia/procedencia del reader.

### Caso 3 — salud legacy no representa evidencia actual

El schema fisico aun obliga `health_state = saludable` y `health_score = 75`. El dominio moderno ya trata esas columnas como legacy, pero produccion demuestra la divergencia: un Evonimo con propuesta IA `35/necesita_atencion` quedo almacenado como `75/saludable`; Echeverias evaluadas en 90/95 almacenan igualmente 75.

Accion: deuda P1 de datos. Preparar migracion no destructiva para permitir `NULL`/retirar defaults cuando consumidores esten listos. No reinterpretar valores historicos 5-9 ni convertir assessments IA en estado factual para rellenar la tabla.

### Caso 4 — foto no evaluable correctamente rechazada, score incorrecto

En seguimiento de una Yuca se subio una imagen que no mostraba la planta objetivo. La IA detecto correctamente el mismatch y rechazo diagnosticar la Yuca, comportamiento que debe conservarse. Sin embargo devolvio `puntuacion_salud = 0`; ese valor puede significar erroneamente salud pesima cuando en realidad el assessment era no evaluable.

Accion: deuda P1. Introducir validez explicita del assessment (`target_visible`/`target_match` o equivalente) y normalizar health/state/risk a unknown cuando el objetivo no pueda evaluarse. Convertir el caso real en test de regresion.

### Caso 5 — contexto confirmado e inferido

Casos recientes conservan correctamente contexto confirmado e inferido como fuentes separadas, incluso cuando difieren (`balcon` confirmado frente a `interior` inferido). Esto no debe "limpiarse" borrando la inferencia: la frontera de procedencia es correcta.

Accion: cuando un consumidor necesite un contexto activo, resolver por campo con precedencia explicita (`user_confirmed > observed/external pertinente > ai_inferred > unknown`). Lo inferido puede servir como provisional, pero nunca debe sobreescribir una confirmacion.

### Lo que no se convierte todavia en tarea

Aunque `plant_events` ya contiene observaciones y recomendaciones reales, las tablas `ai_analyses`, `diagnoses`, `recommendations` y outcomes aun no participan del flujo. No activarlas por arquitectura aspiracional. Primero debe existir un consumidor claro: trazabilidad de modelo/prompt/schema, lifecycle real de recomendaciones o aprendizaje por outcomes.

### Regla de continuidad

Cada nuevo incidente relevante del piloto debe intentar cerrar este ciclo:

`caso real -> evidencia persistida -> causa de codigo -> regresion -> correccion focalizada -> validacion -> retorno documental`

El propietario operativo de estos hallazgos es Notion (`NEXT-OBS-01`, `CARE-02`, `SPEC-KB-01A`); este documento conserva la evidencia durable y el por que de las correcciones.

## Doble check documental 2026-08-17 — precisiones que gobiernan los casos anteriores

Este bloque corrige cualquier lectura demasiado fuerte de los casos 1–4 sin borrar el registro original.

### Regla de humedad: valor presente no equivale a conocimiento

`MoistureObservation` conserva `soilRuleUsed`, pero no la procedencia de esa regla. A la vez, `normalizeCarePlan()` puede sintetizar `regla_humedad_sustrato` desde defaults. Por tanto, la condicion actual `soilRuleUsed !== undefined` puede tratar un valor imputado como una regla conocida.

CARE-02 debe distinguir al menos regla explicita/defendible frente a `default_imputed | unknown`. Una regla imputada o de procedencia desconocida no puede producir silenciosamente `dry -> water`; debe degradarse a conocimiento insuficiente. Esto es un boundary minimo de seguridad, no obliga a implementar SPEC-KB-01A completo.

### Arquetipo aroide: separar causa confirmada de hipotesis causal

`normalizeCarePlan()` usa `aroide_tropical` como arquetipo conservador interno para rellenar campos derivados (`regla_humedad_sustrato`, `luz_categoria`, `humedad_objetivo`) cuando falta un arquetipo valido, pero devuelve `arquetipo_cuidado` como `undefined` si el modelo no entrego uno valido. Por eso ese fallback **no explica por si solo** que `species_catalog.care_archetype_id` termine en aroide.

La cadena compatible con el codigo es: el prompt muestra literalmente `"arquetipo_cuidado": "aroide_tropical"` -> Gemini puede devolverlo explicitamente -> el normalizador lo conserva -> `ensureSpeciesCatalogEntry()` lo resuelve y persiste. El anclaje del prompt es una hipotesis plausible respaldada por codigo + estado observado, no una causalidad demostrada sin respuesta cruda del modelo o trazabilidad equivalente.

### Assessment no evaluable: problema de contrato, no de score 0

`VisualAssessment`/`FollowUpAssessment` no modelan si la imagen contiene o permite evaluar la planta objetivo; `normalizeFollowUpResult()` acepta cualquier score 0-100. La solucion correcta es introducir `target_visible`/`target_match`/`evaluable` o equivalente y hacer que un assessment no evaluable fuerce health/state/risk a unknown.

No prohibir `0` globalmente: un score 0 puede ser valido si el target fue realmente evaluable. La regresion debe incluir tanto Yuca->foto incorrecta como un caso control con target correcto y score muy bajo.

### Salud legacy: secuencia de migracion

La migracion de `health_state/health_score` es P1 `DATA/ENG`, no parte de CARE-02. Antes de tocar schema se debe buscar cualquier reader/writer que aun dependa de esos defaults; despues permitir NULL/eliminar defaults sin backfill interpretativo y probar plantas legacy + nuevas. Los valores historicos permanecen como storage legacy, no se reinterpretan como evidencia.
