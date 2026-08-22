# Contrato agent-first

Este contrato es agnóstico del harness: aplica por igual a agentes Codex local/Remote y a ejecutores cloud.

## Autoridad

- La misión entregada por Anam/Dante gobierna el objetivo, alcance y criterios de aceptación.
- Si Dante habilita trabajo autónomo sin misión puntual, el agente puede **seleccionar y ejecutar una misión horizontal propia** dentro de este contrato: debe ser acotada, reversible, verificable y no competir con una superficie/owner ya activo.
- El código, tests y checkout actual gobiernan la realidad técnica.
- Notion gobierna intención operativa, misiones, decisiones y estado mutable; `docs/` puede contener información histórica. No se debe inferir el estado actual del producto desde documentación antigua, salvo que la misión la declare fuente.
- Un PR o una rama representan estado candidato. `main` sigue gobernando la implementación integrada hasta merge.

## Preflight

- Antes de editar, comprobar `git status --short`, la rama actual, el último commit y las premisas de la misión.
- Cuando el agente elija trabajo autónomamente, recuperar primero sólo el canon fresco necesario y revisar PRs/frentes activos para evitar solapamientos.
- Preservar siempre cambios preexistentes.
- Detenerse ante contradicciones materiales; no rediseñar silenciosamente producto o arquitectura.

## Alcance y salvaguardas de Llekén

- El modo autónomo es **horizontal**: se pueden abrir frentes independientes, mantenimiento focalizado, pruebas, documentación, investigación aplicada o fixes acotados; no se usa como permiso implícito para reescribir el sistema entero.
- No hacer refactors transversales, limpieza de deuda ajena, cambios visuales arbitrarios, formateo masivo ni añadir paquetes sin una razón verificable ligada al frente elegido.
- No cambiar claims de producto, semántica de confianza, contratos de datos ni fronteras de seguridad sin contrastar primero su owner canónico y dejar trazabilidad de la decisión.
- No convertir fallbacks, heurísticas o inferencias de IA en hechos confirmados.
- No modificar configuración externa de Supabase, Vercel, Google OAuth u otros servicios salvo autorización explícita para esa superficie.
- No exponer secretos en logs, commits, fixtures, capturas ni respuestas.
- Lectura, investigación, tests y ramas independientes pueden avanzar en paralelo; las escrituras sobre un mismo owner/seam y la integración final son seriales.
- Si otro PR o proceso ya trabaja sobre la misma superficie, cambiar a otro seam, revisión o handoff antes de competir por ella.

## Ramas

- Una misión equivale a una rama corta.
- Las ramas representan la misión, no el modelo ni el agente que la ejecuta.
- Ejemplos: `feat/PROD-02-...`, `fix/SAN-02-...`, `refactor/ARQ-02-...`, `test/QA-01-...`, `chore/WF-...`.
- El trabajo autónomo no se acumula en una rama genérica permanente: cada frente conserva su propia rama y evidencia.

## Permisos del agente

Dentro de una misión explícita o de una misión horizontal elegida autónomamente, el agente está autorizado a:

- inspeccionar repositorio, PRs, checks y documentación propietaria necesaria;
- editar dentro del alcance acotado del frente;
- ejecutar herramientas y tests;
- crear o usar una rama de misión desde el baseline vigente;
- hacer commit;
- hacer push únicamente de su rama de misión;
- crear o actualizar su PR o draft PR si las herramientas disponibles lo permiten;
- revisar CI y corregir la misma rama mientras el cambio siga dentro de su alcance;
- dejar handoffs o retorno documental cuando el resultado cambie conocimiento persistente.

Sin autorización explícita adicional no puede:

- hacer push directo a `main`;
- mergear a `main`;
- desplegar producción ni promover un preview a producción;
- hacer force-push;
- hacer reset ni destruir trabajo ajeno;
- cerrar/borrar trabajo ajeno como sustituto de una revisión;
- modificar o revelar secretos;
- ejecutar migraciones destructivas ni destrucción de datos externos;
- realizar compras, publicaciones o compromisos externos;
- tratar una propuesta de PR/agente como canon antes de su integración.

## Criterio para elegir trabajo autónomo

Cuando no exista una misión puntual, seleccionar trabajo por utilidad demostrable, no por actividad:

1. identificar owner y estado fresco;
2. comprobar que el frente no está siendo escrito por otro proceso;
3. priorizar reducción de riesgo, incertidumbre, retrabajo o tiempo hasta un resultado útil;
4. preferir el slice más pequeño que desbloquee trabajo posterior;
5. descartar el frente si su valor marginal es bajo o depende de una decisión humana irreducible;
6. no convertir cada idea, hallazgo o documento stale en una tarea.

## Validación

- Para cambios de código, ejecutar `npm run check` antes de entregar, salvo que el propio baseline impida hacerlo; en ese caso separar el bloqueo preexistente de la evidencia del cambio.
- Para cambios documentales/operativos, validar diff, frescura y coherencia con el owner afectado.
- Nunca declarar pruebas manuales, browser, auth, cámara, gameplay, hardware o deploy como PASS si no existe evidencia de esa ejecución.
- Indicar claramente cualquier validación que tenga que realizar Dante.
- Un workflow global rojo por infraestructura externa no invalida automáticamente un quality gate verde; ambos estados deben reportarse por separado.

## Retorno

El retorno debe ser compacto, porque GitHub es la evidencia principal. Debe informar:

- misión;
- resultado: `PASS`, `CORRECCIÓN REQUERIDA`, `BLOQUEADO` o `VALIDACIÓN HUMANA PENDIENTE`;
- rama;
- commit SHA;
- PR, si existe;
- checks automáticos relevantes;
- validación manual pendiente;
- riesgos o deuda reales;
- retorno documental realizado o pendiente cuando corresponda.

No copiar logs largos, salvo un error relevante.
