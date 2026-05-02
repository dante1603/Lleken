# Plan de testeo Supabase

Fecha: 2026-05-01
Estado: primer plan operativo. T0 completado a nivel tecnico.

## Objetivo

Probar la migracion a Supabase por piezas pequenas antes de cambiar toda la app.

La meta es confirmar:

- Auth Google funciona.
- RLS protege datos por usuario.
- Se puede guardar una planta nueva.
- Se puede guardar historial como eventos separados.
- Se puede registrar metadata de imagen.
- El backend puede guardar analisis IA sin exponer escritura directa al cliente.

## T0 - Base

Pruebas:

- listar tablas antes de migrar;
- aplicar migracion inicial;
- listar tablas despues;
- ejecutar advisors de seguridad y performance.

Criterio de exito:

- tablas creadas;
- RLS activo;
- bucket `plant-images` creado privado.

Estado: completado. Advisors de seguridad sin alertas; los avisos de performance restantes son indices sin uso por falta de trafico.

## T1 - Auth Google

Pruebas humanas:

- iniciar sesion con Google;
- volver a la app;
- verificar fila en `profiles`;
- cerrar sesion;
- volver a iniciar.

Criterio de exito:

- `auth.users` tiene usuario;
- `profiles.id` coincide con `auth.users.id`;
- la app recibe sesion.

## T2 - RLS basico con Postman

Variables:

```text
supabase_url=https://kfhoyvofjyvjmgtfzpuu.supabase.co
anon_key=...
access_token=...
user_id=...
```

Headers:

```text
apikey: {{anon_key}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

Pruebas:

1. `GET /rest/v1/profiles?select=*`
   - con token devuelve el perfil propio.
   - sin token no debe devolver datos.
2. `POST /rest/v1/gardens`
   - con `owner_id` propio crea garden.
   - con `owner_id` ajeno falla por RLS.
3. `POST /rest/v1/plants`
   - con `owner_id` propio crea planta.
   - sin token falla.
4. `GET /rest/v1/plants?select=*`
   - owner ve su planta.
   - otro usuario no debe verla salvo que sea miembro.

## T3 - Eventos

Pruebas:

1. Crear `plant_events` tipo `creation`.
2. Crear `plant_events` tipo `watering`.
3. Consultar eventos por planta ordenados por fecha.
4. Confirmar que `plants` no crece con un array de historial.

## T4 - Storage

Pruebas:

1. Subir imagen al bucket `plant-images` con path:

```text
{{user_id}}/{{plant_id}}/profile.jpg
```

2. Insertar metadata en `plant_media`.
3. Intentar subir imagen al path de otro usuario.

Criterio de exito:

- path propio funciona;
- path ajeno falla;
- tabla guarda metadata, no blobs.

## T5 - IA backend

Pruebas:

1. Cliente crea evento y media.
2. Backend llama Gemini.
3. Backend inserta `ai_analyses`.
4. Backend inserta `diagnoses`.
5. Cliente lee diagnostico, pero no escribe `ai_analyses` directamente.

## Pruebas futuras en repo

- normalizadores Supabase <-> tipos actuales;
- construccion de paths de Storage;
- validacion de schema IA;
- adaptador de datos con mocks;
- fixtures de permisos esperados.

## Regla de corte

Si Auth Google + crear planta + RLS basico no funciona en menos de 2 dias de trabajo, se documenta el bloqueo y se decide si Firebase queda como puente temporal.
