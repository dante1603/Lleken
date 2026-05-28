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
- `current/DATABASE_STATE.md` - estado real de Supabase, storage, migraciones, pruebas y Firebase historico.
- `current/FIREBASE.md` - referencia historica de Firestore, Storage y reglas anteriores.

### Proceso de trabajo

- `process/CHECKPOINTS.md` - checkpoints C0 en adelante, estado de avance y verificacion esperada.
- `process/WORKFLOW.md` - como avanzar en ciclos cortos sin mezclar frentes.
- `process/TEAM.md` - roles, metodologia de sprints y reglas de equipo.
- `process/DESIGN_RULES.md` - reglas visuales transversales, incluyendo prohibicion de scrollbars internos visibles.
- `process/TASK_SYSTEM.md` - guia estatica del sistema de tareas.
- `process/WEEKLY_EXECUTION.md` - entrada corta a la ejecucion semanal.
- `process/WEEKLY_TASKS.md` - tareas semanales vivas, asignadas y disponibles para tomar.
- `process/TODAY_2026_05_04.md` - plan operativo del dia: Vercel, Supabase, datos reales PAC y matico.
- `process/task-dashboard.html` - dashboard simple para ver tareas en el navegador.
- `process/tasks.json` - datos estructurados de tareas para futuras interfaces.
- `process/AI_MEMBER_ONBOARDING.md` - protocolo para que cada integrante use un chat de IA y reciba sus tareas.
- `process/SMOKE_TEST.md` - checklist manual antes de deploy o demo.
- `process/VERCEL_SUPABASE_DEPLOY.md` - despliegue inicial con Vercel como hosting/API y Supabase como base.
- `process/SUPABASE_HUMAN_TASKS.md` - tareas humanas para configurar Supabase, Google Auth y pruebas Postman.
- `process/ARCHITECTURE_HARDENING_TRACEABILITY.md` - plan por etapas para integrar mejoras, endurecer creacion de planta, persistir evidencia IA y validar permisos.
- `process/NEXT_CHAT_HANDOFF.md` - traspaso para retomar en otro chat desde anti-popping y UX beta.

### Producto e investigacion

- `product/ROADMAP.md` - vision de producto, brechas y pasos grandes.
- `product/REQUISITOS.md` - vision maestra de requisitos y evolucion del producto.
- `product/REQUISITOS_BETA_1.md` - alcance recortado para primera beta de cuidado individual robusto.
- `product/BUSINESS_PLAN.md` - modelo de negocio, segmentos, validacion y riesgos comerciales.
- `product/BETA_UX_AND_TESTING_PLAN.md` - plan de rediseño beta: Home, crear planta, jardines, compartir y feedback de testers.
- `product/PLANT_CARE_RESEARCH.md` - investigacion botanica y reglas de cuidado.
- `product/REAL_DATA_PILOT.md` - estrategia de trabajo con datos reales del huerto PAC.
- `product/cases/MATICO_PROPAGATION_DANTE.md` - primer caso real: propagacion de matico para Dante.

### Arquitectura futura

- `architecture/PLAN_ARQUITECTURA.md` - diagnostico del modelo actual y evolucion propuesta.
- `architecture/EP2_DOY0101_DEVOPS_SUBPROJECT.md` - plan del subproyecto de DevOps, especificacion de contenedores y pipeline CI/CD.
- `architecture/DATABASE_MIGRATION_PLAN.md` - dimensionamiento de Firebase vs Supabase y spike recomendado.
- `architecture/PLANT_CREATION_V2.md` - diseño para creacion flexible, diagnosticos, tolerancia a fallos y popping entre pantallas.
- `architecture/DATA_AI_SUPABASE_PLAN.md` - comparacion y plan refinado para modelo relacional, ingesta IA y recomendacion.
- `architecture/SUPABASE_TEST_PLAN.md` - plan de pruebas por capas para Auth, RLS, Storage, eventos e IA.
- `architecture/PREDICTIVE_AI_MODEL.md` - modelo progresivo de prediccion con foto, clima, eventos y evidencia.
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
