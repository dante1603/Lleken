# Sistema de tareas del equipo

Fecha de creacion: 2026-05-01

Este documento explica el sistema de tareas. Es informacion relativamente estatica y no deberia cambiar todas las semanas.

La lista viva de tareas esta en `WEEKLY_TASKS.md`.

## Regla central

Una semana = un objetivo principal + entregables verificables.

No se trabaja desde ideas sueltas. Las ideas grandes entran a `../product/REQUISITOS.md` o `../product/ROADMAP.md`; el trabajo semanal entra en `WEEKLY_TASKS.md`.

## Dos tipos de tareas

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

El chat debe responder solo con tareas asignadas a esa persona en `WEEKLY_TASKS.md`.

```text
Soy [Nombre]. Que hay disponible para tomar?
```

El chat debe responder con tareas disponibles, filtrando por rol/capacidad.

```text
Soy [Nombre]. Tengo 30 minutos, que puedo avanzar?
```

El chat debe sugerir una tarea pequena, idealmente de la seccion disponible.

## Estados de tarea

- Disponible: tarea libre para tomar.
- Asignada: tiene responsable definido.
- En progreso: alguien la esta trabajando.
- Bloqueada: necesita decision, permiso o informacion.
- En revision: necesita prueba o feedback.
- Cerrada: cumple criterio de aceptacion.
- Pospuesta: sigue siendo valida, pero no ahora.
- Descartada: ya no aplica.

## Campos recomendados por tarea

Para que luego sea facil mostrar tareas en una interfaz, cada tarea debe tener campos estables:

- `id`
- `semana`
- `tipo`
- `responsable`
- `prioridad`
- `area`
- `estado`
- `titulo`
- `criterio_aceptacion`
- `evidencia`
- `documentos`

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
- prioridad;
- tipo: asignada o disponible.

### 3. Revision

Antes de cerrar la semana:

- revisar demo o captura;
- correr verificaciones tecnicas si hubo codigo;
- recorrer smoke test si afecta flujo principal;
- actualizar docs si cambio alcance;
- mover tareas no cerradas a la semana siguiente o descartarlas.
