# AGENTS

## Ruta de lectura eficiente

1. Lee `docs/README_DOCS_INDEX.md`.
2. Lee `docs/ai-inbox/DAILY_BRIEF.md` para estado corto y foco inmediato.
3. Lee `docs/ai-inbox/PENDING_TASKS.md` solo si vas a tomar o crear una tarea delegable.
4. Lee `docs/current/APP_OVERVIEW.md` si necesitas arquitectura vigente.
5. Lee `docs/current/DATABASE_STATE.md` si la tarea toca datos, Auth, Storage o Supabase.
6. Lee `docs/process/PORTABLE_AI_DOCUMENTATION_WORKFLOW_SKILL.md` si vas a ordenar documentacion, preparar handoffs, crear tareas delegables o mejorar el flujo de agentes.
7. Abre documentos largos solo cuando la tarea los cite.

## Alcance y continuidad

- No edites codigo, dependencias, imports, rutas o comportamiento sin aprobacion explicita cuando el pedido sea solo documental.
- Para cambios de codigo, usa `npm run check` como verificacion principal.
- Para cambios solo de documentacion, verifica que `docs/INDEX.md` y `docs/README_DOCS_INDEX.md` sigan enlazando las rutas principales.
- Si queda una verificacion pendiente, decision abierta o siguiente corte necesario, registralo en `docs/ai-inbox/PENDING_TASKS.md`, `docs/ai-inbox/DAILY_BRIEF.md`, `docs/process/CHECKPOINTS.md` o el documento de proceso que corresponda antes del handoff final.
- No asumir Firebase como fuente operativa actual. Para estado real de datos manda `docs/current/DATABASE_STATE.md`.

## Handoff

Al terminar, resume archivos modificados, comandos ejecutados y verificaciones pendientes. Si no queda trabajo futuro, declaralo explicitamente.
