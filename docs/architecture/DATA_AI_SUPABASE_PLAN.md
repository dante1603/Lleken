# Arquitectura de datos e ingesta IA - plan Supabase

Fecha: 2026-05-01
Estado: propuesta refinada, lista para convertir en spike/migracion

## 1. Resumen ejecutivo

La propuesta conversada con otra IA va en la direccion correcta: separar espacios fisicos, plantas, eventos, imagenes, inferencias IA, clima y una capa aplanada para recomendacion futura.

Pero hay que refinar tres puntos antes de actualizar la base:

1. La IA no debe guardarse como "verdad absoluta". Debe guardarse como inferencia versionada, con confianza, evidencia, inputs y posibilidad de correccion humana.
2. El modelo debe cubrir el producto actual de Lleken, no solo el futuro: hoy ya existen planta, foto inicial, clima, plan, seguimiento por foto, calendario, cuidadores preparados y catalogo botanico estatico/dinamico.
3. La tabla aplanada para recomendacion debe ser una vista/materializacion derivada, no la fuente principal. La fuente de verdad deben ser eventos, diagnosticos, contexto ambiental y resultados observados.

Conclusion: Supabase/Postgres calza mejor que Firestore para el destino final, pero conviene migrar por etapas: primero esquema minimo compatible con el flujo actual; luego gardens, observations, diagnoses y vectores.

## 2. Comparacion con el estado actual

### Hoy en el repo

Stack operativo actual:

- Auth: Firebase Auth.
- Base: Firestore nombrado.
- Storage: Firebase Storage.
- IA: Gemini en backend Express (`server/index.ts`).
- Normalizacion: `src/lib/aiSchema.ts`.
- Persistencia: `src/lib/plants.ts`.

Colecciones reales actuales:

- `users/{uid}`
- `plants/{plantId}`

El documento `Plant` guarda casi todo:

- owner/cuidadores: `ownerId`, `caregiverIds`, `memberIds`, `userId` legacy.
- foto: `fotoUrl`, `fotoPath`.
- especie: `nombre_comun`, `nombre_cientifico`, `species_key`, `knowledge_source`.
- salud: `estado`, `puntuacion_salud`.
- ubicacion/clima: `ciudad`, `lat`, `lon`, `clima_actual`.
- cuidado: `plan_cuidados`.
- contexto IA/usuario: `contexto_inferido`, `contexto`.
- historial: `historial_acciones` como array acotado.

### Lo que la propuesta nueva mejora

- Introduce `gardens`, necesario para huertos comunitarios y PAC.
- Separa fotos crudas de inferencias IA.
- Agrega contexto ambiental por evento, no solo por planta.
- Empieza a pensar en dataset de recomendacion, no solo CRUD.

### Lo que le falta a la propuesta nueva

- Usuarios/perfiles y roles quedan subdefinidos.
- Falta distinguir `garden_members` de permisos por planta.
- Falta modelar `observations` como evento unificado. "Stories" es buen lenguaje UX, pero a nivel datos conviene que la unidad sea evento/observacion.
- Falta separar diagnostico IA de analisis visual puro.
- Falta versionar prompts/modelos/esquemas.
- Falta guardar `confidence`, `uncertainty`, evidencia y preguntas de confirmacion.
- Falta feedback humano: si la persona confirma que la recomendacion funciono o fallo, ese es el dato que realmente entrena el sistema.
- Falta catalogo botanico (`species_catalog`, `care_archetypes`) que ya existe parcialmente en codigo.

## 3. Principio refinado: IA como inferencia, no como verdad absoluta

Usar Gemini como motor generalista es correcto para el arranque. Lo que no conviene es tratar cada salida como ground truth.

Regla recomendada:

- La foto y el comentario del usuario son evidencia cruda.
- La IA produce una inferencia.
- El backend valida estructura y rangos.
- El usuario o el resultado futuro puede confirmar, corregir o refutar.
- El motor predictivo aprende de la combinacion: recomendacion emitida + accion tomada + estado posterior.

Esto deja al sistema listo para aprender sin contaminar la base con certezas falsas.

## 4. Modelo Supabase recomendado

### A. Identidad y permisos

`profiles`

- `id uuid primary key references auth.users(id)`
- `display_name text`
- `email text`
- `avatar_url text`
- `plan text`
- `owned_plant_limit int`
- `created_at timestamptz`
- `updated_at timestamptz`

