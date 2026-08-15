# Checkpoints de Lleken

## Estado actualizado - 2026-06-02

Sesion documental orientada a dejar el repo listo para retomar el 2026-06-03 con agentes IA.

Checkpoint activo recomendado: **DOC-1 - Continuidad documental y backlog delegable**

### DOC-1 - Continuidad documental y backlog delegable

Estado: completado para la configuracion base.

Objetivo:

- Adaptar la skill portable de documentacion al repo Lleken.
- Crear una ruta corta para agentes nuevos.
- Separar brief diario, backlog activo y auditorias proactivas.
- Registrar tareas delegables para retomar manana sin releer todo el historial.
- Marcar Supabase como fuente operativa vigente y Firebase como referencia historica.

Resultado:

- `AGENTS.md` apunta primero a `docs/README_DOCS_INDEX.md`, `docs/ai-inbox/DAILY_BRIEF.md` y `docs/ai-inbox/PENDING_TASKS.md`.
- `docs/README_DOCS_INDEX.md` queda como ruta corta de lectura.
- `docs/ai-inbox/DAILY_BRIEF.md` resume estado, comandos recientes y foco de retomada.
- `docs/ai-inbox/PENDING_TASKS.md` contiene tareas activas delegables.
- `docs/maintenance/PROACTIVE_AGENT_AUDIT_PROTOCOL.md` define como proponer hallazgos sin implementar sin aprobacion.
- `docs/INDEX.md` fue limpiado y actualizado para enlazar la nueva estructura.

Verificacion tecnica:

- `npm run check`: pasa el 2026-06-02.

Siguiente corte recomendado para 2026-06-03:

1. Validar manualmente UX-1 anti-popping en navegador.
2. Preparar UX-2 Home util como corte implementable.
3. Dibujar ER actual Supabase para cerrar la deuda de diagramas.

Nota de alcance:

- Esta sesion fue docs-only. No se cambiaron codigo, dependencias, imports, rutas ni comportamiento.
- Los bloques historicos C0-C5 pueden contener referencias a Firebase porque documentan etapas anteriores. Si se convierten en trabajo activo, deben reescribirse primero para Supabase.
- Limpieza 2026-06-02: docs activos actualizados para que Supabase figure como fuente operativa y Firebase quede como referencia historica/deuda.

## Estado actualizado - 2026-05-04

Nueva sesion orientada a ordenar el trabajo del dia, preparar el despliegue inicial en Vercel y comenzar testeo con datos reales del huerto PAC.

Checkpoint activo recomendado: **S3 - Plan del dia: Vercel + piloto real matico**

### S3 - Plan del dia: Vercel + piloto real matico

Estado: completado para el flujo critico de despliegue y creacion de planta

Objetivo:

- Ordenar tareas de usuario y Codex para avanzar sin mezclar frentes.
- Preparar una primera version testeable usando Vercel para frontend/API y Supabase para Auth, Postgres y Storage.
- Ordenar el primer caso real de Dante: propagacion de matico (`Buddleja globosa`).
- Usar datos reales manuales para mejorar la UI y el modelo predictivo por iteraciones cortas.

Resultado inicial:

- `server/index.ts` conserva el backend local Express para desarrollo.
- Vercel usa funciones planas en `api/*.ts`; no corre `npm run dev:api` en produccion.
- `vercel.json` define build Vite, salida `dist`, fallback SPA y duracion extendida para endpoints IA.
- `docs/process/VERCEL_SUPABASE_DEPLOY.md` documenta variables, Supabase Auth y smoke test.
- `docs/product/REAL_DATA_PILOT.md` documenta la estrategia de datos reales PAC.
- `docs/product/cases/MATICO_PROPAGATION_DANTE.md` registra el caso real de matico.
- `docs/architecture/PREDICTIVE_AI_MODEL.md` integra la arquitectura predictiva progresiva.
- `src/lib/plantKnowledge.ts` incorpora matico al catalogo estatico.
- Se limpio el despliegue para respetar el limite Hobby de Vercel: maximo 12 Serverless Functions.
- Produccion quedo con 7 funciones serverless.

Verificacion completada:

- Revisar `docs/process/TODAY_2026_05_04.md`.
- Deploy Vercel en `https://lleken.vercel.app`.
- `/api/health`: responde 200.
- `/api/location/search`: responde 200.
- Login Google ajustado con URLs en Supabase/Google.
- Crear planta nueva funciona en produccion.
- Gemini responde desde Vercel mediante `GEMINI_API_KEY`.

