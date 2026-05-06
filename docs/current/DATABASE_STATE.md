# Estado de base de datos y almacenamiento

Fecha: 2026-05-02

Este documento aclara el estado real de datos de Lleken para evitar decisiones confusas entre Firebase, Supabase y futuras migraciones.

## Resumen ejecutivo

Estado actual: **Supabase ya es la base operativa del flujo principal de auth, plantas, eventos, media y contexto ambiental**.

- Auth: Supabase Auth con Google.
- Base de datos: Supabase Postgres, proyecto `Lleken`, ref `kfhoyvofjyvjmgtfzpuu`.
- Fotos: Supabase Storage, bucket privado `plant-images`.
- La base antigua de Firebase no se esta migrando; se acepta perder datos anteriores.
- La app guarda nuevos datos en Supabase y genera URLs firmadas temporales para mostrar imagenes.

## Proyecto Supabase

Proyecto real usado:

- Nombre: `Lleken`
- Project ref: `kfhoyvofjyvjmgtfzpuu`
- Region: `sa-east-1`
- URL publica: `https://kfhoyvofjyvjmgtfzpuu.supabase.co`

Variables esperadas en `.env.local`:

```text
VITE_SUPABASE_URL=https://kfhoyvofjyvjmgtfzpuu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
GEMINI_API_KEY=...
APP_URL=http://localhost:3000
API_PORT=8787
```

No usar `service_role` en frontend.

## Modelo Supabase aplicado

Migraciones aplicadas:

- `202605010001_initial_lleken_schema.sql`
- `202605010002_add_fk_indexes.sql`
- `202605020001_fix_plant_insert_policy.sql`
- `202605020002_stop_persisting_signed_urls.sql`
- `202605020003_link_species_catalog.sql`

Tablas principales:

- `profiles`
- `care_archetypes`
- `species_catalog`
- `gardens`
- `garden_members`
- `plants`
- `plant_members`
- `plant_events`
- `plant_media`
- `environmental_logs`
- `ai_analyses`
- `diagnoses`
- `recommendations`
- `recommendation_outcomes`

RLS esta activado. Las politicas permiten:

- perfiles propios;
- lectura de catalogos por usuarios autenticados;
- creacion de plantas propias;
- lectura/escritura de plantas y eventos segun membresia;
- acceso a imagenes solo dentro de la carpeta del usuario en `plant-images`.

Nota MVP: `species_catalog` permite insertar/actualizar especies `ai_generated` o `static_catalog` desde cliente autenticado para que el flujo de nueva planta pueda llenar `species_id`. Mas adelante conviene mover esa curacion botanica a backend con service role o revision humana.

## Imagenes

Las imagenes **no se guardan en la base de datos**.

Flujo actual:

1. La app sube la imagen al bucket privado `plant-images`.
2. `plant_media.storage_path` guarda el path real del objeto.
3. `plant_media.public_url` queda `null`; no se persisten URLs firmadas porque expiran.
4. Al leer una planta, `src/lib/plants.ts` genera una URL firmada temporal para mostrar la foto.

Ejemplo de path:

```text
{uid}/{plantId}/profile/{timestamp}-{random}.jpg
```

## Flujo de nueva planta probado

Probado con usuario real autenticado por Google:

- Login con Google funciona.
- Perfil aparece en Supabase Auth.
- Crear planta funciona.
- Se guarda `plants`.
- Se guarda evento inicial en `plant_events`.
- Se guarda contexto en `environmental_logs`.
- Se sube imagen a `plant-images`.
- Se guarda metadata de imagen en `plant_media`.
- Se crea/reusa fila en `species_catalog`.
- `plants.species_id` queda enlazado cuando hay nombre comun/cientifico.

Planta de prueba confirmada:

- Nickname: `tomaco`
- Common name: `Tomate`
- Scientific name: `Solanum lycopersicum`
- Species key: `solanum-lycopersicum`
- Care archetype: `comestible_aromatica`

## Estado de Firebase

Firebase queda como referencia historica y deuda de limpieza.

Archivos que pueden seguir existiendo por compatibilidad/historia:

- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `src/lib/firebase.ts`

No asumir que Firebase es la fuente operativa actual. Si un doc antiguo contradice este archivo, este archivo manda.

## Verificaciones recientes

2026-05-02:

- `npm run check`: pasa.
- Supabase migration `link_species_catalog`: aplicada.
- Query de verificacion: la planta `tomaco` tiene `species_id` y relacion valida con `species_catalog`.
- Commit subido: `5b64fda fix: link plants to species catalog`.

## Siguientes deudas tecnicas

- Persistir salidas IA en `ai_analyses` para nueva planta y seguimiento.
- Convertir el concepto UX de historias/eventos en UI mas visible usando `plant_events`.
- Decidir si `species_catalog` seguira aceptando writes desde cliente o pasara a backend.
- Crear pruebas aisladas para Supabase: auth/session, insert de planta, storage, RLS y eventos.
- Revisar si quedan imports o chunks Firebase innecesarios despues de la migracion.
