# Tareas semanales

Fuente viva de tareas del equipo.

Guia del sistema: `TASK_SYSTEM.md`
Onboarding con IA: `AI_MEMBER_ONBOARDING.md`
Dashboard navegador: `task-dashboard.html`
Datos estructurados: `tasks.json`

## Semana 2026-05-01 a 2026-05-07

Objetivo principal:

- Preparar base documental y operativa para una Beta 1 enfocada en cuidado individual robusto.

Fuera de alcance:

- Implementar jardines completos.
- Implementar invitaciones reales.
- Migrar a Supabase sin spike previo.
- Implementar historias avanzadas.
- Implementar hardware IoT.

## Vista por responsable

### Dante

| ID | Tipo | Prioridad | Area | Tarea | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| W01-DAN-01 | Asignada | P0 | Producto | Mantener y cerrar documento de requisitos funcionales/no funcionales | `REQUISITOS.md` queda como vision maestra y `REQUISITOS_BETA_1.md` como alcance ejecutable | Docs actualizados y revisables por Aikia/equipo | Asignada |
| W01-DAN-02 | Asignada | P0 | Producto | Validar `REQUISITOS_BETA_1.md` contra la vision del producto | El documento separa bien Beta 1 de vision futura | Comentarios o aprobacion en docs/chat | Asignada |
| W01-DAN-03 | Asignada | P0 | Beta | Definir cantidad y perfil de testers Beta 1 | Hay una lista inicial de testers o criterio de seleccion | Nota en `PROJECT_STATUS.md` o doc de beta | Backlog |
| W01-DAN-04 | Asignada | P1 | Narrativa | Revisar narrativa PAC vs beta individual | Queda claro que PAC es vision/piloto, aunque Beta 1 prueba cuidado individual | Ajuste en roadmap/status si hace falta | Backlog |

### Matyas

| ID | Tipo | Prioridad | Area | Tarea | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| W01-MAT-01 | Asignada | P0 | Base de datos | Revisar `DATABASE_STATE.md` y confirmar estrategia Firebase/Supabase para Beta 1 | Decision Firebase/Supabase queda clara para el equipo | Comentario/aprobacion o correccion del doc | Asignada |
| W01-MAT-02 | Asignada | P0 | Supabase | Ejecutar spike Supabase minimo | Login Google + tabla plants + Storage + RLS basica funcionan o se documenta bloqueo | Nota tecnica con decision migrar/no migrar | Backlog |
| W01-MAT-03 | Asignada | P0 | Firebase | Verificar deploy de reglas a base nombrada | Firestore/Storage rules estan desplegadas al proyecto correcto | Captura/log o nota de validacion | Backlog |
| W01-MAT-04 | Asignada | P1 | QA tecnico | Probar flujo con una planta desde cuenta real | Planta creada, foto subida, ficha abre, calendario responde | Nota de prueba o issue con errores | Backlog |

### Aikia

| ID | Tipo | Prioridad | Area | Tarea | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| W01-AIK-01 | Asignada | P0 | Marketing | Trabajar landing page de Lleken | Existe primera version de landing con propuesta de valor clara y sin sobreprometer features futuras | Link, captura o archivo de avance | Asignada |
| W01-AIK-02 | Asignada | P0 | Marca | Disenar primer logo oficial de Lleken | Hay primera propuesta visual de logo para revisar con el equipo | Imagen, Figma, captura o archivo fuente | Asignada |
| W01-AIK-03 | Asignada | P1 | Diagramas | Apoyar diagrama de casos de uso | Aikia revisa o propone mejoras visuales/claridad para `casos-de-uso.md` | Comentarios o version ajustada del diagrama | Asignada |
| W01-AIK-04 | Asignada | P1 | UX Writing | Revisar claridad de mensajes para Beta 1 | Un usuario no tecnico entiende que hacer con la planta | Lista de textos/fricciones | Backlog |
| W01-AIK-05 | Asignada | P1 | Beta | Preparar pauta simple de feedback para testers | Existe formulario o pauta de 5-8 preguntas | Doc o formulario enlazado | Backlog |
| W01-AIK-06 | Asignada | P1 | Marketing | Revisar si landing promete solo lo que existe o marca futuro | Landing no sobrepromete jardines/hardware como listo | Comentarios o cambios propuestos | Asignada |

### Nicolas

