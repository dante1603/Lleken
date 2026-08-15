# Skill portable para documentacion eficiente con agentes IA

Fecha: 2026-06-02.

## Proposito

Este paquete permite copiar a otro proyecto el sistema documental que hace eficiente a `Sistema_terraformacion`: lectura inicial corta, bandeja diaria, backlog delegable, reglas de alcance, auditoria proactiva y cierre con continuidad.

La recomendacion practica es usar **una skill portable** como pieza central, y acompanarla con cuatro archivos del repo destino:

- `AGENTS.md`: reglas operativas para agentes.
- `docs/README_DOCS_INDEX.md`: router de lectura minima.
- `docs/ai-inbox/DAILY_BRIEF.md`: estado corto del dia.
- `docs/ai-inbox/PENDING_TASKS.md`: backlog activo delegable, no historial.

La skill no reemplaza esos archivos. La skill ensena al agente a usarlos sin releer todo el repositorio.

## Estructura minima para copiar

```txt
target-project/
  AGENTS.md
  docs/
    README_DOCS_INDEX.md
    ai-inbox/
      DAILY_BRIEF.md
      PENDING_TASKS.md
    maintenance/
      PROACTIVE_AGENT_AUDIT_PROTOCOL.md
      CONTEXT_EFFICIENT_NAMING_STANDARD.md
      STRUCTURAL_REFACTOR_HISTORY.md
  skills/
    project-docs-workflow/
      SKILL.md
```

Si el proyecto destino no usa skills instalables, crea solo `docs/maintenance/PROJECT_DOCS_WORKFLOW.md` con el contenido de `SKILL.md` y enlazalo desde `AGENTS.md`.

## Skill lista para extraer

Copiar este bloque como `skills/project-docs-workflow/SKILL.md` o adaptarlo al formato de skills del entorno.

```md
---
name: project-docs-workflow
description: Use when working in this repo with AI agents and the task needs efficient documentation routing, docs-first preservation, proactive audits, delegate-ready backlog items, or session handoff continuity without reading the whole repository.
---

# Project Docs Workflow

## When to use

Use this skill when the user asks to:

- preserve an idea, decision, design, study, bug report, playtest note, or external context in repo docs;
- update the daily brief or active backlog;
- run a proactive audit for opportunities, stale docs, half-connected systems, context reduction, or agent workflow improvements;
- prepare a task for another agent;
- close a session with clear pending work and verification status.

Do not use this skill as permission to edit source code, rename files, change dependencies, or implement behavior. Code changes require explicit user approval and the repo's engineering rules.

## Reading route

1. Read `AGENTS.md`.
2. Read `docs/README_DOCS_INDEX.md`.
3. Read `docs/ai-inbox/DAILY_BRIEF.md`.
4. Read `docs/ai-inbox/PENDING_TASKS.md` only if you will take or create a delegable task.
5. Open long docs only when the index, brief, task, or user request points to them.

## Core rules

- Keep the first answer grounded in the current repo, not in generic advice.
- Prefer one focused doc artifact over broad documentation churn.
- Keep `PENDING_TASKS.md` as active backlog only; move completed history elsewhere.
- Every future task must include file target, objective, out-of-scope limits, verification commands, and acceptance criteria.
- For proactive work, produce findings that need approval. Do not implement them automatically.
- For context optimization, prefer maps, aliases, indexes, or skills before filesystem renames.
- Always record commands executed and results in the brief, report, or handoff.

## Docs-first workflow

1. Identify whether the user wants documentation, planning, implementation, or review.
2. If documentation/planning: inspect only the smallest current-code or current-doc surface needed to avoid stale claims.
3. Create or update the correct artifact:
   - `docs/maintenance/` for durable standards, protocols, maps, specs, and audit reports.
   - `docs/ai-inbox/` for daily state, short handoffs, and active tasks.
   - domain docs for product, architecture, design, or canon if the repo has them.
4. If the work implies a next step, add or update one task in `docs/ai-inbox/PENDING_TASKS.md`.
5. If no future work remains, say that explicitly in the handoff.

## Proactive audit workflow

Use when the user asks for opportunities, optimizations, context reduction, stale-doc cleanup, or systems a medias.

1. Pick one audit surface; do not sweep the whole repo without focus.
2. Read `docs/maintenance/PROACTIVE_AGENT_AUDIT_PROTOCOL.md` if it exists.
3. Search docs and code only enough to prove each finding.
4. Write findings as approvable work, not as implemented changes.
5. Queue only actionable findings into `PENDING_TASKS.md`.
6. Run the repo's task validation command if backlog metadata changed.

Finding format:

```md
### N) Short finding title

