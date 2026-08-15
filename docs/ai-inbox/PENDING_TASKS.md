# Pending Tasks

Backlog activo de la nueva linea de producto. No guardar historial completado aqui.

## Prioridad

- U1 - bloquea iteracion o una decision inmediata.
- U2 - habilita el nucleo del producto o reduce riesgo alto.
- U3 - mejora capacidad posterior.
- U4 - puede esperar.

## 1. Habilitar y verificar localhost con Supabase Auth

- **Urgencia:** U1 - bloquea el ciclo rapido de desarrollo.
- **Dificultad:** D2 - requiere configuracion remota y prueba en navegador.
- **Archivo guia:** `docs/architecture/LOCAL_DEVELOPMENT_AUTH_PLAN.md`.
- **Dominio afectado:** Auth, configuracion local y QA.
- **Archivos objetivo iniciales:** `.env.local`, `README.md`, `src/contexts/AuthContext.tsx` solo si la configuracion remota no basta.
- **Objetivo:** login Google local vuelve a `http://localhost:3000/home` y produccion conserva su retorno.
- **Fuera de alcance:** cambiar proveedor, reescribir Auth o mezclar cambios de producto.
- **Criterio de arquitectura:** cada entorno retorna a su propio origen mediante URLs explicitamente autorizadas.
- **Criterio de aceptacion:** login y refresh de `/home` pasan en local y produccion.
- **Verificacion:** prueba manual en ambos entornos; `npm run check` si se toca codigo.
- **Requiere aprobacion:** si, para editar configuracion externa de Supabase o codigo.

## 2. Definir aislamiento de datos de desarrollo

- **Urgencia:** U1 - iterar en local no debe contaminar el piloto real.
- **Dificultad:** D2 - decision tecnica y operativa.
- **Archivo guia:** `docs/architecture/LOCAL_DEVELOPMENT_AUTH_PLAN.md`.
- **Dominio afectado:** Supabase, Auth, Storage y migrations.
- **Archivos objetivo iniciales:** `docs/current/DATABASE_STATE.md`, `.env.example`, documentacion de deploy.
- **Objetivo:** decidir entre proyecto Supabase de desarrollo separado o politica temporal de datos de prueba.
- **Fuera de alcance:** crear recursos externos sin autorizacion.
- **Criterio de aceptacion:** decision escrita con variables, flujo de migrations, limpieza y responsables.
- **Verificacion:** no aplica; decision documental y posterior prueba de conexion.

## 3. Especificar el dominio colaborativo minimo

- **Urgencia:** U2 - evita construir UI sobre el modelo individual heredado.
- **Dificultad:** D3 - requiere criterio de producto, datos y permisos.
- **Archivo guia:** `docs/product/PRODUCT_VISION_COLLABORATIVE_CARE.md`.
- **Dominio afectado:** producto y arquitectura de datos.
- **Archivos objetivo iniciales:** `docs/current/DATABASE_STATE.md`, `supabase/migrations/202605010001_initial_lleken_schema.sql`, nuevo ER propuesto.
- **Objetivo:** definir espacio, sector/grupo, miembro, rol, tarea, asignacion, incidencia y evento de cuidado.
- **Fuera de alcance:** escribir migrations o implementar pantallas.
- **Criterio de arquitectura:** soportar acciones agregadas y autoria sin exigir una ficha detallada por planta.
- **Criterio de aceptacion:** glosario, reglas, estados, permisos y ER propuesto revisables.
- **Verificacion:** contraste campo por campo con schema aplicado y casos de uso.

## 4. Diseñar el prototipo navegable sin IA

