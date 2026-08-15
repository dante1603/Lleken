# Lleken - insumos para adaptar graficos a Evaluacion Parcial 2.2

Fecha de preparacion: 2026-05-15

Objetivo: entregar informacion de alta calidad para que otra IA pueda crear graficos UML / 4+1 / arquitectura a partir del proyecto Lleken, sin inventar funcionalidades que todavia no estan implementadas.

## 1. Que pide la evaluacion

Fuente: `C:/Users/GLADIS/Downloads/RQY1102 Evaluacion Parcial_2.2_Estudiante.pdf`.

La evaluacion corresponde a RQY1102 Ingenieria de software, Evaluacion Parcial 2.2, "Modelamiento de arquitectura del Software". Tiene dos situaciones:

- Encargo: 30% dentro de esta evaluacion.
- Presentacion: 70% dentro de esta evaluacion.

Entregables del encargo:

- Diagramas en StarUML, Diagrams.net, Visio o Bizagi.
- PPT resumen con el diseno de diagramas.

Lo que la rubrica valora:

- Aplicar tecnicas de modelamiento de software con estandares UML.
- Disenar la arquitectura usando el patron 4+1, incluyendo diagramas de clase, componentes, actividad, despliegue y/o caso de uso segun aplique.
- Definir y argumentar estandares de calidad de software.
- En la presentacion, explicar cada diagrama y asociarlo con la vista 4+1 correspondiente.

Ponderaciones relevantes:

- IE2.1.1 Encargo: modelamiento UML, 6%.
- IE2.2.1 Encargo: patrones 4+1 / estilos arquitectonicos, 18%.
- IE2.3.1 Encargo: estandares de calidad, 6%.
- IE2.1.2 Presentacion: exposicion de tecnicas UML, 14%.
- IE2.2.2 Presentacion: explicacion de 4+1, 21%.
- IE2.2.3 Presentacion: explicacion de diagramas, 21%.
- IE2.3.2 Presentacion: argumentacion de calidad, 14%.

Interpretacion practica: lo mas importante no es solo tener diagramas, sino poder explicar por que cada diagrama representa una vista arquitectonica y como ayuda al desarrollo, integracion y calidad.

## 2. Resumen ejecutivo de Lleken

Lleken es una app AgriTech mobile-first para cuidado proactivo de plantas y huertos comunitarios urbanos. En su fase actual, el usuario toma o sube una foto, la IA identifica la planta, la app cruza especie con ubicacion y clima real, genera un plan de cuidado, guarda la planta y muestra calendario, historial y seguimiento por foto.

Stack actual:

- Frontend: React 19 + TypeScript + Vite.
- UI: Tailwind CSS v4, Motion, Lucide React, Radix UI.
- Auth: Supabase Auth con Google.
- Base de datos: Supabase Postgres.
- Storage: Supabase Storage privado, bucket `plant-images`.
- Backend local: Express + tsx, proxyado desde Vite en `/api/*`.
- IA: Google Gemini 2.5 Flash desde backend.
- Clima/geocoding: Open-Meteo.
- Tests: Vitest.

Estado funcional defendible:

- Login con Google y perfil en Supabase.
- Flujo completo: foto -> identificacion IA -> ubicacion -> plan -> ficha.
- Fotos guardadas en Storage privado, con Postgres guardando path y metadata.
- Historial de acciones: riego, seguimiento y notas.
- Seguimiento por foto con analisis IA.
- Refresh de planta desde foto nueva con vista previa.
- Calendario de tareas derivadas del plan, ajustadas por clima.
- Limite de plan gratis de 3 plantas propias.
- Tests unitarios de logica IA y dominio.

No presentar como terminado:

- UI completa de cuidadores / plantas compartidas.
- UI completa de jardines.
- Persistencia completa de salidas IA en `ai_analyses`.
- Diagnosticos y recomendaciones como flujo visible completo.
- Tabla `tester_feedback`, aun propuesta para beta.

## 3. Vistas 4+1 recomendadas

### Vista de casos de uso

Objetivo del grafico: mostrar actores y funcionalidades visibles.

Actores:

- Visitante: entra a login.
- Usuario autenticado: ve Home, Mis plantas, Calendario, Perfil.
- Dueno de planta: crea planta, ve ficha, registra cuidados, sube seguimiento, refresca desde foto, elimina planta.
- Cuidador: rol preparado en modelo de datos, pendiente de UI completa.
- Tester beta: prueba flujo completo y reporta fricciones por canal externo o futuro formulario.
- Institucion / PAC / municipalidad / ONG: actor futuro para huertos comunitarios, impacto e IoT.
- Servicios externos: Supabase, Gemini, Open-Meteo.

