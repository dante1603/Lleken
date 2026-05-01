# Sistema semanal de ejecucion del equipo

Fecha de creacion: 2026-05-01

Objetivo: que cada integrante pueda abrir la documentacion y saber que debe hacer esta semana, por que importa, como se verifica y donde dejar evidencia.

## Regla central

Una semana = un objetivo principal + entregables verificables.

No se trabaja desde ideas sueltas. Las ideas grandes entran a `../product/REQUISITOS.md` o `../product/ROADMAP.md`; el trabajo semanal entra aca.

## Dos tipos de tareas

El sistema maneja dos formas de trabajo:

### 1. Tareas asignadas

Tienen responsable definido desde el inicio.

Se usan cuando:

- la tarea depende del rol de una persona;
- hay una fecha o bloqueo claro;
- alguien debe responder por el cierre;
- el trabajo toca una zona sensible del proyecto.

Ejemplo:

- Matyas verifica reglas Firebase.
- Aikia prepara pauta de feedback.
- Nicolas recorre el flujo mobile.
- Dante aprueba alcance Beta 1.

### 2. Tareas disponibles para tomar

No tienen responsable fijo todavia.

Se usan cuando:

- son utiles pero no bloquean;
- cualquier integrante puede ayudar;
- sirven para avanzar si alguien tiene tiempo;
- son buenas tareas de aprendizaje.

Regla:

- Nadie toma una tarea disponible sin marcarse como responsable.
- Si una tarea disponible toca codigo o decisiones de producto, debe avisarse antes de ejecutarla.
- Si alguien la toma, pasa de "Disponible" a "Asignada".

## Preguntas que puede hacer cada integrante a su IA

```text
Soy [Nombre]. Que me toca hoy?
```

El chat debe responder solo con tareas asignadas a esa persona.

```text
Soy [Nombre]. Que hay disponible para tomar?
```

El chat debe responder con tareas disponibles, filtrando por el rol/capacidad de esa persona.

```text
Soy [Nombre]. Tengo 30 minutos, que puedo avanzar?
```

El chat debe sugerir una tarea pequena, idealmente de la seccion disponible.

## Documentos de entrada

- Vision maestra: `../product/REQUISITOS.md`
- Alcance Beta 1: `../product/REQUISITOS_BETA_1.md`
- Estado del proyecto: `../current/PROJECT_STATUS.md`
- Estado de base de datos: `../current/DATABASE_STATE.md`
- Equipo y roles: `TEAM.md`
- Smoke test: `SMOKE_TEST.md`
- Checkpoints: `CHECKPOINTS.md`

## Flujo semanal

### 1. Planificacion

Duracion sugerida: 45-60 minutos.

Preguntas:

- Cual es el objetivo principal de la semana?
- Que queda explicitamente fuera?
- Que necesita Dante para decidir?
- Que necesita Matyas para no bloquearse?
- Que necesita Aikia para comunicar/probar?
- Que necesita Nicolas para revisar y encontrar fricciones?

### 2. Ejecucion

Cada tarea debe tener:

- responsable;
- objetivo;
- archivo/ruta/documento afectado;
- criterio de aceptacion;
- evidencia esperada;
- prioridad.
- tipo: asignada o disponible.

### 3. Revision

Antes de cerrar la semana:

- revisar demo o captura;
- correr verificaciones tecnicas si hubo codigo;
- recorrer smoke test si afecta flujo principal;
- actualizar docs si cambio alcance;
- mover tareas no cerradas a la semana siguiente o descartarlas.

## Estados de tarea

- Backlog: idea o tarea no comprometida.
- Lista: entra esta semana si hay capacidad.
- En progreso: alguien la esta trabajando.
- Bloqueada: necesita decision, permiso o informacion.
- En revision: necesita prueba o feedback.
- Cerrada: cumple criterio de aceptacion.
- Pospuesta: sigue siendo valida, pero no ahora.
- Descartada: ya no aplica.

## Plantilla semanal

Copiar esta plantilla al final del archivo para cada semana nueva.

```md
## Semana YYYY-MM-DD a YYYY-MM-DD

Objetivo principal:

- 

Fuera de alcance:

- 

### Dante

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
|  |  |  |  | Backlog |

### Matyas

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
|  |  |  |  | Backlog |

### Aikia

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
|  |  |  |  | Backlog |

### Nicolas

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
|  |  |  |  | Backlog |

Decision de cierre:

- 

### Tareas disponibles para tomar

| Tarea | Prioridad | Perfil sugerido | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|---|
|  |  |  |  |  | Disponible |
```

## Semana 2026-05-01 a 2026-05-07

Objetivo principal:

- Preparar base documental y operativa para una Beta 1 enfocada en cuidado individual robusto.

Fuera de alcance:

- Implementar jardines completos.
- Implementar invitaciones reales.
- Migrar a Supabase.
- Implementar historias avanzadas.
- Implementar hardware IoT.

