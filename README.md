# Lleken

Lleken es una plataforma AgriTech mobile-first para cuidado proactivo de plantas y huertos comunitarios urbanos.

La fase actual es una app inteligente: el usuario toma o sube una foto, la IA identifica la planta, la app cruza la especie con ubicacion/clima real, genera un plan de cuidados, guarda la planta y muestra calendario, historial y seguimiento por foto.

La vision de largo plazo incluye huertos compartidos, metricas de impacto para instituciones y sensores IoT de humedad/temperatura.

## Estado actual

- Postulacion Innova Sostenible 2026 enviada.
- Prototipo funcional C0-C4 completado.
- Prioridad actual: Beta 1 de cuidado individual robusto antes del 2026-06-01.
- PAC (Pedro Aguirre Cerda) es el piloto comunitario de referencia, pero Beta 1 prueba primero el cuidado individual estable.

## Stack actual

- Frontend: React 19 + TypeScript + Vite.
- Estilos: Tailwind CSS v4.
- Auth actual: Supabase Auth con Google.
- Base actual: Supabase Postgres.
- Storage actual: Supabase Storage privado.
- Backend local: Express + tsx.
- IA: Gemini 2.5 Flash desde backend.
- Clima/geocoding: Open-Meteo.
- Tests: Vitest.

## Documentacion principal

Empieza por:

- `docs/INDEX.md` - mapa general de documentacion.
- `docs/current/PROJECT_STATUS.md` - estado actual y foco del mes.
- `docs/product/REQUISITOS_BETA_1.md` - alcance real de la primera beta.
- `docs/process/WEEKLY_EXECUTION.md` - tareas semanales asignadas y disponibles.
- `docs/process/task-dashboard.html` - dashboard simple para abrir tareas en el navegador.
- `docs/process/AI_MEMBER_ONBOARDING.md` - como cada integrante usa IA para saber que hacer.

Para base de datos:

- `docs/current/DATABASE_STATE.md` - estado real Firebase/Supabase.
- `docs/architecture/DATABASE_MIGRATION_PLAN.md` - dimensionamiento y plan por fases para Supabase.

## Equipo

- Dante - Project Manager / Product Owner / Creador.
- Matyas - Backend / Despliegue / Infraestructura.
- Aikia - Marketing / UX-UI / Desarrollo web.
- Nicolas - UX-UI / Desarrollador de apoyo / QA.

Cada integrante puede abrir un chat de IA y escribir:

```text
Soy [Nombre] trabajando en Lleken. Lee docs/process/AI_MEMBER_ONBOARDING.md y dime que me toca hoy.
```

O:

```text
Soy [Nombre] trabajando en Lleken. Que hay disponible para tomar?
```

## Correr en local

Requisitos:

- Node.js.
- Una clave Gemini en `.env.local`.

Instalar dependencias:

```bash
npm install
```

Crear `.env.local`:

```bash
GEMINI_API_KEY="TU_CLAVE_DE_GEMINI"
APP_URL="http://localhost:3000"
API_PORT=8787
```

Levantar API y frontend en dos terminales:

```bash
npm run dev:api
```

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

En Windows PowerShell, si `npm.ps1` se bloquea, usar:

```bash
cmd /c npm.cmd run dev
```

## Verificacion

Antes de cerrar cambios con codigo:

```bash
npm run check
```

Para cambios solo de documentacion, revisar que los enlaces principales sigan vivos desde `docs/INDEX.md`.

## Base de datos

La app actual funciona con Supabase para login, plantas, eventos e imagenes. Firebase queda como referencia historica mientras se limpian archivos antiguos.

Para el estado real de base de datos, migraciones y Storage, ver `docs/current/DATABASE_STATE.md`.

Ver `docs/architecture/DATABASE_MIGRATION_PLAN.md`.

## Git / Drive

`Lleken_drive/` se ignora en Git. Drive queda como referencia/lectura externa; la verdad tecnica y operativa del proyecto vive en el repo.
