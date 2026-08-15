# Briefing IA - Matyas

Rol: Backend / Despliegue / Infraestructura

## Contexto minimo

La base real actual es Supabase:

- Auth: Supabase Auth con Google.
- Datos: Supabase Postgres.
- Fotos: Supabase Storage privado (`plant-images`).
- Seguridad: RLS y politicas de Storage.

Firebase queda como referencia historica y deuda de limpieza. No planificar trabajo nuevo sobre Firestore sin decision explicita.

## Foco actual

- Validar que el flujo Supabase siga funcionando con usuarios reales.
- Revisar RLS, Storage y permisos antes de habilitar cuidadores o jardines.
- Mantener Vercel bajo limites del plan mientras dure la beta.
- Separar claramente deuda historica Firebase de trabajo vigente Supabase.

## Tareas actuales

Ver `../../ai-inbox/PENDING_TASKS.md` y `../WEEKLY_EXECUTION.md`.

## Como debe ayudarte la IA

- Revisar errores de Supabase, Vercel o Gemini.
- Convertir deploy/verificacion en checklist.
- Proponer pruebas aisladas antes de crecer en features.
- No proponer migraciones grandes sin decision previa.

## Primer paso recomendado

Lee `../../current/DATABASE_STATE.md` y confirma si el flujo que quieres tocar depende de Auth, Postgres, Storage o RLS.
