# Tareas humanas para migracion Supabase

Fecha: 2026-05-02
Estado: H1-H4 completos. Flujo base probado en app real.

## Objetivo

Migrar Lleken a Supabase sin conservar datos antiguos de Firebase. Lo importante es:

- iniciar sesion con Google;
- guardar nuevos datos en una estructura robusta;
- probar partes individuales antes de integrar toda la app.

## Tareas humanas

### H1 - Confirmar proyecto

Proyecto detectado:

- Nombre: `Lleken`
- Project ref: `kfhoyvofjyvjmgtfzpuu`
- Region: `sa-east-1`
- Estado: activo

Tarea: confirmar que este sera el proyecto real de migracion. Si prefieres otro proyecto separado para romper sin miedo, avisar antes de conectar la UI.

Estado tecnico: ya use este proyecto para crear las tablas iniciales, RLS, bucket privado y catalogos base.

Estado humano: completo.

### H2 - Configurar Google Auth

En Supabase:

1. Ir a `Authentication > Providers`.
2. Abrir `Google`.
3. Copiar el callback URL de Supabase.
   - Debe tener formato: `https://kfhoyvofjyvjmgtfzpuu.supabase.co/auth/v1/callback`

En Google Cloud Console:

1. Crear o reutilizar un OAuth Client ID tipo Web.
2. Agregar como Authorized redirect URI el callback de Supabase.
3. Copiar `Client ID` y `Client Secret`.

De vuelta en Supabase:

1. Activar Google.
2. Pegar `Client ID` y `Client Secret`.
3. Guardar.

Estado humano: completo. El usuario logro iniciar sesion con Google y vio su cuenta en Supabase.

### H3 - Configurar URLs permitidas

En Supabase `Authentication > URL Configuration`, permitir para desarrollo:

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/auth/callback
```

Cuando exista deploy, se agrega la URL real de produccion.

Estado humano: completo para desarrollo local.

### H4 - Entregar variables publicas a la app

Cuando Google Auth este listo, necesitamos:

```text
VITE_SUPABASE_URL=https://kfhoyvofjyvjmgtfzpuu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

No usar `service_role` en el frontend.

Estado tecnico: completo. `.env.local` ya tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

### H5 - Probar con Postman o prueba aislada equivalente

Estado: opcional por ahora.

La UI ya probo el flujo mas importante: login con Google y creacion de planta. Postman no es obligatorio si seguimos avanzando con pruebas desde la app, pero es util cuando queramos aislar problemas de RLS o Data API sin depender del frontend.

Coleccion preparada:

`docs/architecture/postman/lleken-supabase-smoke.postman_collection.json`

Flujo:

1. Iniciar sesion en la app.
2. Copiar `access_token`.
3. Pegar token en Postman como `Bearer {{access_token}}`.
4. Probar perfil, garden, planta, evento y acceso anonimo bloqueado.

## Lo que no tienes que hacer

- No migrar datos antiguos de Firebase.
- No crear tablas manualmente si ya apliqué la migracion.
- No tocar la `service_role key` salvo que estemos configurando backend.
- No guardar imagenes dentro de la base de datos.

## Bloqueos posibles

- Google OAuth requiere acceso al Google Cloud Console correcto.
- Supabase puede necesitar que confirmes URLs de redireccion.
- Para pruebas con dos usuarios se necesitan dos cuentas Google distintas.

## Estado tecnico al cierre de esta pasada

- Schema aplicado en Supabase: si.
- Tablas principales creadas: `profiles`, `gardens`, `garden_members`, `plants`, `plant_members`, `plant_events`, `plant_media`, `environmental_logs`, `ai_analyses`, `diagnoses`, `recommendations`, `recommendation_outcomes`, `care_archetypes`, `species_catalog`.
- RLS activado: si.
- Security advisors: sin alertas.
- Performance advisors: solo avisan indices sin uso porque la base esta recien creada.
- App React: ya compila con Supabase Auth y capa de datos Supabase.
- Google Auth: probado en UI real.
- Nueva planta: probado en UI real.
- Storage: probado con bucket privado `plant-images`.
- Imagenes: se guarda `storage_path`; `public_url` queda `null`.
- Species catalog: `plants.species_id` se llena para nuevas plantas cuando hay nombre comun/cientifico; la planta `tomaco` fue corregida por backfill.
- Ultima verificacion: `npm run check` pasa.
