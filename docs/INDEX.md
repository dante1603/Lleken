# Documentación de Lleken

Este índice es el punto de entrada para encontrar la documentación de la plataforma AgriTech **Lleken**.

## Contrato de frescura — 2026-08-17

La carpeta `docs/current/` conserva documentos técnicos valiosos, pero varios son **snapshots históricos de mayo de 2026** y no deben interpretarse como estado operativo vigente sólo por vivir bajo `current/`.

Para reconstruir el presente:

1. **Intención, prioridades, misiones y estado mutable:** Notion — `Estado canónico`, `Operación y misiones` y la misión/frente propietario correspondiente.
2. **Realidad técnica actual:** código de `main`, migraciones, tests/CI y runtime/producción.
3. **Evidencia durable de uso real y auditorías de producción:** `product/REAL_DATA_PILOT.md` y documentos de investigación/casos pertinentes.
4. **Documentos de `docs/current/`:** usar como contexto técnico sólo después de comprobar su fecha y contrastarlos con código/Notion. Una etiqueta histórica dentro de un documento gana sobre el nombre de la carpeta.

No reconstruir prioridades actuales desde `PROJECT_STATUS.md`, `APP_OVERVIEW.md`, `DATABASE_STATE.md` o `CHECKPOINTS.md` sin comprobar primero su fecha. Estos archivos contienen historia útil, pero parte de su wording “actual/vigente” quedó obsoleto con la evolución del proyecto.

## 📖 Lectura rápida

Si eres nuevo en el proyecto, leer en este orden:

1. `../README.md` - Qué es Lleken y cómo correr el entorno.
2. Notion `Estado canónico` + `Operación y misiones` - estado operativo vigente y ruta de trabajo.
3. `product/REAL_DATA_PILOT.md` - evidencia de uso real, incluidos hallazgos de producción del 2026-08-17.
4. `current/APP_OVERVIEW.md` - mapa histórico amplio de arquitectura; **contrastar con `main` antes de asumir rutas/modelos vigentes**.
5. `process/WORKFLOW.md` - reglas históricas del repo; para flujo actual con agentes prevalece `Operación y misiones` en Notion.

---

## 📂 Estructura de carpetas

```text
docs/
  INDEX.md              <-- Este archivo de índice y contrato de frescura
  current/              <-- snapshots técnicos; verificar fecha antes de tratarlos como actuales
  process/              <-- metodología, QA y registros operativos/históricos
  product/              <-- visión, investigación y evidencia durable de producto
  architecture/         <-- diseños, especificaciones y planes técnicos
  devops/               <-- Subproyecto DevOps (Evaluación Parcial N°2)
  archive/              <-- referencias históricas y material obsoleto respaldado
```

---

## 📄 Documentos activos por componente