### Dante

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
| Mantener y cerrar documento de requisitos funcionales/no funcionales | P0 | `REQUISITOS.md` queda como vision maestra y `REQUISITOS_BETA_1.md` como alcance ejecutable | Docs actualizados y revisables por Aikia/equipo | Asignada |
| Validar `REQUISITOS_BETA_1.md` contra la vision del producto | P0 | El documento separa bien Beta 1 de vision futura | Comentarios o aprobacion en docs/chat | Asignada |
| Definir cantidad y perfil de testers Beta 1 | P0 | Hay una lista inicial de testers o criterio de seleccion | Nota en `PROJECT_STATUS.md` o doc de beta | Backlog |
| Revisar narrativa PAC vs beta individual | P1 | Queda claro que PAC es vision/piloto, aunque Beta 1 prueba cuidado individual | Ajuste en roadmap/status si hace falta | Backlog |

### Matyas

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
| Revisar `DATABASE_STATE.md` y confirmar estrategia Firebase para Beta 1 | P0 | Decision Firebase/Supabase queda clara para el equipo | Comentario/aprobacion o correccion del doc | Asignada |
| Ejecutar spike Supabase minimo | P0 | Login Google + tabla plants + Storage + RLS basica funcionan o se documenta bloqueo | Nota tecnica con decision migrar/no migrar | Backlog |
| Verificar deploy de reglas a base nombrada | P0 | Firestore/Storage rules estan desplegadas al proyecto correcto | Captura/log o nota de validacion | Backlog |
| Probar flujo con una planta desde cuenta real | P1 | Planta creada, foto subida, ficha abre, calendario responde | Nota de prueba o issue con errores | Backlog |

### Aikia

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
| Trabajar landing page de Lleken | P0 | Existe primera version de landing con propuesta de valor clara y sin sobreprometer features futuras | Link, captura o archivo de avance | Asignada |
| Disenar primer logo oficial de Lleken | P0 | Hay primera propuesta visual de logo para revisar con el equipo | Imagen, Figma, captura o archivo fuente | Asignada |
| Apoyar diagrama de casos de uso | P1 | Aikia revisa o propone mejoras visuales/claridad para `casos-de-uso.md` | Comentarios o version ajustada del diagrama | Asignada |
| Revisar claridad de mensajes para Beta 1 | P1 | Un usuario no tecnico entiende que hacer con la planta | Lista de textos/fricciones | Backlog |
| Preparar pauta simple de feedback para testers | P1 | Existe formulario o pauta de 5-8 preguntas | Doc o formulario enlazado | Backlog |
| Revisar si landing promete solo lo que existe o marca futuro | P1 | Landing no sobrepromete jardines/hardware como listo | Comentarios o cambios propuestos | Asignada |

### Nicolas

| Tarea | Prioridad | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|
| Recorrer flujo mobile como tester no tecnico | P0 | Detecta pasos confusos, textos cortados o pantallas trabadas | Lista de fricciones con pantalla/ruta | Backlog |
| Revisar consistencia visual de ficha y calendario | P1 | Identifica problemas visuales del flujo principal | Nota con observaciones | Backlog |
| Ejecutar smoke test manual cuando este actualizado | P1 | Smoke test recorrido completo | Checklist marcado | Backlog |

Decision de cierre:

- Esta semana cierra cuando Beta 1 tenga alcance aprobado, estado de base de datos claro y primeras tareas de testeo asignadas.

### Tareas disponibles para tomar

| Tarea | Prioridad | Perfil sugerido | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|---|
| Revisar `REQUISITOS.md` y marcar que pertenece a Beta 1, Beta 2 o futuro | P1 | Dante / Aikia / Nicolas | Queda una lista de requisitos clasificados por fase | Nota o PR de docs | Disponible |
| Preparar checklist de prueba mobile de 15 minutos | P1 | Nicolas / Aikia | Existe una lista corta para probar login, nueva planta, ficha y calendario | Doc o seccion en smoke test | Disponible |
| Revisar textos de error visibles para usuario | P2 | Aikia / Nicolas | Hay lista de textos confusos y propuesta simple | Nota con rutas/pantallas | Disponible |
| Revisar si el plan gratis esta explicado en UI | P2 | Aikia / Dante | Se sabe si el usuario entiende el limite de 3 plantas | Nota de UX | Disponible |
| Buscar inconsistencias entre `REQUISITOS_BETA_1.md` y `PROJECT_STATUS.md` | P2 | Cualquier integrante | No quedan contradicciones obvias de alcance | Comentarios o ajuste docs | Disponible |
| Dibujar schema Supabase ideal en borrador | P1 | Matyas / Dante | Existe primer ER para profiles, plants, plant_images, plant_events | Diagrama o nota en architecture | Disponible |