`gardens`

- `id uuid primary key`
- `owner_id uuid references profiles(id)`
- `name text`
- `description text`
- `environment_type text` -- `interior`, `balcon`, `exterior`, `invernadero`, `huerto_comunitario`
- `city text`
- `lat double precision`
- `lon double precision`
- `location_context jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

`garden_members`

- `garden_id uuid references gardens(id)`
- `user_id uuid references profiles(id)`
- `role text` -- `owner`, `caregiver`, `viewer`
- `created_at timestamptz`
- primary key (`garden_id`, `user_id`)

### B. Catalogos botanicos

`species_catalog`

- `id uuid primary key`
- `species_key text unique`
- `scientific_name text`
- `common_names text[]`
- `family text`
- `care_archetype_id uuid references care_archetypes(id)`
- `knowledge_source text` -- `static_catalog`, `ai_generated`, `reviewed`
- `confidence text`
- `source_payload jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

`care_archetypes`

- `id uuid primary key`
- `key text unique`
- `name text`
- `soil_moisture_rule text`
- `light_category text`
- `target_humidity text`
- `temp_min_safe_c int`
- `temp_max_comfort_c int`
- `drainage_required boolean`
- `fertilization_season text`
- `warning_signs text[]`
- `typical_failures jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### C. Entidad principal

`plants`

- `id uuid primary key`
- `owner_id uuid references profiles(id)`
- `garden_id uuid references gardens(id) null`
- `species_id uuid references species_catalog(id) null`
- `nickname text`
- `suggested_name text`
- `status text` -- `active`, `in_treatment`, `lost`
- `health_state text` -- `saludable`, `necesita_atencion`, `en_riesgo`
- `health_score int` -- 0-100
- `confirmed_context jsonb`
- `current_care_plan jsonb`
- `last_watered_at timestamptz`
- `last_observed_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

`plant_members`

- opcional para plantas fuera de garden.
- permite compartir una planta individual sin crear un garden.

Campos:

- `plant_id uuid references plants(id)`
- `user_id uuid references profiles(id)`
- `role text` -- `owner`, `caregiver`, `viewer`
- primary key (`plant_id`, `user_id`)

### D. Eventos, historias e imagenes

`plant_events`

Equivale al concepto UX de "Story", pero con nombre tecnico mas amplio.

- `id uuid primary key`
- `plant_id uuid references plants(id)`
- `garden_id uuid references gardens(id) null`
- `created_by uuid references profiles(id)`
- `event_type text` -- `creation`, `watering`, `photo`, `note`, `fertilization`, `pruning`, `transplant`, `pest_treatment`, `harvest`
- `user_comment text`
- `event_at timestamptz`
- `created_at timestamptz`
- `metadata jsonb`

`plant_media`

- `id uuid primary key`
- `event_id uuid references plant_events(id)`
- `plant_id uuid references plants(id)`
- `created_by uuid references profiles(id)`
- `bucket text`
- `storage_path text`
- `public_url text null`
- `mime_type text`
- `size_bytes int`
- `width int null`
- `height int null`
- `capture_context jsonb`
- `created_at timestamptz`

### E. IA y ambiente

`environmental_logs`

- `id uuid primary key`
- `event_id uuid references plant_events(id)`
- `garden_id uuid references gardens(id) null`
- `plant_id uuid references plants(id)`
- `lat double precision`
- `lon double precision`
- `environment_type text`
- `weather_condition jsonb`
- `theoretical_solar_radiation double precision null`
- `weather_source text`
- `logged_at timestamptz`
- `created_at timestamptz`

`ai_analyses`

Tabla general para todas las salidas de IA. Evita crear una tabla distinta por cada prompt.

- `id uuid primary key`
- `event_id uuid references plant_events(id)`
- `media_id uuid references plant_media(id) null`
- `plant_id uuid references plants(id)`
- `analysis_type text` -- `initial_identification`, `follow_up`, `refresh`, `diagnosis`, `care_plan`
- `model_provider text` -- `google`
- `model_name text` -- ejemplo `gemini-2.5-flash`
- `prompt_version text`
- `schema_version text`
- `input_context jsonb`
- `raw_output jsonb`
- `validated_output jsonb`
- `confidence numeric null`
- `status text` -- `valid`, `fallback`, `needs_review`, `failed`
- `error text null`
- `created_at timestamptz`

