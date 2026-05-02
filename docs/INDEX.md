# Documentacion de Lleken

Este indice es el punto de entrada para encontrar la documentacion del proyecto.

## Lectura rapida

Si llegas nuevo al proyecto, lee en este orden:

1. `../README.md` - que es Lleken y como correrlo en local.
2. `process/CHECKPOINTS.md` - estado actual, checkpoint activo y siguiente trabajo recomendado.
3. `current/APP_OVERVIEW.md` - arquitectura y funcionalidad actuales.
4. `process/WORKFLOW.md` - reglas de trabajo y definicion de listo.

## Estructura

```text
docs/
  INDEX.md
  current/        # verdad tecnica actual del producto
  process/        # forma de trabajo, checkpoints, QA y equipo
  product/        # vision, roadmap e investigacion de producto/dominio
  architecture/   # plan tecnico futuro y diagramas
  archive/        # referencias historicas o material ya integrado
```

## Documentos activos

### Estado tecnico actual

- `current/APP_OVERVIEW.md` - arquitectura, rutas, modelo de datos, backend, tests y deuda vigente.
- `current/PROJECT_STATUS.md` - estado operativo actual, prioridad de prototipo beta y regla repo/PDF/Drive.
- `current/AI_PIPELINE.md` - separacion entre codigo, IA, clima y persistencia.
- `current/FIREBASE.md` - notas operativas de Firestore, Storage y reglas.
- `current/DATABASE_STATE.md` - estado real de Firebase/Supabase, reglas, Storage y decision recomendada para Beta 1.

### Proceso de trabajo

- `process/CHECKPOINTS.md` - checkpoints C0 en adelante, estado de avance y verificacion esperada.
- `process/WORKFLOW.md` - como avanzar en ciclos cortos sin mezclar frentes.
- `process/TEAM.md` - roles, metodologia de sprints y reglas de equipo.
- `process/TASK_SYSTEM.md` - guia estatica del sistema de tareas.
- `process/WEEKLY_EXECUTION.md` - entrada corta a la ejecucion semanal.
- `process/WEEKLY_TASKS.md` - tareas semanales vivas, asignadas y disponibles para tomar.
- `process/task-dashboard.html` - dashboard simple para ver tareas en el navegador.
- `process/tasks.json` - datos estructurados de tareas para futuras interfaces.
- `process/AI_MEMBER_ONBOARDING.md` - protocolo para que cada integrante use un chat de IA y reciba sus tareas.
- `process/SMOKE_TEST.md` - checklist manual antes de deploy o demo.
- `process/SUPABASE_HUMAN_TASKS.md` - tareas humanas para configurar Supabase, Google Auth y pruebas Postman.

### Producto e investigacion

- `product/ROADMAP.md` - vision de producto, brechas y pasos grandes.
- `product/REQUISITOS.md` - vision maestra de requisitos y evolucion del producto.
- `product/REQUISITOS_BETA_1.md` - alcance recortado para primera beta de cuidado individual robusto.
- `product/BUSINESS_PLAN.md` - modelo de negocio, segmentos, validacion y riesgos comerciales.
- `product/PLANT_CARE_RESEARCH.md` - investigacion botanica y reglas de cuidado.

### Arquitectura futura

- `architecture/PLAN_ARQUITECTURA.md` - diagnostico del modelo actual y evolucion propuesta.
- `architecture/DATABASE_MIGRATION_PLAN.md` - dimensionamiento de Firebase vs Supabase y spike recomendado.
- `architecture/DATA_AI_SUPABASE_PLAN.md` - comparacion y plan refinado para modelo relacional, ingesta IA y recomendacion.
- `architecture/SUPABASE_TEST_PLAN.md` - plan de pruebas por capas para Auth, RLS, Storage, eventos e IA.
- `architecture/diagrams/` - diagramas Mermaid actuales y futuros: casos de uso, flujos, componentes, secuencias, ER, estados y clases.

### Archivo

- `archive/nuevaplanta.md` - referencia visual/historica del flujo nueva planta, ya integrada en el producto.

## Regla de ubicacion

- Si describe como funciona el producto hoy, va en `current/`.
- Si describe como trabaja el equipo, va en `process/`.
- Si describe vision, usuarios, negocio o investigacion, va en `product/`.
- Si describe cambios tecnicos futuros, va en `architecture/`.
- Si ya no es fuente activa pero conviene conservarlo, va en `archive/`.

## Relacion con Google Drive

Google Drive queda como referencia de solo lectura mientras no tengamos edicion confiable. Este directorio conserva la verdad tecnica que vive cerca del codigo; las entregas para compartir fuera del repo se exportaran a PDF.