### 🐳 DevOps y Contenedores (Evaluación Parcial N°2)
- **[devops/EP2_DEVOPS_REPORT.md](file:///c:/Users/GLADIS/Documents/Lleken/docs/devops/EP2_DEVOPS_REPORT.md)**: Plan maestro del subproyecto, especificaciones de Dockerfiles y diseño del pipeline de CI/CD.
- **[devops/WALKTHROUGH_VERIFICATION.md](file:///c:/Users/GLADIS/Documents/Lleken/docs/devops/WALKTHROUGH_VERIFICATION.md)**: Bitácora de verificación de los contenedores locales y comportamiento de la redirección OAuth.
- **[devops/evidence/](file:///c:/Users/GLADIS/Documents/Lleken/docs/devops/evidence/)**: Carpeta ordenada con todas las capturas de pantalla de evidencia requeridas por la rúbrica académica.

### 💻 Snapshots técnicos y estado de implementación
- `current/APP_OVERVIEW.md` - mapa amplio de arquitectura con snapshot principal 2026-05-02; contrastar con `main`.
- `current/PROJECT_STATUS.md` - snapshot operativo histórico 2026-05-05; **no gobierna prioridades actuales**.
- `current/AI_PIPELINE.md` - documentación del pipeline IA; verificar contra `server/ai/` y rutas actuales.
- `current/DATABASE_STATE.md` - snapshot de Supabase 2026-05-02; para esquema actual usar migraciones + estado remoto verificado.
- `current/FIREBASE.md` - referencia histórica de la migración Firebase → Supabase.

### 🛠️ Proceso de trabajo del equipo
- `process/CHECKPOINTS.md` - historial de checkpoints; su último bloque puede estar superado por Notion.
- `process/WORKFLOW.md` - reglas históricas de commits y ramas; el contrato operativo vigente con agentes vive en Notion.
- `process/TEAM.md` - estructura de roles del equipo.
- `process/DESIGN_RULES.md` - guía de UI y mejores prácticas de experiencia de usuario.
- `process/TASK_SYSTEM.md` - guía estática del sistema de tareas locales.
- `process/WEEKLY_TASKS.md` - registro semanal histórico; no usar como cola vigente sin comprobar fecha.
- `process/AI_MEMBER_ONBOARDING.md` - protocolo histórico para asistentes de IA.
- `process/SMOKE_TEST.md` - checklist manual; validar que cubra el candidate actual antes de ejecutar.
- `process/VERCEL_SUPABASE_DEPLOY.md` - instrucciones de despliegue; contrastar con configuración real de Vercel/Supabase.

### 📈 Producto e Investigación
- `product/REAL_DATA_PILOT.md` - evidencia longitudinal de piloto y auditorías producción ↔ código; checkpoint reciente 2026-08-17.
- `product/ROADMAP.md` - visión del producto y planes de escalabilidad; prioridades operativas viven en Notion.
- `product/REQUISITOS.md` - matriz maestra histórica de requerimientos; requisitos canónicos actuales también se mantienen en Notion.
- `product/BUSINESS_PLAN.md` - modelo de negocio Lean Canvas, riesgos comerciales y monetización.
- `product/BETA_UX_AND_TESTING_PLAN.md` - plan de diseño del prototipo beta.
- `product/PLANT_CARE_RESEARCH.md` - investigación botánica para las recomendaciones de cuidado.
- `product/FUNCTIONAL_CARE_ARCHETYPES.md` - arquetipos/perfiles funcionales como priors de cuidado cuando la especie no está confirmada; amplía el modelo hacia jardín.
- `product/CARE_RISK_MODEL.md` - dirección canónica para combinar estados, ambiente, historial, curvas por factor e interacciones hasta producir riesgos y recomendaciones revisables.

### 📐 Arquitectura
- `architecture/PLAN_ARQUITECTURA.md` - diagnóstico inicial y propuesta de rediseño de software.
- `architecture/DATABASE_MIGRATION_PLAN.md` - plan histórico de migración Firebase -> Supabase.
- `architecture/PLANT_CREATION_V2.md` - rediseño del módulo de creación y monitoreo de plantas.
- `architecture/DATA_AI_SUPABASE_PLAN.md` - ingesta de datos climáticos y optimización de sugerencias.
- `architecture/diagrams/` - diagramas Mermaid; comprobar fecha/estado `actual | futuro` de cada diagrama.

---

## 📌 Reglas de ubicación y autoridad
- Si conserva **evidencia durable de comportamiento real**, va en `product/` o en el caso específico propietario.
- Si describe una **implementación técnica**, debe mantenerse cerca del código, pero su fecha no sustituye la verificación del repo/runtime.
- Si describe la **operación mutable, misión activa o prioridad**, su propietario es Notion.
- Si describe metodología o QA, va en `process/`, distinguiendo contrato vigente de registro histórico.
- Si describe un diseño técnico a futuro, va en `architecture/` y debe decir explícitamente qué es actual y qué es futuro.
- Si es del subproyecto de contenedores/CI-CD de la EP2, va en `devops/`.
- Si queda obsoleto y no conserva valor operativo, mover a `archive/` en una misión de higiene; no borrar historia útil por inercia.
