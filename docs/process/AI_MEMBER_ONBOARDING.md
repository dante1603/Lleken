# Onboarding de integrantes con IA

Fecha de creacion: 2026-05-01

Objetivo: que cualquier integrante pueda abrir un chat de IA, decir quien es, y recibir sus tareas actuales sin tener que buscar manualmente en la documentacion.

## Como se usa

El integrante copia uno de estos mensajes al iniciar su chat:

```text
Soy Dante trabajando en Lleken. Lee docs/process/AI_MEMBER_ONBOARDING.md y dime mis tareas actuales, el contexto minimo y que debo entregar esta semana.
```

```text
Soy Matyas trabajando en Lleken. Lee docs/process/AI_MEMBER_ONBOARDING.md y dime mis tareas actuales, el contexto minimo y que debo entregar esta semana.
```

```text
Soy Aikia trabajando en Lleken. Lee docs/process/AI_MEMBER_ONBOARDING.md y dime mis tareas actuales, el contexto minimo y que debo entregar esta semana.
```

```text
Soy Nicolas trabajando en Lleken. Lee docs/process/AI_MEMBER_ONBOARDING.md y dime mis tareas actuales, el contexto minimo y que debo entregar esta semana.
```

## Instrucciones para el chat de IA

Si un integrante dice que es Dante, Matyas, Aikia o Nicolas:

1. Lee este archivo.
2. Lee `TEAM.md`.
3. Lee `WEEKLY_TASKS.md`.
4. Lee el briefing correspondiente en `member_briefs/`.
5. Resume solo lo que esa persona necesita saber.
6. Muestra sus tareas de esta semana, con prioridad y criterio de aceptacion.
7. Si pregunta "que hay disponible", muestra tareas disponibles para tomar, filtradas por su rol.
8. Pregunta una sola cosa si falta informacion para empezar.
9. No le pidas revisar todo el repo si no es necesario.

## Documentos base que el chat debe conocer

- `TEAM.md`: roles y responsabilidades.
- `TASK_SYSTEM.md`: reglas estaticas del sistema de tareas.
- `WEEKLY_TASKS.md`: tareas actuales por integrante.
- `../product/REQUISITOS_BETA_1.md`: alcance real de Beta 1.
- `../current/DATABASE_STATE.md`: estado real de Firebase/Supabase.
- `../current/PROJECT_STATUS.md`: contexto general y foco de mayo.

## Reglas de respuesta para cada integrante

### Dante

El chat debe ayudarlo a:

- decidir prioridad;
- mantener alcance;
- revisar narrativa de producto;
- convertir ideas grandes en roadmap;
- evitar que Beta 1 crezca demasiado.

No debe hundirlo en detalles tecnicos salvo que Dante los pida.

### Matyas

El chat debe ayudarlo a:

- revisar arquitectura y backend;
- aclarar Firebase/Supabase;
- validar reglas, deploy y errores;
- convertir tareas tecnicas en pasos verificables.

Debe distinguir estado actual de migraciones futuras.

### Aikia

El chat debe ayudarla a:

- transformar requisitos en mensajes claros;
- preparar pauta de feedback;
- revisar landing, marca, pantallas y textos;
- detectar sobrepromesas comerciales.

Debe hablar en terminos de usuario, validacion y comunicacion.

### Nicolas

El chat debe ayudarlo a:

- probar la app como usuario;
- detectar fricciones visuales;
- revisar mobile;
- reportar problemas con capturas/rutas/pasos.

Debe darle listas concretas, no explicaciones largas.

## Formato esperado de salida del chat

Cuando un integrante se identifique, el chat debe responder asi:

```md
## Hola, [Nombre]

Tu foco esta semana:

- ...

Tus tareas:

| Prioridad | Tarea | Criterio de aceptacion | Evidencia |
|---|---|---|---|
| P0 | ... | ... | ... |

Tareas disponibles que calzan contigo:

| Prioridad | Tarea disponible | Por que calza contigo |
|---|---|---|
| P1 | ... | ... |

Contexto minimo:

- ...

Primer paso recomendado:

- ...

Pregunta necesaria:

- ...
```

## Regla anti-caos

Si el integrante trae una idea nueva, el chat no debe cambiar automaticamente el sprint. Debe clasificarla:

- entra esta semana;
- va al backlog;
- requiere decision de Dante;
- contradice Beta 1;
- pertenece a vision futura.

## Tareas asignadas vs disponibles

Cuando el integrante pregunte "que me toca hoy":

- mostrar solo tareas asignadas a su nombre en `WEEKLY_TASKS.md`;
- incluir maximo 3 tareas;
- ordenar por prioridad;
- terminar con un primer paso concreto.

Cuando pregunte "que hay disponible para tomar":

- mostrar tareas de la seccion "Tareas disponibles para tomar";
- filtrar por perfil sugerido;
- aclarar si debe avisar antes de tomarla;
- pedir que confirme cual toma para marcar responsable.

## Fuente de verdad

La fuente de verdad semanal es `WEEKLY_TASKS.md`.

Si hay contradiccion entre documentos:

1. `WEEKLY_TASKS.md` manda para tareas de esta semana.
2. `REQUISITOS_BETA_1.md` manda para alcance de Beta 1.
3. `DATABASE_STATE.md` manda para base de datos.
4. `REQUISITOS.md` manda solo como vision amplia.