Verificacion tecnica ya ejecutada:

- `npm run check`: pasa.

Deuda inmediata:

- Hacer smoke test corto de la planta creada: ficha, recarga, foto, calendario y seguimiento.
- Planificar siguiente etapa UX beta: Home util, crear planta flexible, feedback de testers, jardines y compartir.
- Mantener funciones bajo el limite Hobby mientras dure esta etapa.
- Remover o consolidar restos historicos de Firebase cuando ya no aporten al bundle.

---

## Estado actualizado - 2026-05-02

La postulacion al concurso ya fue enviada. Durante mayo, la prioridad mas alta es preparar un prototipo suficientemente solido para testeo pequeno antes del 2026-06-01.

Google Drive queda como documentacion de solo lectura por ahora. La documentacion activa vive en el repo y las versiones para compartir se exportan a PDF.

Checkpoint tecnico cerrado hoy: **S1 - Migracion base a Supabase para auth, plantas, storage y species_id**

Checkpoint recomendado para la proxima sesion: **S2 - Pruebas aisladas y endurecimiento Supabase**, antes de volver a crecer en features.

Checkpoint documental pendiente: **D1 - Diagramas del estado actual**, actualizar despues de estabilizar Supabase.

### S1 - Migracion base a Supabase

Estado: completo

Objetivo:

- Reemplazar Firebase como fuente operativa para login, plantas nuevas, imagenes y eventos.
- Mantener Google login funcionando.
- Guardar imagenes en Storage y solo paths/metadata en base.
- Linkear plantas con `species_catalog` via `species_id`.

Resultado:

- Supabase proyecto `Lleken` (`kfhoyvofjyvjmgtfzpuu`) conectado.
- Google Auth probado por el usuario.
- `.env.local` tiene URL y publishable key de Supabase.
- `profiles`, `plants`, `plant_events`, `plant_media`, `environmental_logs`, `species_catalog` y tablas futuras creadas.
- Bucket privado `plant-images` creado.
- Imagenes guardadas como objetos de Storage; la base guarda `storage_path`.
- Planta real de prueba `tomaco` creada correctamente.
- `tomaco` quedo enlazada a `species_catalog` con `species_id`.

Verificacion:

- `npm run check`: pasa.
- Query Supabase confirma `tomaco -> Solanum lycopersicum -> comestible_aromatica`.
- Ultimo commit subido: `5b64fda fix: link plants to species catalog`.

### S2 - Pruebas aisladas y endurecimiento Supabase

Estado: recomendado

Objetivo:

- Probar piezas por separado antes de seguir construyendo encima.
- Detectar problemas de RLS, storage o auth sin depender de todo el flujo UI.

Alcance recomendado:

- Test manual UI: login, crear planta, abrir ficha, recargar, cerrar/abrir sesion.
- Test storage: confirmar que se ve la imagen propia y no se persisten URLs firmadas.
- Test RLS: acceso anonimo bloqueado, usuario autenticado solo ve sus datos.
- Test Postman opcional: usar `docs/architecture/postman/lleken-supabase-smoke.postman_collection.json` si necesitamos aislar API/Data API.
- Test codigo: agregar mocks o pruebas pequenas para `ensureSpeciesCatalogEntry` y mapeo de datos si el flujo vuelve a romper.

Fuera de alcance:

- Cuidadores completos.
- Recomendador predictivo.
- Persistencia completa de `ai_analyses`.
- Curacion humana de catalogo botanico.

### D1 - Diagramas del estado actual

Estado: en progreso

Objetivo:

- Dibujar el proyecto actual antes de escalarlo.
- Separar claramente lo funcional, lo preparado en datos y lo futuro.
- Dejar material exportable a PDF para equipo, postulacion, mentores o testers.

Orden:

1. Casos de uso.
2. Flujo de usuario / navegacion.
3. Componentes / arquitectura logica.
4. Secuencia: nueva planta.
5. Secuencia: seguimiento por foto.
6. ER actual.
7. ER propuesto.
8. Estados de una planta.
9. Clases / modelo TypeScript de dominio.

Verificacion:

- Cada diagrama debe vivir en `docs/architecture/diagrams/`.
- Cada diagrama debe decir que es actual y que es futuro.
- Al cerrar D1, exportar una version PDF de lectura.

### D2 - Sistema operativo semanal del equipo