`diagnoses`

Vista estructurada del diagnostico que la app puede mostrar y comparar en el tiempo.

- `id uuid primary key`
- `plant_id uuid references plants(id)`
- `event_id uuid references plant_events(id)`
- `ai_analysis_id uuid references ai_analyses(id)`
- `health_score int`
- `health_state text`
- `visible_parts text[]` -- hoja, tallo, flor, sustrato, planta_completa
- `symptoms_observed text[]`
- `probable_causes jsonb` -- [{cause, probability, evidence}]
- `questions_to_confirm text[]`
- `safe_immediate_action text`
- `risk text` -- `low`, `medium`, `high`, `critical`
- `uncertainty_notes text`
- `created_at timestamptz`

### F. Feedback y aprendizaje

`recommendations`

- `id uuid primary key`
- `plant_id uuid references plants(id)`
- `diagnosis_id uuid references diagnoses(id) null`
- `event_id uuid references plant_events(id) null`
- `recommendation_type text` -- `watering`, `light`, `pest`, `fertilization`, `substrate`, `follow_up_photo`
- `message text`
- `reasoning jsonb`
- `status text` -- `suggested`, `accepted`, `ignored`, `completed`, `expired`
- `created_at timestamptz`
- `due_at timestamptz null`

`recommendation_outcomes`

- `id uuid primary key`
- `recommendation_id uuid references recommendations(id)`
- `plant_id uuid references plants(id)`
- `outcome_type text` -- `improved`, `stable`, `worse`, `unknown`
- `observed_event_id uuid references plant_events(id) null`
- `observed_diagnosis_id uuid references diagnoses(id) null`
- `user_feedback text null`
- `measured_delta jsonb`
- `created_at timestamptz`

## 5. Capa de vectores para recomendacion

No crear `plant_state_vectors` como fuente editable. Debe ser derivada.

Opcion inicial:

- crear una vista SQL `plant_state_vectors_v1`.
- incluir solo datos necesarios para analisis/recomendacion.
- no exponerla directamente al cliente.

Campos sugeridos:

- `plant_id`
- `event_id`
- `species_key`
- `care_archetype_key`
- `garden_environment_type`
- `weather_condition`
- `theoretical_solar_radiation`
- `health_score`
- `health_state`
- `symptoms_observed`
- `probable_causes`
- `last_recommendation_type`
- `last_recommendation_status`
- `outcome_type`
- `days_since_last_watering`
- `days_since_last_photo`

Cuando haya mas datos, se puede materializar:

- `plant_state_vectors`
- `recommendation_training_examples`
- `embedding` si se incorpora pgvector

Pero eso no corresponde al primer paso.

## 6. JSON Schema IA recomendado

### Identificacion inicial

```json
{
  "schema_version": "plant_identification_v2",
  "species": {
    "common_name": "Monstera",
    "scientific_name": "Monstera deliciosa",
    "family": "Araceae",
    "confidence": 0.82
  },
  "suggested_name": "Monsti",
  "health": {
    "state": "saludable",
    "score": 85,
    "visible_parts": ["planta_completa", "hoja"],
    "symptoms_observed": [],
    "anomaly_detected": false,
    "anomaly_type": null
  },
  "inferred_context": {
    "environment_type": "interior",
    "pot_has_drainage": null,
    "pot_size": "mediana",
    "light_user_category": "brillante_indirecta",
    "estimated_lux_level": null,
    "confidence": 0.55
  },
  "uncertainty_notes": ["No se ve el drenaje de la maceta."]
}
```

### Seguimiento / diagnostico

```json
{
  "schema_version": "plant_diagnosis_v1",
  "health": {
    "state": "necesita_atencion",
    "score": 62,
    "visible_parts": ["hoja", "sustrato"],
    "symptoms_observed": ["hojas_caidas", "sustrato_seco"]
  },
  "probable_causes": [
    {
      "cause": "estres_hidrico",
      "probability": 0.68,
      "evidence": "Hojas caidas y sustrato visualmente seco."
    }
  ],
  "questions_to_confirm": [
    "El sustrato esta seco en los primeros 2 cm?"
  ],
  "safe_immediate_action": "Revisar humedad del sustrato antes de regar.",
  "risk": "medium",
  "confidence": 0.7,
  "uncertainty_notes": []
}
```