Casos de uso implementados:

- Iniciar sesion con Google.
- Capturar/subir foto de planta.
- Identificar especie y estado con IA.
- Confirmar ubicacion.
- Consultar clima real.
- Generar plan de cuidados.
- Guardar planta y foto.
- Ver listado de plantas.
- Ver ficha de planta.
- Ver calendario de cuidados.
- Registrar riego.
- Registrar nota/cuidado manual.
- Hacer seguimiento por foto.
- Actualizar planta desde foto con vista previa.
- Ver perfil.

Casos de uso preparados o futuros:

- Invitar cuidador.
- Ver plantas compartidas.
- Gestionar jardin/huerto.
- Ver metricas de impacto.
- Integrar sensores IoT.
- Reportar bug/mejora dentro de la app.

Advertencia para el grafico: usar lineas punteadas o etiquetas "pendiente" / "futuro" para cuidadores, jardines, instituciones e IoT.

### Vista logica / clases de dominio

Objetivo del grafico: mostrar entidades principales y responsabilidades internas.

Clases / tipos del frontend:

- `Plant`: entidad central visible en UI. Incluye identidad botanica, ownership, foto, ubicacion, clima, plan de cuidado, contexto, fechas e historial.
- `CarePlan`: regla de cuidado actual. Incluye frecuencia de riego, instrucciones, alertas de clima, exposicion solar, seguimiento por foto, arquetipo, regla de humedad, luz, humedad objetivo, temperaturas seguras, drenaje, fertilizacion, toxicidad y senales de alerta.
- `WeatherConditions`: datos meteorologicos: temperatura actual, maxima, minima, lluvia y humedad relativa.
- `PlantContext`: contexto confirmado: interior/balcon/exterior, drenaje, tamano de maceta, luz declarada.
- `InferredPlantContext`: contexto inferido por IA, con valores nullable cuando no hay confianza.
- `PlantKnowledgeSource`: origen del conocimiento: catalogo estatico o IA generada, con confianza.
- `Seguimiento`: resultado de seguimiento por foto: estado, puntuacion, sintomas, causas, preguntas, accion segura y riesgo.

Entidades Supabase:

- `profiles`: perfil de usuario.
- `care_archetypes`: reglas botanicas base por arquetipo.
- `species_catalog`: especies normalizadas enlazadas desde `plants.species_id`.
- `gardens`: espacio fisico compartido, preparado para futuro.
- `garden_members`: membresias y roles de jardin.
- `plants`: planta principal.
- `plant_members`: permisos por planta.
- `plant_events`: eventos de cuidado.
- `plant_media`: metadata de fotos y paths en Storage.
- `environmental_logs`: clima y contexto ambiental.
- `ai_analyses`: estructura para salidas IA.
- `diagnoses`: hipotesis diagnosticas.
- `recommendations`: recomendaciones accionables.
- `recommendation_outcomes`: resultado observado de una recomendacion.

Relaciones principales para ER:

- `profiles 1..N plants` por `plants.owner_id`.
- `profiles N..M plants` mediante `plant_members`.
- `profiles 1..N gardens` por `gardens.owner_id`.
- `profiles N..M gardens` mediante `garden_members`.
- `gardens 1..N plants` por `plants.garden_id` opcional.
- `species_catalog 1..N plants` por `plants.species_id` opcional.
- `care_archetypes 1..N species_catalog`.
- `plants 1..N plant_events`.
- `plant_events 1..N plant_media` y `plant_events 1..N environmental_logs`.
- `plants 1..N ai_analyses`.
- `ai_analyses 1..N diagnoses`.
- `diagnoses 1..N recommendations`.
- `recommendations 1..N recommendation_outcomes`.

### Vista de componentes

Objetivo del grafico: mostrar modulos, dependencias y limites de responsabilidad.

Componentes frontend:

- `App.tsx`: router principal y lazy loading de pantallas.
- `AuthContext`: sesion Supabase, login/logout Google y sincronizacion de perfil.
- `PlantDataContext`: cache compartida de plantas visibles para reducir popping y recargas.
- `pages/*`: pantallas que orquestan flujo visual.
- `components/*`: navegacion, progreso, avatar, rutas privadas.
- `src/lib/ai.ts`: cliente frontend de IA, solo llama `/api/ai/*`.
- `src/lib/aiSchema.ts`: normalizacion y validacion de respuestas IA.
- `src/lib/weather.ts`: busqueda de ubicaciones, geocoding y clima.
- `src/lib/plants.ts`: persistencia, permisos, Storage, eventos, riego y mapeo Supabase.
- `src/lib/plantKnowledge.ts`: catalogo botanico estatico.