Estado: iniciado

Objetivo:

- Que cada integrante pueda preguntar a su chat de IA "que me toca hoy" o "que hay disponible para tomar" sin buscar manualmente en todos los documentos.

Entregables:

- `TEAM.md` con roles claros.
- `WEEKLY_EXECUTION.md` con tareas asignadas y disponibles.
- `AI_MEMBER_ONBOARDING.md` con protocolo para chats de IA.
- `member_briefs/` con contexto minimo por integrante.

Verificacion:

- Cada integrante puede identificarse por nombre y recibir sus tareas actuales.
- Las tareas disponibles se pueden tomar sin romper prioridades del sprint.

---

## Estado al cierre de sesión — 2026-04-30

Checkpoint activo completado: **C4**
Siguiente checkpoint recomendado: **C5 — Cuidadores básicos**

### Verificaciones al cierre de C4

- `npm run lint`: pasa.
- `npm run build`: pasa.
- `npm run check`: pasa (lint + build + tests).
- Tests unitarios: `src/lib/__tests__/ai.test.ts` y `src/lib/__tests__/plants.test.ts` pasan.
- Bundle optimizado: chunks separados para firebase (~116 kB gz), vendor (~17 kB gz) y ui.

### Lo que cambió en C2–C4

C2 (ficha e historial): `PlantProfile.tsx`, `src/lib/plants.ts`, `src/types/index.ts` — ficha consistente, historial funcional, lógica de dominio separada.

C3 (calendario real): `Calendar.tsx` — tareas derivadas de `riego_frecuencia_dias` y `seguimiento_foto_dias`, ajustadas por clima, marcables como realizadas.

C4 (calidad): `vite.config.ts` (manualChunks), textos corregidos, tests agregados, `SMOKE_TEST.md` creado, `src/lib/aiSchema.ts` con arquetipos y reglas de sustrato/luz.

### Deuda conocida al cierre

- Límite del plan gratis ya bloquea creación de plantas propias; falta UI de upgrade clara.
- Flujo de cuidadores preparado en modelo de datos (`caregiverIds`, `memberIds`) pero sin UI.
- La base Firestore es nombrada (`ai-studio-e42563f0-...`); Storage Rules no puede validar membresía contra ella hasta migrar a `(default)`.
- `server/index.ts` debe migrar a Cloud Functions o Cloud Run antes de producción real.
- Bundle de producción aún supera el umbral de advertencia de Vite (deuda aceptada).

---

## C0 - Orden operativo

Estado: completo

Objetivo:

- Dejar un sistema de trabajo claro para que el proyecto avance por ciclos verificables.

Alcance:

- Documentar flujo de trabajo.
- Documentar checkpoints.
- Agregar comando único de verificación.

Verificación:

- `npm run lint`
- `npm run build`
- Revisar que `WORKFLOW.md` y este archivo expliquen cómo seguir.

Resultado:

- `npm run check` pasa.
- Queda C1 como siguiente checkpoint activo recomendado.

Salida esperada:

- Equipo trabaja con un checkpoint activo por vez.
- Cada cierre deja evidencia de comandos y prueba manual.

## C1 - Baseline funcional del flujo nueva planta

Estado: completo

Objetivo:

- Confirmar que el flujo foto → identificación → ubicación → plan → ficha funciona completo en local.

Alcance:

- `src/pages/Camera.tsx`
- `src/pages/IdentifyPlant.tsx`
- `src/pages/LocationInput.tsx`
- `src/pages/GeneratingProfile.tsx`
- `src/pages/PlantProfile.tsx`
- `src/lib/ai.ts`
- `src/lib/plants.ts`
- `server/index.ts`

Checklist:

- Referencia visual `../archive/nuevaplanta.md` integrada en las pantallas reales del flujo.
- La IA puede devolver `contexto_inferido` con valores visibles desde la foto o `null` cuando no pueda determinar.
- El formulario de ubicación muestra sugerencias al escribir y permite guardar coordenadas precisas.
- Geolocalización intenta resolver comuna/ciudad y rellena el campo en vez de solo mostrar estado.
- API local levanta con `npm run dev:api` (ahora con auto-reload gracias a `tsx watch`).
- Vite levanta con `npm run dev`.
- Se puede seleccionar o tomar una foto.
- La IA responde desde backend, no desde frontend.
- La ubicación puede ingresarse manualmente.
- El plan se genera con clima o fallback controlado.
- La planta se guarda con `ownerId`, `memberIds`, `fotoUrl` y `fotoPath`.
- La ficha abre sin depender de llamar IA otra vez.

