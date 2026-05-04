# Deploy inicial Vercel + Supabase

Fecha: 2026-05-04

## Decision

Vercel se usa para publicar la app y los endpoints `/api/*`.

Supabase sigue siendo la fuente operativa de:

- Auth con Google.
- Postgres.
- Storage privado `plant-images`.
- RLS y permisos.

Vercel no reemplaza Supabase. Solo hospeda el frontend Vite y ejecuta el backend Express como Vercel Function.

## Estado del repo

Preparado para despliegue inicial:

- `api/[...path].ts` exporta la API Express para Vercel.
- `server/index.ts` exporta `app` y solo hace `listen` en desarrollo local.
- `vercel.json` declara Vite, salida `dist`, fallback SPA y `maxDuration` de 60 segundos para endpoints IA.
- El frontend mantiene llamadas relativas a `/api/*`, por lo que en Vercel usara el mismo dominio.

## Variables necesarias en Vercel

Configurar en Project Settings -> Environment Variables:

```text
GEMINI_API_KEY=...
VITE_SUPABASE_URL=https://kfhoyvofjyvjmgtfzpuu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
APP_URL=https://<dominio-vercel>
```

No subir `service_role` a Vercel para frontend. Si mas adelante se necesita backend administrativo, se hara una variable separada y solo la usara una funcion server-side con permisos revisados.

## Supabase Auth

Cuando exista la URL de Vercel, agregarla en Supabase Auth:

- Site URL: `https://<dominio-vercel>`
- Redirect URL: `https://<dominio-vercel>/**`

Mantener tambien `http://localhost:3000/**` para desarrollo local.

## Smoke test despues de deploy

1. Abrir el dominio Vercel.
2. Iniciar sesion con Google.
3. Confirmar que el perfil aparece en Supabase.
4. Crear planta con foto real.
5. Verificar que se guarda en `plants`, `plant_media`, `plant_events` y `environmental_logs`.
6. Abrir ficha y recargar navegador.
7. Ejecutar seguimiento por foto.
8. Revisar que `/api/health` responda en el dominio Vercel.

## Riesgos del primer despliegue

- Las llamadas IA con imagen pueden tardar; por eso la funcion queda con `maxDuration` de 60 segundos.
- Si Supabase Auth no tiene el dominio Vercel autorizado, el login Google falla aunque el deploy este correcto.
- Si falta `GEMINI_API_KEY`, el flujo debe degradar con errores claros, pero identificacion/seguimiento IA no funcionaran.
- La primera fase debe probar pocos usuarios y datos reales ordenados manualmente antes de automatizar recomendaciones.

