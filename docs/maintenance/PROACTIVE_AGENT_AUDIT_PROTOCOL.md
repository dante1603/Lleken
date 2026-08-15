# Protocolo de auditoria proactiva para agentes

Fecha: 2026-06-02.

## Proposito

Permitir que un agente proponga mejoras utiles para Lleken sin transformar una auditoria en cambios de codigo no aprobados.

## Cuando usar

Usar este protocolo si el usuario pide:

- revisar oportunidades;
- detectar docs obsoletos;
- mejorar workflow de agentes;
- reducir contexto;
- encontrar sistemas a medio conectar;
- preparar tareas para otro agente.

## Regla principal

Una auditoria proactiva produce hallazgos aprobables. No implementa codigo, renombres, dependencias ni cambios de comportamiento sin aprobacion explicita.

## Ruta minima

1. Leer `AGENTS.md`.
2. Leer `docs/README_DOCS_INDEX.md`.
3. Leer `docs/ai-inbox/DAILY_BRIEF.md`.
4. Leer `docs/ai-inbox/PENDING_TASKS.md` si se van a crear o tomar tareas.
5. Abrir docs largos solo si el hallazgo lo necesita.

## Superficies recomendadas

- Continuidad: `docs/ai-inbox/*`, `docs/process/CHECKPOINTS.md`, `docs/process/WEEKLY_EXECUTION.md`.
- Estado real: `docs/current/APP_OVERVIEW.md`, `docs/current/DATABASE_STATE.md`, `docs/current/PROJECT_STATUS.md`.
- Beta UX: `docs/product/BETA_UX_AND_TESTING_PLAN.md`, `docs/process/NEXT_CHAT_HANDOFF.md`.
- Arquitectura y datos: `docs/architecture/*`, `supabase/migrations/*`.
- Diagramas: `docs/architecture/diagrams/*`.

## Formato de hallazgo

```md
### N. Titulo corto

- **Urgencia:** U1/U2/U3/U4 - motivo.
- **Dificultad:** D1/D2/D3/D4 - motivo.
- **Categoria:** docs vs codigo | continuidad | AI context | technical optimization | half-connected system.
- **Evidencia:** archivos y lineas observadas.
- **Problema:** brecha concreta.
- **Propuesta:** corte minimo y verificable.
- **Fuera de alcance:** que no se debe tocar.
- **Criterio de aceptacion:** resultado observable.
- **Comandos de verificacion:** comandos o "no aplica; docs-only".
- **Requiere aprobacion:** si/no y motivo.
- **Prompt delegable:** prompt corto para otro agente.
```

## Cierre obligatorio

Antes de terminar:

- registrar archivos revisados;
- registrar comandos ejecutados;
- si queda deuda o decision abierta, crear o actualizar una tarea en `docs/ai-inbox/PENDING_TASKS.md`;
- declarar si fue docs-only o si hubo cambios de codigo.

