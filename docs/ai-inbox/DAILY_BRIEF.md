# Daily Brief

Fecha: 2026-07-10.

## Estado

- Lleken inicia una refundacion de producto: coordinacion de grupos de personas que cuidan conjuntos amplios de plantas.
- La IA deja de ser el centro del producto y pasa a ser una tecnologia opcional de apoyo.
- El codigo actual sigue implementando principalmente cuidado individual, foto, identificacion, plan y seguimiento.
- Supabase ya contiene jardines, membresias y roles como base heredada, pero no existe una experiencia funcional de grupos en el frontend.
- El ciclo local esta bloqueado por el retorno OAuth al dominio real. El codigo usa el origen actual; el diagnostico probable es una Redirect URL local ausente en Supabase Auth.
- Este corte fue solo documental: no se modifico codigo, schema, dependencias ni configuracion externa.

## Canon nuevo

1. `docs/product/PRODUCT_VISION_COLLABORATIVE_CARE.md` - que producto se quiere construir.
2. `docs/product/PRODUCT_REFOUNDATION_ROADMAP.md` - orden incremental de trabajo.
3. `docs/maintenance/PROJECT_REFOUNDATION_AUDIT_2026-07-10.md` - evidencia del estado heredado.
4. `docs/architecture/LOCAL_DEVELOPMENT_AUTH_PLAN.md` - diagnostico y aceptacion de localhost.
5. `docs/current/APP_OVERVIEW.md` y `docs/current/DATABASE_STATE.md` - que existe hoy.

Los documentos Beta 1, cuidado individual, pipeline IA y roadmap anterior quedan como contexto heredado hasta archivarlos o etiquetarlos en un corte posterior. No usarlos como prioridad activa si contradicen la nueva vision.

## Foco inmediato

1. Recuperar login y navegacion en localhost sin romper produccion.
2. Especificar el dominio colaborativo minimo contra el schema Supabase real.
3. Diseñar un prototipo navegable de espacios, sectores, personas, tareas e incidencias sin depender de IA.

## Zonas confusas para IA

- `gardens` y `garden_members` existen en migrations, pero la feature no existe en el frontend.
- No asumir que una planta individual es la unidad principal de UX.
- No convertir una auditoria o plan en implementacion sin un corte de codigo aprobado.
- No asumir que el retorno productivo esta fijado en React: revisar primero la allow list de Supabase Auth.
- No usar Firebase como fuente operativa actual.

## Comandos ejecutados recientemente

- Lectura de indices, brief, backlog, overview, estado de base y workflow documental -> PASS.
- Inventario de rutas, pantallas, API, migrations y referencias a jardines/grupos -> PASS.
- Revision de `AuthContext.tsx`, cliente Supabase, Vite, Vercel y variables locales -> PASS.
- `git status --short` -> worktree ya contenia cambios documentales previos; se preservaron.
- `npm run check` -> no ejecutado; el corte no modifica codigo.