Componentes backend:

- `server/index.ts`: Express API, prompts, Gemini, Open-Meteo proxy, endpoints de conocimiento.
- `server/dynamicPlantKnowledge.ts`: catalogo dinamico IA en memoria.
- `api/ai/*` y `api/location/*`: wrappers para Vercel.

Servicios externos:

- Supabase Auth.
- Supabase Postgres.
- Supabase Storage.
- Google Gemini.
- Open-Meteo Geocoding / Forecast.

Dependencias recomendadas para diagrama:

- UI -> `AuthContext` -> Supabase Auth.
- UI -> `PlantDataContext` -> `plants.ts` -> Supabase Postgres/Storage.
- Flujo nueva planta -> `ai.ts` -> `/api/ai/identify-plant` -> Gemini.
- Ubicacion -> `weather.ts` -> `/api/location/search` -> Open-Meteo.
- Plan de cuidado -> `ai.ts` -> `/api/ai/care-plan` -> `server/index.ts` -> catalogo estatico o Gemini.
- Seguimiento -> `ai.ts` -> `/api/ai/follow-up` -> Gemini -> `aiSchema.ts` -> `plants.ts`.

### Vista de procesos / actividad

Objetivo del grafico: mostrar pasos, decisiones, validaciones y fallbacks.

Actividad principal: crear planta desde foto.

1. Usuario abre `Nueva planta`.
2. `Camera.tsx` captura o carga imagen.
3. `compressImageFile` reduce peso.
4. `IdentifyPlant.tsx` llama `identifyPlantFromImage`.
5. `src/lib/ai.ts` envia POST `/api/ai/identify-plant`.
6. `server/index.ts` llama Gemini.
7. `normalizePlantIdentification` valida respuesta.
8. Backend intenta enriquecer con catalogo estatico.
9. Usuario confirma nombre/ubicacion en `LocationInput.tsx`.
10. `weather.ts` consulta ubicacion y clima.
11. `GeneratingProfile.tsx` llama `generateCarePlan`.
12. Si hay catalogo estatico, se usa plan curado.
13. Si no hay catalogo, Gemini genera plan.
14. `normalizeCarePlan` aplica rangos y enums seguros.
15. `createPlantForUser` crea `plants`.
16. Se crea `plant_events` de tipo `creation`.
17. Si hay clima, se crea `environmental_logs`.
18. Si hay foto, se sube a Storage y se crea `plant_media`.
19. App navega a `PlantProfile`.

Decisiones importantes para rombos:

- Imagen valida?
- IA disponible?
- La especie existe en catalogo estatico?
- Hay ubicacion o coordenadas?
- Open-Meteo responde?
- Hay foto para subir?
- Supabase inserta correctamente?

Fallbacks reales:

- Si Gemini falla en plan por 429/503, se usa plan conservador local.
- Si ubicacion/clima falla, la app puede generar resumen conservador para no inventar clima.
- Si el catalogo estatico tiene match, evita llamada IA para el plan.

Actividad secundaria: seguimiento por foto.

1. Usuario entra a seguimiento desde ficha o calendario.
2. Sube/captura foto.
3. `analyzeFollowUpImage` llama `/api/ai/follow-up`.
4. Gemini devuelve estado, sintomas, causas, preguntas y recomendacion.
5. `normalizeFollowUpResult` valida.
6. `saveFollowUpPhoto` crea evento, sube foto, crea media y actualiza estado de planta.

### Vista de despliegue

Objetivo del grafico: mostrar nodos fisicos/logicos y comunicacion.

Nodos recomendados:

- Cliente movil/navegador: PWA React.
- Vite dev server / Vercel hosting: sirve frontend.
- Express API local o Vercel functions: endpoints `/api/*`.
- Supabase:
  - Auth.
  - Postgres.
  - Storage privado `plant-images`.
- Google Gemini API.
- Open-Meteo API.

Flujos de red:

- Browser -> Vite/Vercel: carga SPA.
- Browser -> Supabase Auth: login Google via Supabase.
- Browser -> `/api/ai/*`: operaciones IA sin exponer API key.
- Backend -> Gemini: prompts y respuestas JSON.
- Browser/backend -> Supabase Postgres: datos de plantas, eventos, catalogo y permisos.
- Browser -> Supabase Storage: upload/read con signed URLs.
- Backend -> Open-Meteo: geocoding y clima.

Nota de calidad: Gemini API key vive en backend, nunca en frontend.

### Vista +1 / escenarios

Usar estos escenarios como hilo conductor de la presentacion:

- Escenario 1: usuario crea una planta desde foto y recibe plan de cuidado.
- Escenario 2: usuario revisa calendario y registra riego.
- Escenario 3: usuario sube foto de seguimiento y se actualiza el estado.
- Escenario 4: usuario refresca identificacion/plan desde una foto nueva con vista previa.
- Escenario 5 futuro: dueno comparte planta o jardin con cuidador.

## 4. Datos listos para graficar

### Tabla para grafico de arquitectura por capas

| Capa | Elementos | Responsabilidad |
|---|---|---|
| Presentacion | `pages/*`, `components/*`, `BottomNav`, `PrivateRoute` | Flujo visual, navegacion, estados UI |
| Estado cliente | `AuthContext`, `PlantDataContext` | Sesion, perfil, cache de plantas |
| Dominio frontend | `plants.ts`, `weather.ts`, `images.ts`, `plantFormatters.ts` | Reglas de riego, persistencia, clima, compresion |
| Contrato IA | `ai.ts`, `aiSchema.ts` | Cliente HTTP IA y normalizacion de respuestas |
| Backend API | `server/index.ts`, `api/*` | Prompts, endpoints, fallback, proxy externo |
| Datos | Supabase Postgres | Plantas, eventos, catalogos, miembros, analisis |
| Archivos | Supabase Storage | Fotos privadas por usuario/planta |
| Externos | Gemini, Open-Meteo | Vision/plan IA y clima/ubicacion |

### Tabla para grafico ER compacto

| Entidad | Tipo | Estado | Relacion clave |
|---|---|---|---|
| `profiles` | usuario | actual | posee plantas y jardines |
| `plants` | dominio central | actual | pertenece a owner, especie y opcionalmente jardin |
| `species_catalog` | catalogo botanico | actual | normaliza especie de plantas |
| `care_archetypes` | reglas botanicas | actual | alimenta catalogo/especies |
| `plant_events` | historial | actual | registra acciones de planta |
| `plant_media` | fotos | actual | metadata de Storage ligada a evento |
| `environmental_logs` | clima/contexto | actual | clima por evento/planta |
| `plant_members` | permisos planta | preparado | roles owner/caregiver/viewer |
| `gardens` | huertos | preparado | agrupa plantas |
| `garden_members` | permisos jardin | preparado | roles por jardin |
| `ai_analyses` | salidas IA | preparado | aun no persistido completamente |
| `diagnoses` | diagnostico | preparado | flujo visible pendiente |
| `recommendations` | recomendacion | preparado | flujo visible pendiente |
| `recommendation_outcomes` | evaluacion | preparado | aprendizaje futuro |

### Tabla para grafico de calidad

| Estandar de calidad | Evidencia en Lleken | Como explicarlo |
|---|---|---|
| Seguridad | Supabase Auth, RLS, Storage privado, rutas privadas | Solo usuarios autenticados acceden a plantas/fotos segun membresia |
| Separacion de responsabilidades | UI, `ai.ts`, `aiSchema.ts`, `plants.ts`, backend | La IA no decide permisos ni persistencia |
| Robustez | Fallback local para plan cuando Gemini falla | El usuario no queda bloqueado si la IA esta temporalmente caida |
| Validacion | Normalizadores IA limitan enums/rangos | Respuestas IA no se persisten crudas |
| Mantenibilidad | Documentacion en `docs/`, rutas canonicas, tests | Facilita explicar, auditar y retomar el proyecto |
| Escalabilidad de datos | Eventos, media, logs y catalogos separados | Evita guardar todo como un unico objeto gigante |
| Privacidad | Paths y URLs firmadas, no URLs publicas permanentes | Las fotos privadas no quedan expuestas |
| Rendimiento percibido | Lazy routes, prefetch, `PlantDataContext` cache | Reduce recargas/popping entre pantallas |

## 5. Prompts sugeridos para otra IA de graficos

### Prompt para diagrama de componentes