Validacion backend:

- Zod o validador equivalente antes de insertar.
- Guardar `raw_output` aunque falle, pero marcar `status = failed` y no actualizar planta.
- Guardar `validated_output` solo si pasa estructura y rangos.
- Versionar `prompt_version` y `schema_version`.

## 7. Plan listo para actualizar base

### Fase 0 - Decision de proveedor

Objetivo: no migrar a ciegas.

Checklist:

- confirmar proyecto Supabase de prueba;
- configurar Google Auth;
- crear bucket `plant-images`;
- probar RLS con dos usuarios;
- probar subida y lectura de imagen.

Criterio: si esto toma mas de 2 dias, Firebase sigue como puente para beta.

### Fase 1 - Esquema minimo compatible con la app actual

Tablas:

- `profiles`
- `plants`
- `plant_events`
- `plant_media`
- `ai_analyses`

Objetivo:

- reemplazar `users`, `plants`, `historial_acciones`, `fotoUrl/fotoPath` sin meter gardens todavia.
- mantener flujo actual: crear planta, subir foto, ver ficha, registrar riego, seguimiento por foto.

### Fase 2 - Seguridad y RLS

Politicas minimas:

- cada usuario lee su `profile`;
- owner lee/escribe sus plantas;
- miembros/cuidadores leen plantas compartidas;
- cuidadores pueden insertar eventos y media, pero no cambiar ownership;
- storage solo permite paths asociados al usuario/planta autorizada;
- `ai_analyses` no debe poder escribirse desde cliente publico si la IA corre en backend.

### Fase 3 - Gardens y roles reales

Tablas:

- `gardens`
- `garden_members`
- `plant_members` opcional.

Objetivo:

- soportar huertos comunitarios sin repetir cuidadores por cada planta.
- preparar piloto PAC.

### Fase 4 - Catalogos

Tablas:

- `species_catalog`
- `care_archetypes`

Objetivo:

- mover `plantKnowledge.ts` y arquetipos desde codigo a base editable.
- mantener una semilla inicial versionada.

### Fase 5 - Diagnosticos y recomendacion

Tablas/vistas:

- `diagnoses`
- `recommendations`
- `recommendation_outcomes`
- `plant_state_vectors_v1`

Objetivo:

- pasar de calendario reactivo a sistema que aprende de resultado posterior.

## 8. Orden recomendado de implementacion

1. Escribir SQL del esquema minimo Fase 1.
2. Escribir RLS minimo.
3. Crear adaptador `src/lib/data` para que la UI no dependa directo de Firebase o Supabase.
4. Migrar flujo "nueva planta" completo.
5. Migrar "seguimiento por foto".
6. Migrar calendario/riego.
7. Recien despues agregar gardens.

## 9. Decisiones abiertas antes de SQL final

1. Auth final: migrar de Firebase Auth a Supabase Auth, o mantener Firebase Auth temporalmente y usar Supabase solo como base.
2. Ambientes: un proyecto Supabase para spike y otro para beta, o el mismo con limpieza.
3. Nombres: usar tablas en ingles (`plant_events`) o espanol (`eventos_planta`). Recomiendo ingles por consistencia tecnica.
4. Imagenes: public URLs o signed URLs. Recomiendo signed/private para produccion.
5. Retencion de raw AI output: guardar todo para auditoria, pero limitar acceso por RLS y no mostrarlo en UI.
6. Feedback humano: definir una UI minima para confirmar si una recomendacion ayudo, fallo o no se siguio.

## 10. Veredicto

La arquitectura propuesta esta bien encaminada, pero la version lista para base debe ser esta:

- `Stories` pasa a `plant_events`.
- `Media` pasa a `plant_media`.
- `Vision_Analysis` se generaliza como `ai_analyses` y se especializa en `diagnoses`.
- `Environmental_Logs` queda como tabla propia.
- `Plant_State_Vectors` queda como vista derivada, no tabla primaria.
- `Gardens` se mantiene, pero con `garden_members`.
- Se agregan `profiles`, `species_catalog`, `care_archetypes`, `recommendations` y `recommendation_outcomes`.

Con eso Lleken queda preparado para el objetivo tipo Netflix/Google sin saltarse el paso mas importante: construir datos confiables a partir de evidencia, inferencias y resultados reales.