Verificación:

- `npm run lint`
- `npm run build`
- Prueba manual creando una planta de prueba.

Riesgos:

- Créditos o clave Gemini.
- Reglas Firebase no desplegadas a la base correcta.
- Permisos de Storage limitados por base Firestore nombrada.

## C2 - Ficha de planta e historial

Estado: completo

Objetivo:

- Hacer que la ficha sea confiable y no acumule lógica duplicada.

Alcance:

- Mostrar datos guardados de manera consistente.
- Registrar riego, notas y seguimiento.
- Separar cálculos reutilizables fuera de la UI si crecen demasiado.
- Confirmar que historial no se rompe con plantas legacy.

Verificación:

- `npm run lint`
- `npm run build`
- Crear planta, registrar riego, registrar nota y volver a abrir ficha.

## C3 - Calendario real

Estado: completo

Objetivo:

- Convertir el calendario en una vista accionable basada en planes guardados.

Alcance:

- Generar tareas desde frecuencia de riego y seguimiento.
- Marcar tareas realizadas.
- Reflejar cambios en historial/planta.
- Evitar tareas fijas que ignoren clima o último cuidado.

Verificación:

- `npm run lint`
- `npm run build`
- Probar calendario con al menos dos plantas.

## C4 - Calidad y deuda visible

Estado: completo

Objetivo:

- Reducir fragilidad antes de crecer en funciones.

Alcance:

- Corregir mojibake en textos.
- Agregar primeros tests de dominio para normalización IA y cálculos de calendario.
- Revisar lazy loading o chunking para bajar advertencia de bundle.
- Documentar smoke test de release.

Verificación:

- `npm run lint`
- `npm run build`
- Tests agregados pasan.
- Build sin advertencias críticas o con deuda registrada.

---

## C5 - Cuidadores básicos

Estado: pendiente de reescritura para Supabase

Objetivo:

- Permitir que el dueño de una planta invite a un cuidador, y que ese cuidador pueda ver y registrar cuidados en la planta compartida.

Nota vigente 2026-06-02: este checkpoint fue escrito originalmente para Firestore. Antes de implementarlo debe reescribirse sobre Supabase (`gardens`, `garden_members`, `plant_members` y RLS). No usar `caregiverIds`/`memberIds` como plan tecnico vigente.

Alcance:

- `src/pages/PlantProfile.tsx`: agregar sección "Cuidadores" que muestre quiénes tienen acceso y un botón para invitar.
- `src/lib/plants.ts`: agregar funciones sobre `plant_members`/`garden_members`, no sobre campos Firestore legacy.
- `src/pages/Profile.tsx` o nueva pantalla: mostrar plantas donde el usuario es cuidador (no dueño).
- `src/lib/plants.ts`: ajustar consultas para leer membresias reales desde Supabase.
- Probar politicas Supabase RLS/Storage con un segundo usuario antes de asumir que funcionan.

Fuera de alcance en este checkpoint:

- UI de invitación por email o link (requiere Cloud Functions o un flujo de email separado).
- Diferenciación de permisos granulares entre dueño y cuidador (se puede agregar en C6).
- Cambios de schema sin migracion Supabase revisada.

Checklist:

- El dueño puede agregar un cuidador por UID o email (busqueda basica en `profiles`).
- El cuidador ve la planta en su listado.
- El cuidador puede registrar riego y seguimiento.
- El cuidador no puede eliminar la planta ni cambiar el dueño.
- Las politicas Supabase RLS/Storage cubren este flujo; si no, crear migracion especifica.
- La planta compartida no consume cupo del plan gratis del cuidador.

Verificación:

- `npm run lint`
- `npm run build`
- Prueba manual con dos cuentas Google distintas en localhost.
- Confirmar en Supabase que `plant_members`/`garden_members` se actualizan correctamente.

Riesgos:

- RLS puede bloquear lecturas o escrituras si no se disenan politicas de membresia antes de la UI.
- El listado por membresias debe usar consultas/indexes Supabase adecuados; validar rendimiento antes de hacerlo ruta principal.

---

Para los checkpoints C6–C11 (modelo de datos propuesto, Gardens, Diagnoses, etc.), ver `../architecture/PLAN_ARQUITECTURA.md`.
