# Contrato agent-first

Este contrato es agnóstico del harness: aplica por igual a agentes Codex local/Remote y a ejecutores cloud.

## Autoridad

- La misión entregada por Anam/Dante gobierna el objetivo, alcance y criterios de aceptación.
- El código, tests y checkout actual gobiernan la realidad técnica.
- `docs/` puede contener información histórica. No se debe inferir el estado actual del producto desde documentación antigua, salvo que la misión la declare fuente.

## Preflight

- Antes de editar, comprobar `git status --short`, la rama actual, el último commit y las premisas de la misión.
- Preservar siempre cambios preexistentes.
- Detenerse ante contradicciones materiales; no rediseñar silenciosamente producto o arquitectura.

## Alcance y salvaguardas de Llekén

- No hacer refactors transversales, limpieza de deuda ajena, cambios visuales no solicitados, formateo masivo ni añadir paquetes por iniciativa propia.
- No cambiar claims de producto, semántica de confianza, contratos de datos ni fronteras de seguridad fuera del alcance explícito.
- No convertir fallbacks, heurísticas o inferencias de IA en hechos confirmados.
- No modificar configuración externa de Supabase, Vercel, Google OAuth u otros servicios salvo autorización explícita.
- No exponer secretos en logs, commits, fixtures, capturas ni respuestas.

## Ramas

- Una misión equivale a una rama corta.
- Las ramas representan la misión, no el modelo ni el agente que la ejecuta.
- Ejemplos: `feat/PROD-02-...`, `fix/SAN-02-...`, `refactor/ARQ-02-...`, `test/QA-01-...`, `chore/WF-...`.

## Permisos del agente

El agente está autorizado a:

- editar dentro del alcance de la misión;
- ejecutar herramientas y tests;
- crear o usar la rama asignada;
- hacer commit;
- hacer push únicamente de su rama de misión;
- crear o actualizar su PR o draft PR si las herramientas disponibles lo permiten.

Sin autorización explícita no puede:

- hacer push directo a `main`;
- mergear a `main`;
- desplegar producción;
- hacer force-push;
- hacer reset ni destruir trabajo ajeno;
- modificar o revelar secretos;
- ejecutar migraciones ni destrucción de datos externos;
- ampliar producto o arquitectura fuera de la misión.

## Validación

- Para cambios de código, ejecutar `npm run check` antes de entregar.
- Nunca declarar pruebas manuales, browser, auth, cámara o deploy como PASS si no existe evidencia de esa ejecución.
- Indicar claramente cualquier validación que tenga que realizar Dante.

## Retorno

El retorno debe ser compacto, porque GitHub es la evidencia principal. Debe informar:

- misión;
- resultado: `PASS`, `BLOCKED` o `FAIL`;
- rama;
- commit SHA;
- PR, si existe;
- resultado de `npm run check`;
- validación manual pendiente;
- riesgos o deuda reales.

No copiar logs largos, salvo un error relevante.
