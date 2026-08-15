# Documentacion de Lleken

Este indice es el punto de entrada para encontrar la documentacion de la plataforma AgriTech **Lleken**.

## Ruta corta para agentes IA

Para retomar trabajo con agentes, usar primero:

1. `README_DOCS_INDEX.md` - Ruta corta para no leer todo el repo.
2. `ai-inbox/DAILY_BRIEF.md` - Estado corto y foco inmediato.
3. `ai-inbox/PENDING_TASKS.md` - Solo si vas a tomar o crear una tarea delegable.
4. `product/PRODUCT_VISION_COLLABORATIVE_CARE.md` - Nueva direccion canonica de producto.
5. `current/APP_OVERVIEW.md` - Arquitectura heredada vigente.
6. `current/DATABASE_STATE.md` - Fuente de verdad de Supabase, Auth, Storage y datos.

## Lectura rapida general

Si eres nuevo en el proyecto, lee en este orden:

1. `../README.md` - Que es Lleken y como correr el entorno en desarrollo local.
2. `process/CHECKPOINTS.md` - Checkpoints historicos y estado operativo.
3. `current/APP_OVERVIEW.md` - Arquitectura tecnica del producto, rutas y modelos vigentes.
4. `process/WORKFLOW.md` - Reglas de trabajo y definicion de listo del repositorio.

## Estructura de carpetas

```text
docs/
  INDEX.md              <-- Este archivo de indice
  README_DOCS_INDEX.md  <-- Ruta corta para agentes IA
  ai-inbox/             <-- Brief diario y backlog activo delegable
  current/              <-- Verdad tecnica y operativa actual del producto
  process/              <-- Metodologia de trabajo, sprints, QA y dinamicas de equipo
  product/              <-- Vision de negocio, hojas de ruta e investigacion de usuario
  architecture/         <-- Disenos y especificaciones de arquitectura futuros
  devops/               <-- Subproyecto DevOps academico
  maintenance/          <-- Auditorias, protocolos y mejoras de continuidad
  archive/              <-- Referencias historicas y material obsoleto respaldado
```

## Documentos activos por componente

### DevOps y contenedores

- `devops/EP2_DEVOPS_REPORT.md` - Plan maestro del subproyecto, Dockerfiles y pipeline CI/CD.
- `devops/WALKTHROUGH_VERIFICATION.md` - Bitacora de verificacion de contenedores locales y OAuth.
- `devops/evidence/` - Capturas de evidencia requeridas por la rubrica academica.

### Estado tecnico actual

- `current/APP_OVERVIEW.md` - Arquitectura actual del frontend y backend, bases de datos y deuda tecnica.
- `current/PROJECT_STATUS.md` - Estado operativo actual del prototipo beta.
- `current/AI_PIPELINE.md` - Pipeline de IA y su integracion con servicios climaticos.
- `current/DATABASE_STATE.md` - Modelo fisico y operativo actual de Supabase.
- `current/FIREBASE.md` - Referencia historica de Firebase; no es fuente operativa actual.

### Proceso de trabajo del equipo

- `README_DOCS_INDEX.md` - Ruta minima para agentes IA.
- `ai-inbox/DAILY_BRIEF.md` - Estado corto, comandos recientes y foco de retomada.
- `ai-inbox/PENDING_TASKS.md` - Backlog activo delegable, sin historial completado.
- `maintenance/PROACTIVE_AGENT_AUDIT_PROTOCOL.md` - Protocolo para auditorias proactivas aprobables.
- `process/CHECKPOINTS.md` - Checkpoints C0 en adelante, hitos del semestre.
- `process/WORKFLOW.md` - Reglas y estandares de trabajo.
- `process/TEAM.md` - Estructura de roles del equipo y rituales de Scrum.
- `process/DESIGN_RULES.md` - Guia de UI y mejores practicas de experiencia de usuario.
- `process/TASK_SYSTEM.md` - Guia estatica del sistema de tareas locales.
- `process/WEEKLY_TASKS.md` - Tareas semanales asignadas y en progreso.
- `process/WEEKLY_EXECUTION.md` - Entrada corta para humanos y chats de IA.
- `process/AI_MEMBER_ONBOARDING.md` - Protocolo para trabajo interactivo de miembros con IA.
- `process/PORTABLE_AI_DOCUMENTATION_WORKFLOW_SKILL.md` - Paquete portable para reconfigurar documentacion eficiente.
- `process/SMOKE_TEST.md` - Checklist manual antes de deploy productivo.
- `process/VERCEL_SUPABASE_DEPLOY.md` - Instrucciones para despliegue manual en Vercel.

### Producto e investigacion

- `product/PRODUCT_VISION_COLLABORATIVE_CARE.md` - Nucleo nuevo: personas coordinando el cuidado de conjuntos amplios de plantas.
- `product/PRODUCT_REFOUNDATION_ROADMAP.md` - Fases para refundar el producto de forma incremental.
- `product/ROADMAP.md` - Vision del producto, brechas actuales y planes de escalabilidad.
- `product/REQUISITOS.md` - Matriz maestra de requerimientos funcionales y no funcionales.
- `product/REQUISITOS_BETA_1.md` - Alcance ejecutable de Beta 1.
- `product/BUSINESS_PLAN.md` - Modelo de negocio Lean Canvas, riesgos comerciales y monetizacion.
- `product/BETA_UX_AND_TESTING_PLAN.md` - Plan de diseno del prototipo beta.
- `product/PRODUCT_DESIGN_AUDIT_BACKLOG.md` - Aportes Product Design convertidos en cortes UX delegables.
- `product/PLANT_CARE_RESEARCH.md` - Investigacion botanica para recomendaciones de cuidado.
- `product/REAL_DATA_PILOT.md` - Estrategia de datos reales PAC.

### Arquitectura

- `architecture/LOCAL_DEVELOPMENT_AUTH_PLAN.md` - Diagnostico y criterios para Auth local y productivo.
- `architecture/PLAN_ARQUITECTURA.md` - Diagnostico y propuesta de rediseno de software.
- `architecture/DATABASE_MIGRATION_PLAN.md` - Plan historico de migracion Firebase -> Supabase.
- `architecture/PLANT_CREATION_V2.md` - Rediseno del modulo de creacion y monitoreo de plantas.
- `architecture/DATA_AI_SUPABASE_PLAN.md` - Ingesta de datos climaticos y optimizacion IA.
- `architecture/SUPABASE_TEST_PLAN.md` - Plan de pruebas aisladas de Supabase.
- `architecture/diagrams/` - Diagramas Mermaid.

### Auditorias de refundacion

- `maintenance/PROJECT_REFOUNDATION_AUDIT_2026-07-10.md` - Contraste entre codigo heredado y nueva direccion.

## Reglas de ubicacion

- Si describe como opera el producto hoy, va en `current/`.
- Si describe metodologia, rituales o coordinacion del equipo, va en `process/`.
- Si es brief, backlog activo o continuidad corta para agentes, va en `ai-inbox/`.
- Si es auditoria, protocolo o mejora de continuidad documental, va en `maintenance/`.
- Si describe estrategia comercial o de negocio, va en `product/`.
- Si describe diseno tecnico a futuro, va en `architecture/`.
- Si es del subproyecto de contenedores/CI-CD de la EP2, va en `devops/`.