- **Urgency:** U1/U2/U3/U4 - reason.
- **Difficulty:** D1/D2/D3/D4 - reason.
- **Category:** half-connected system | AI context | skill | technical optimization | docs vs code.
- **Fields to study:** domain, guide docs, architecture risks.
- **Guide file:** path.
- **Affected domain:** concrete area.
- **Initial target files:** 1-6 paths.
- **Detected problem:** observed gap.
- **Proposal:** smallest safe cut.
- **Out of scope:** what not to touch.
- **Architecture criterion:** verifiable rule.
- **Acceptance criterion:** observable result.
- **Verification commands:** commands or "not applicable; docs-only".
- **Requires approval:** yes/no and why.
- **Suggested short prompt:** copyable delegation prompt.
```

## Handoff checklist

Before finishing:

- State files changed.
- State commands run and result.
- State verification that could not run and why.
- Apply continuity: any pending verification, open decision, debt, or next cut must be in `PENDING_TASKS.md`.
- If the task was docs-only, say that no source code was changed.
```

## Plantillas minimas del repo destino

### `AGENTS.md`

```md
# AGENTS

## Ruta de lectura eficiente

1. Lee `docs/README_DOCS_INDEX.md`.
2. Lee `docs/ai-inbox/DAILY_BRIEF.md`.
3. Lee `docs/ai-inbox/PENDING_TASKS.md` solo si vas a tomar o crear una tarea delegable.
4. Abre documentos largos solo cuando la tarea los cite.

## Alcance documental

- Las automatizaciones de brief pueden editar `docs/ai-inbox/*`, `docs/maintenance/*` y este archivo si hace falta una regla operativa.
- No editar codigo, dependencias, imports, nombres de archivos, carpetas ni comportamiento sin aprobacion explicita.
- El brief debe ser corto y accionable: estado, hallazgos, zonas confusas y 1-3 tareas concretas.

## Tareas delegables

Cada tarea recomendada debe incluir:

- archivo guia;
- dominio afectado;
- objetivo;
- fuera de alcance;
- criterio de aceptacion;
- comandos de verificacion.

## Continuidad

No cierres una tarea dejando trabajo a medias sin registrarlo. Si queda una verificacion pendiente, decision abierta, deuda detectada o siguiente corte, crea o actualiza una tarea en `docs/ai-inbox/PENDING_TASKS.md`.
```

### `docs/README_DOCS_INDEX.md`

```md
# Indice rapido para agentes IA

Objetivo: reducir lectura inicial. Un agente nuevo no debe recorrer todo `docs/`.

## Lectura minima

1. `AGENTS.md` - reglas operativas y comandos.
2. `docs/ai-inbox/DAILY_BRIEF.md` - estado reciente.
3. `docs/ai-inbox/PENDING_TASKS.md` - solo si tomaras una tarea.
4. Documento maestro del proyecto - vision, estado real y limites.

## Leer segun dominio

- `[doc de arquitectura]` - si la tarea toca arquitectura o codigo.
- `[doc de producto]` - si la tarea toca vision, roadmap o decisiones.
- `[doc de mantenimiento]` - si la tarea toca auditorias, contexto o deuda.

## Regla

Abre documentos largos solo cuando esta ruta, el brief o la tarea los cite.
```

### `docs/ai-inbox/DAILY_BRIEF.md`

```md
# Daily Brief

Fecha: YYYY-MM-DD.

## Estado

- Estado corto del proyecto.
- Cambios recientes que afectan a agentes.
- Riesgos o advertencias actuales.

## Que se reviso

- `archivo` -> motivo.

## Que cambio

- Cambio documental o tecnico reciente.

## Zonas confusas para IA

- Confusion frecuente y regla correcta.

## Tareas recomendadas para hoy

1. **Titulo**
   - **Archivo objetivo:** `path`.
   - **Objetivo:** cambio esperado.
   - **Criterio de aceptacion:** resultado observable.

## Comandos ejecutados recientemente

- `comando` -> PASS/FAIL, resumen.
```

### `docs/ai-inbox/PENDING_TASKS.md`

```md
# Pending Tasks

Backlog activo y listo para delegar. No guardar historial completado aqui.

## Como priorizar

- U1 - Critica: bloquea trabajo cercano.
- U2 - Alta: habilita varias tareas o reduce riesgo importante.
- U3 - Media: mejora orden o capacidad futura.
- U4 - Baja: conservar, pero puede esperar.

## Como delegar por dificultad

- D1 - Baja: documental o cambio pequeno.
- D2 - Media: requiere 1-2 docs o dominio acotado.
- D3 - Alta: requiere criterio tecnico o varios archivos.
- D4 - Muy alta: partir antes de delegar.

### N) Titulo de tarea

- **Urgencia:** U2 - motivo.
- **Dificultad:** D2 - motivo.
- **Campos a estudiar:** dominio, docs guia, riesgos.
- **Archivo guia:** `path`.
- **Dominio afectado:** area.
- **Archivos objetivo iniciales:** `path`.
- **Objetivo:** cambio esperado.
- **Fuera de alcance:** limites.
- **Criterio de arquitectura:** regla verificable.
- **Criterio de aceptacion:** resultado observable.
- **Comandos de verificacion:** `comando`.
- **Prompt corto sugerido:** "Prompt delegable."
```

## Checklist de adaptacion a otro proyecto

1. Crear las carpetas `docs/ai-inbox/` y `docs/maintenance/`.
2. Crear el indice rapido con 3-8 lecturas maximas, no un catalogo completo.
3. Crear un brief diario corto con estado, cambios recientes, zonas confusas y comandos.
4. Convertir el backlog a tareas activas con criterios de aceptacion verificables.
5. Mover historial completado a `docs/maintenance/STRUCTURAL_REFACTOR_HISTORY.md` o equivalente.
6. Crear la skill `project-docs-workflow` y enlazarla desde `AGENTS.md`.
7. Definir los comandos de calidad reales del proyecto destino.
8. Hacer un primer pase de prueba: una tarea docs-only, una tarea delegable y un cierre con continuidad.

## Buenas practicas que se deben conservar

- El indice no es enciclopedia; es router.
- El brief no es historial largo; es estado operativo.
- El backlog no es cementerio; es trabajo activo.
- Las tareas delegables deben tener limites y criterios de aceptacion.
- Los docs largos viven por dominio y se abren bajo demanda.
- Las auditorias proactivas proponen hallazgos, no implementan sin permiso.
- Si queda algo pendiente, debe quedar escrito antes del cierre.
- Las reglas de agentes deben proteger el repo de cambios amplios impulsivos.

## Criterio de aceptacion del sistema

El sistema esta bien configurado si un agente nuevo puede:

- arrancar leyendo menos de cinco archivos;
- saber que no debe leer todo el repo;
- distinguir documentacion, planificacion, implementacion y review;
- crear una tarea delegable sin pedir contexto extra innecesario;
- registrar comandos y verificaciones;
- cerrar sin perder trabajo futuro.

## Comandos ejecutados para crear este paquete

- `Get-Content C:\Users\GLADIS\.codex\skills\.system\skill-creator\SKILL.md` -> PASS, guia de skills revisada.
- `Get-Content docs\README_DOCS_INDEX.md` -> PASS, ruta de lectura eficiente revisada.
- `Get-Content docs\ai-inbox\DAILY_BRIEF.md` -> PASS, formato de brief revisado.
- `Get-Content docs\ai-inbox\PENDING_TASKS.md` -> PASS, backlog activo y tarea 25 revisados.
- `Get-Content docs\maintenance\PROACTIVE_AGENT_AUDIT_PROTOCOL.md` -> PASS, reglas de auditoria proactiva revisadas.
- `Get-Content docs\maintenance\CONTEXT_EFFICIENT_NAMING_STANDARD.md` -> PASS, politica de nombres/rutas revisada.
- `Get-Content C:\Users\GLADIS\.codex\memories\skills\sistema-terraformacion-docs-first-spec\SKILL.md` -> PASS, patron docs-first revisado.
- `Get-Content C:\Users\GLADIS\.codex\memories\skills\sistema-terraformacion-proactive-docs-audit\SKILL.md` -> PASS, patron de auditoria proactiva revisado.