| ID | Tipo | Prioridad | Area | Tarea | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| W01-NIC-01 | Asignada | P0 | QA mobile | Recorrer flujo mobile como tester no tecnico | Detecta pasos confusos, textos cortados o pantallas trabadas | Lista de fricciones con pantalla/ruta | Backlog |
| W01-NIC-02 | Asignada | P1 | UI | Revisar consistencia visual de ficha y calendario | Identifica problemas visuales del flujo principal | Nota con observaciones | Backlog |
| W01-NIC-03 | Asignada | P1 | QA | Ejecutar smoke test manual cuando este actualizado | Smoke test recorrido completo | Checklist marcado | Backlog |

## Tareas disponibles para tomar

| ID | Tipo | Prioridad | Perfil sugerido | Area | Tarea | Criterio de aceptacion | Evidencia | Estado |
|---|---|---|---|---|---|---|---|---|
| W01-DISP-01 | Disponible | P1 | Dante / Aikia / Nicolas | Producto | Revisar `REQUISITOS.md` y marcar que pertenece a Beta 1, Beta 2 o futuro | Queda una lista de requisitos clasificados por fase | Nota o PR de docs | Disponible |
| W01-DISP-02 | Disponible | P1 | Nicolas / Aikia | QA mobile | Preparar checklist de prueba mobile de 15 minutos | Existe una lista corta para probar login, nueva planta, ficha y calendario | Doc o seccion en smoke test | Disponible |
| W01-DISP-03 | Disponible | P2 | Aikia / Nicolas | UX Writing | Revisar textos de error visibles para usuario | Hay lista de textos confusos y propuesta simple | Nota con rutas/pantallas | Disponible |
| W01-DISP-04 | Disponible | P2 | Aikia / Dante | Producto | Revisar si el plan gratis esta explicado en UI | Se sabe si el usuario entiende el limite de 3 plantas | Nota de UX | Disponible |
| W01-DISP-05 | Disponible | P2 | Cualquier integrante | Documentacion | Buscar inconsistencias entre `REQUISITOS_BETA_1.md` y `PROJECT_STATUS.md` | No quedan contradicciones obvias de alcance | Comentarios o ajuste docs | Disponible |
| W01-DISP-06 | Disponible | P1 | Matyas / Dante | Arquitectura | Dibujar schema Supabase ideal en borrador | Existe primer ER para profiles, plants, plant_images, plant_events | Diagrama o nota en architecture | Disponible |

## Registro YAML experimental

Este bloque duplica las tareas en un formato mas facil de parsear por scripts o futuras interfaces.

```yaml
week: 2026-05-01_to_2026-05-07
goal: Preparar base documental y operativa para Beta 1 de cuidado individual robusto.
tasks:
  - id: W01-DAN-01
    type: assigned
    owner: Dante
    priority: P0
    area: Producto
    status: Asignada
    title: Mantener y cerrar documento de requisitos funcionales/no funcionales
    acceptance: REQUISITOS.md queda como vision maestra y REQUISITOS_BETA_1.md como alcance ejecutable.
    evidence: Docs actualizados y revisables por Aikia/equipo.
  - id: W01-MAT-02
    type: assigned
    owner: Matyas
    priority: P0
    area: Supabase
    status: Backlog
    title: Ejecutar spike Supabase minimo
    acceptance: Login Google + tabla plants + Storage + RLS basica funcionan o se documenta bloqueo.
    evidence: Nota tecnica con decision migrar/no migrar.
  - id: W01-AIK-01
    type: assigned
    owner: Aikia
    priority: P0
    area: Marketing
    status: Asignada
    title: Trabajar landing page de Lleken
    acceptance: Primera version de landing con propuesta de valor clara y sin sobreprometer features futuras.
    evidence: Link, captura o archivo de avance.
  - id: W01-AIK-02
    type: assigned
    owner: Aikia
    priority: P0
    area: Marca
    status: Asignada
    title: Disenar primer logo oficial de Lleken
    acceptance: Primera propuesta visual de logo para revisar con el equipo.
    evidence: Imagen, Figma, captura o archivo fuente.
  - id: W01-NIC-01
    type: assigned
    owner: Nicolas
    priority: P0
    area: QA mobile
    status: Backlog
    title: Recorrer flujo mobile como tester no tecnico
    acceptance: Detecta pasos confusos, textos cortados o pantallas trabadas.
    evidence: Lista de fricciones con pantalla/ruta.
```