Crear un diagrama UML de componentes para Lleken, una PWA React + TypeScript + Vite. Mostrar componentes: Browser/PWA, React Router, AuthContext, PlantDataContext, pages, src/lib/ai.ts, src/lib/aiSchema.ts, src/lib/plants.ts, src/lib/weather.ts, server/index.ts, Supabase Auth, Supabase Postgres, Supabase Storage, Gemini API y Open-Meteo API. Indicar que la UI llama `/api/ai/*` y `/api/location/*`; Gemini solo se llama desde backend; `plants.ts` persiste plantas/eventos/media/logs en Supabase; `aiSchema.ts` normaliza respuestas IA antes de UI/persistencia.

### Prompt para diagrama de actividad

Crear un diagrama UML de actividad para el flujo "Crear planta desde foto" en Lleken. Pasos: capturar foto, comprimir imagen, identificar planta con IA, normalizar respuesta, confirmar ubicacion, consultar Open-Meteo, generar plan de cuidados, decidir si usar catalogo estatico o Gemini, normalizar plan, crear planta en Supabase, crear evento inicial, guardar clima, subir foto a Storage, guardar metadata, mostrar ficha. Incluir decisiones: IA disponible, especie en catalogo estatico, clima disponible, foto subida correctamente. Mostrar fallback local de plan conservador ante Gemini 429/503.

### Prompt para ER

Crear un diagrama ER para Supabase de Lleken. Entidades: profiles, care_archetypes, species_catalog, gardens, garden_members, plants, plant_members, plant_events, plant_media, environmental_logs, ai_analyses, diagnoses, recommendations, recommendation_outcomes. Relaciones: profiles posee plants y gardens; gardens tiene garden_members y plants; plants pertenece a species_catalog y tiene plant_members, plant_events, plant_media, environmental_logs, ai_analyses, diagnoses y recommendations; diagnoses puede depender de ai_analyses; recommendations tiene recommendation_outcomes. Marcar gardens, plant_members, ai_analyses, diagnoses y recommendations como preparados/parciales si el grafico distingue estado funcional.

### Prompt para diagrama de despliegue

Crear diagrama UML de despliegue para Lleken. Nodos: dispositivo movil/navegador con PWA React, hosting Vercel/Vite, API Express o Vercel Functions, Supabase Auth, Supabase Postgres, Supabase Storage privado, Gemini API y Open-Meteo API. Mostrar que el navegador carga la SPA, usa Supabase Auth, llama endpoints `/api/*`, la API llama Gemini y Open-Meteo, y los datos/fotos viven en Supabase. Indicar que `GEMINI_API_KEY` vive en backend, no en frontend.

## 6. Riesgos de representacion

No dibujar lo siguiente como "actual" sin marca:

- Cuidadores como flujo terminado: el modelo esta preparado, la UI no.
- Jardines como feature terminada: existen tablas y plan, pero no UI completa.
- IA predictiva avanzada como terminada: hay estructura y plan, pero falta persistencia completa y aprendizaje.
- `tester_feedback`: es propuesta beta, no tabla confirmada en migraciones.
- Firebase como backend actual: queda como residuo historico; la fuente actual es Supabase.

Si el grafico necesita mostrar vision futura, usar color distinto, borde punteado o etiqueta "futuro / preparado".

## 7. Evidencia tecnica revisada

- `README.md`: descripcion, stack y estado general.
- `docs/current/APP_OVERVIEW.md`: rutas, modelo de datos, backend API, pipeline IA, estado funcional y deuda.
- `docs/current/AI_PIPELINE.md`: separacion codigo/IA/clima/persistencia.
- `docs/current/DATABASE_STATE.md`: Supabase como fuente operativa.
- `src/App.tsx`: rutas privadas y pantallas.
- `src/contexts/AuthContext.tsx`: Auth Supabase y sincronizacion de perfil.
- `src/contexts/PlantDataContext.tsx`: cache de plantas visibles.
- `src/types/index.ts`: tipos de dominio.
- `src/lib/plants.ts`: persistencia Supabase, riego, eventos, Storage.
- `src/lib/ai.ts`: cliente frontend de IA.
- `src/lib/aiSchema.ts`: normalizacion de IA.
- `src/lib/weather.ts`: ubicacion y clima.
- `server/index.ts`: backend Express, Gemini, Open-Meteo y endpoints.
- `server/dynamicPlantKnowledge.ts`: catalogo dinamico IA.
- `supabase/migrations/202605010001_initial_lleken_schema.sql`: schema central.
- `supabase/migrations/202605050001_species_monitoring.sql`: monitoreo de especies.