- **Urgencia:** U2 - valida el nucleo antes de persistencia nueva.
- **Dificultad:** D3 - requiere arquitectura de informacion y flujo mobile.
- **Archivo guia:** `docs/product/PRODUCT_REFOUNDATION_ROADMAP.md`.
- **Dominio afectado:** UX de espacios, tareas y equipo.
- **Archivos objetivo iniciales:** nuevo user flow y mapa de pantallas; componentes solo en una fase aprobada posterior.
- **Objetivo:** probar Mis espacios -> Panel -> Tareas -> Registrar cuidado -> Actividad/Incidencias.
- **Fuera de alcance:** llamadas IA, IoT, pagos, analitica avanzada y rediseño total de marca.
- **Criterio de arquitectura:** el flujo principal funciona conceptualmente aunque IA no este disponible.
- **Criterio de aceptacion:** prototipo mobile navegable y cinco escenarios de prueba con roles.
- **Verificacion:** prueba guiada con usuarios o revision de escenarios antes de codigo persistente.

## 5. Implementar una vertical multiusuario pequeña

- **Urgencia:** U2 - primera demostracion del nuevo valor.
- **Dificultad:** D4 - debe dividirse despues de cerrar tareas 1-4.
- **Archivo guia:** `docs/product/PRODUCT_REFOUNDATION_ROADMAP.md`.
- **Dominio afectado:** React, Supabase, RLS y UX.
- **Archivos objetivo iniciales:** a definir desde el prototipo y ER aprobados.
- **Objetivo:** dos usuarios comparten un espacio, coordinan una tarea y ven la autoria del cuidado.
- **Fuera de alcance:** acciones masivas, IA, metricas institucionales y automatizacion.
- **Criterio de arquitectura:** permisos aplicados en base, no solo ocultos en interfaz.
- **Criterio de aceptacion:** coordinador, cuidador, observador y no miembro cumplen sus permisos en pruebas reales.
- **Verificacion:** `npm run check`, pruebas RLS y recorrido manual en local.

## 6. Clasificar y archivar documentacion heredada

- **Urgencia:** U3 - reduce contradicciones una vez establecida la nueva base.
- **Dificultad:** D2 - documental, pero atraviesa varios indices.
- **Archivo guia:** `docs/maintenance/PROJECT_REFOUNDATION_AUDIT_2026-07-10.md`.
- **Dominio afectado:** continuidad de agentes.
- **Archivos objetivo iniciales:** Beta 1, roadmap anterior, pipeline IA, planes UX y arquitectura Firebase historica.
- **Objetivo:** marcar cada documento como vigente, heredado reutilizable o archivo historico.
- **Fuera de alcance:** borrar evidencia o reescribir codigo.
- **Criterio de aceptacion:** ningun indice presenta el cuidado individual/IA como prioridad actual.
- **Verificacion:** enlaces principales vivos desde `docs/INDEX.md` y `docs/README_DOCS_INDEX.md`.

## 7. Ejecutar smoke autenticado de SAN-01 en Express y Vercel

- **Urgencia:** U1 - la frontera IA/Auth esta implementada, pero falta validar configuracion real de ambos runtimes.
- **Dificultad:** D2 - requiere sesiones validas, variables del entorno y llamadas sin mocks.
- **Archivo guia:** `docs/current/AI_PIPELINE.md`.
- **Dominio afectado:** Auth, API IA, Express y Vercel.
- **Archivos objetivo iniciales:** configuracion local/Vercel; no cambiar codigo salvo evidencia concreta del smoke.
- **Objetivo:** confirmar `missing bearer -> 401`, token invalido -> `401` y token valido -> ejecucion de identify, care plan, follow-up y refresh en ambos adapters.
- **Fuera de alcance:** service-role, cambios de schema/RLS, UI o refactor de Open-Meteo.
- **Criterio de arquitectura:** Express y Vercel ejecutan el mismo `server/ai/core.ts`; refresh consume realmente la imagen.
- **Criterio de aceptacion:** ocho rutas principales verificadas con logs seguros y sin mensajes arbitrarios de Gemini en el cliente.
- **Verificacion:** smoke local autenticado y preview/deploy Vercel con `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` o sus aliases `VITE_` disponibles.
