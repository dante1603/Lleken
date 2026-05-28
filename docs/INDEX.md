# Documentación de Lleken

Este índice es el punto de entrada para encontrar la documentación de la plataforma AgriTech **Lleken**.

## 📖 Lectura Rápida

Si eres nuevo en el proyecto, te sugerimos leer en este orden:

1. `../README.md` - Qué es Lleken y cómo correr el entorno en desarrollo local.
2. `process/CHECKPOINTS.md` - Estado actual de avance del equipo, checkpoints y tareas pendientes.
3. `current/APP_OVERVIEW.md` - Arquitectura técnica del producto, rutas y modelos de datos vigentes.
4. `process/WORKFLOW.md` - Reglas de trabajo y definición de listo del repositorio.

---

## 📂 Estructura de Carpetas

```text
docs/
  INDEX.md              <-- Este archivo de índice
  current/              <-- Verdad técnica y operativa actual del producto
  process/              <-- Metodología de trabajo, sprints, QA y dinámicas de equipo
  product/              <-- Visión de negocio, hojas de ruta e investigación de usuario
  architecture/         <-- Diseños y especificaciones de arquitectura futuros
  devops/               <-- Carpeta del Subproyecto DevOps (Evaluación Parcial N°2)
  archive/              <-- Referencias históricas y material obsoleto respaldado
```

---

## 📄 Documentos Activos por Componente

### 🐳 DevOps y Contenedores (Evaluación Parcial N°2)
- **[devops/EP2_DEVOPS_REPORT.md](file:///c:/Users/GLADIS/Documents/Lleken/docs/devops/EP2_DEVOPS_REPORT.md)**: Plan maestro del subproyecto, especificaciones de Dockerfiles y diseño del pipeline de CI/CD.
- **[devops/WALKTHROUGH_VERIFICATION.md](file:///c:/Users/GLADIS/Documents/Lleken/docs/devops/WALKTHROUGH_VERIFICATION.md)**: Bitácora de verificación de los contenedores locales y comportamiento de la redirección OAuth.
- **[devops/evidence/](file:///c:/Users/GLADIS/Documents/Lleken/docs/devops/evidence/)**: Carpeta ordenada con todas las capturas de pantalla de evidencia requeridas por la rúbrica académica.

### 💻 Estado Técnico Actual
- `current/APP_OVERVIEW.md` - Arquitectura actual del frontend y backend, bases de datos y deuda técnica.
- `current/PROJECT_STATUS.md` - Estado operativo actual del prototipo beta.
- `current/AI_PIPELINE.md` - Pipeline de IA y su integración con los servicios climáticos.
- `current/DATABASE_STATE.md` - Modelo físico y operativo actual de Supabase (tablas, RLS, storage).
- `current/FIREBASE.md` - Documentación y referencia de la migración histórica de Firebase a Supabase.

### 🛠️ Proceso de Trabajo del Equipo
- `process/CHECKPOINTS.md` - Checkpoints C0 en adelante, hitos del semestre.
- `process/WORKFLOW.md` - Reglas y estándares de commits y ramas.
- `process/TEAM.md` - Estructura de roles del equipo y rituales de Scrum.
- `process/DESIGN_RULES.md` - Guía de UI y mejores prácticas de experiencia de usuario.
- `process/TASK_SYSTEM.md` - Guía estática del sistema de tareas locales.
- `process/WEEKLY_TASKS.md` - Tareas semanales asignadas y en progreso.
- `process/AI_MEMBER_ONBOARDING.md` - Protocolo para trabajo interactivo de los miembros con asistentes de IA.
- `process/SMOKE_TEST.md` - Checklist manual estricto antes de realizar un deploy productivo.
- `process/VERCEL_SUPABASE_DEPLOY.md` - Instrucciones para el despliegue manual en Vercel.

### 📈 Producto e Investigación
- `product/ROADMAP.md` - Visión del producto, brechas actuales y planes de escalabilidad.
- `product/REQUISITOS.md` - Matriz maestra de requerimientos funcionales y no funcionales.
- `product/BUSINESS_PLAN.md` - Modelo de negocio Lean Canvas, riesgos comerciales y monetización.
- `product/BETA_UX_AND_TESTING_PLAN.md` - Plan de diseño del prototipo beta.
- `product/PLANT_CARE_RESEARCH.md` - Investigación botánica para las recomendaciones de cuidado.

### 📐 Arquitectura Futura
- `architecture/PLAN_ARQUITECTURA.md` - Diagnóstico inicial y propuesta de rediseño de software.
- `architecture/DATABASE_MIGRATION_PLAN.md` - Plan de migración de bases de datos Firebase -> Supabase.
- `architecture/PLANT_CREATION_V2.md` - Rediseño del módulo de creación y monitoreo de plantas.
- `architecture/DATA_AI_SUPABASE_PLAN.md` - Ingesta de datos climáticos y optimización de sugerencias.
- `architecture/diagrams/` - Diagramas Mermaid (Clases, ERD, Secuencia, Estados).

---

## 📌 Reglas de Ubicación
- Si describe cómo opera el producto **hoy**, va en `current/`.
- Si describe la metodología y **rituales del equipo**, va en `process/`.
- Si describe la **estrategia comercial o de negocio**, va en `product/`.
- Si describe un **diseño técnico a futuro**, va en `architecture/`.
- Si es del **subproyecto de contenedores/CI-CD de la EP2**, va en `devops/`.
