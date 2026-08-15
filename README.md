# Lleken

Lleken es una herramienta mobile-first para coordinar grupos de personas que cuidan conjuntos amplios de plantas en huertos, jardines y otros espacios compartidos.

El producto debe permitir organizar espacios, sectores, personas, responsabilidades, tareas, incidencias y actividad. La IA sigue disponible como tecnologia de apoyo para identificar, resumir o sugerir, pero ya no es el centro del producto ni un requisito para el flujo diario.

La aplicacion que existe hoy fue construida principalmente alrededor del cuidado individual: foto, identificacion, plan, calendario y seguimiento por planta. Desde 2026-07-10 el proyecto entra en una refundacion incremental para aprovechar su base tecnica y construir primero el nucleo colaborativo.

## Estado actual

- La base heredada usa React, Supabase y servicios de IA/clima.
- Supabase ya modela jardines, membresias y roles, pero esas capacidades aun no tienen una experiencia funcional completa en el frontend.
- La prioridad inmediata es recuperar el ciclo de prueba en localhost y definir el dominio colaborativo minimo.
- PAC (Pedro Aguirre Cerda) sigue siendo un contexto de referencia para validar cuidado comunitario.

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

- `docs/README_DOCS_INDEX.md` - ruta corta para retomar sin leer todo.
- `docs/ai-inbox/DAILY_BRIEF.md` - estado y foco inmediato.
- `docs/product/PRODUCT_VISION_COLLABORATIVE_CARE.md` - direccion canonica de producto.
- `docs/product/PRODUCT_REFOUNDATION_ROADMAP.md` - fases de la nueva linea de trabajo.
- `docs/maintenance/PROJECT_REFOUNDATION_AUDIT_2026-07-10.md` - contraste con el proyecto heredado.

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

> Estado 2026-07-10: el servidor local puede levantarse, pero el login OAuth puede regresar al dominio productivo si `http://localhost:3000/home` no esta autorizado en Supabase Auth. Ver `docs/architecture/LOCAL_DEVELOPMENT_AUTH_PLAN.md` antes de diagnosticar una redireccion fija en el frontend.

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
