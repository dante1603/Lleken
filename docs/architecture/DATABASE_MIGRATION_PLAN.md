# Dimensionamiento de base de datos y migracion a Supabase

Fecha: 2026-05-01

## Contexto

La base actual en Firebase no contiene datos valiosos que deban preservarse. Firebase se uso porque venia nativo en Google AI Studio y permitio validar rapido:

- login con Google;
- persistencia basica;
- subida de imagenes;
- flujo de creacion de plantas.

No existe apego tecnico fuerte a Firebase. La decision abierta es si conviene migrar pronto a Supabase para montar desde cero una base mas cercana a la arquitectura final.

## Supabase como opcion real

Supabase resulta atractivo para Lleken por:

- Postgres relacional para `users`, `plants`, `gardens`, `observations`, `diagnoses` y roles.
- Row Level Security para permisos por usuario/cuidador/huerto.
- Storage integrado para fotos, guardando en base solo path/id/metadata.
- Auth con Google OAuth.
- MCP para acelerar trabajo de base de datos desde herramientas de IA.
- Experiencia previa de Matyas montando apps funcionales en Supabase.

## Plan gratuito actual segun documentacion oficial

Verificado el 2026-05-01 en docs oficiales de Supabase:

- Billing overview: <https://supabase.com/docs/guides/platform/billing-on-supabase>
- Storage pricing: <https://supabase.com/docs/guides/storage/pricing>
- Storage upload limits: <https://supabase.com/docs/guides/storage/uploads/file-limits>
- Bandwidth / egress: <https://supabase.com/docs/guides/storage/serving/bandwidth>

- Free Plan: 2 proyectos gratis.
- Database Size: 500 MB por proyecto.
- Storage Size: 1 GB.
- Storage file size limit en Free: hasta 50 MB.
- Egress/bandwidth Free: 10 GB total segun documentacion de Storage bandwidth.
- Monthly Active Users: 50.000 MAU.
- Edge Function Invocations: 500.000.

Interpretacion para Beta 1:

- Para pocos testers, Supabase Free parece suficiente si comprimimos imagenes y controlamos uploads.
- El limite mas sensible es Storage 1 GB, no la base Postgres.
- Guardar imagenes aparte y en base solo `storage_path`, `bucket`, `mime`, `size`, `created_by` es el modelo correcto.

## Que le falta a la base actual para ser ideal

La base actual esta bien para prototipo, pero no para arquitectura final.

### 1. Modelo relacional de usuarios y roles

Actual:

- `plants` tiene `ownerId`, `caregiverIds`, `memberIds`.

Ideal:

- `profiles`
- `gardens`
- `garden_members`
- `plant_members` o roles derivados desde garden.

Problema actual:

- Roles repetidos por planta.
- Un huerto con 40 plantas exige permisos repetidos.

### 2. Gardens como entidad real

Actual:

- No existe `gardens`.
- Cada planta tiene ciudad/lat/lon propia.

Ideal:

- `gardens` guarda ubicacion, ciudad, coordenadas, nombre, descripcion y owner.
- Plantas pueden pertenecer a un garden.
- Clima y tareas pueden agruparse por garden.

### 3. Historial escalable

Actual:

- `historial_acciones` es array dentro de `plants`.

Ideal:

- `observations` o `plant_events` como tabla separada:
  - riego;
  - nota;
  - foto;
  - fertilizacion;
  - plaga;
  - poda;
  - trasplante.

Problema actual:

- El documento crece.
- Consultar/paginar historial es limitado.
- Aprendizaje futuro con IA queda menos limpio.

### 4. Diagnosticos separados

Actual:

- El seguimiento se guarda dentro del historial.

Ideal:

- `diagnoses` separado de `observations`.
- Una observation con foto puede generar un diagnosis.
- El diagnosis guarda hipotesis, probabilidad, evidencia, preguntas y accion segura.

### 5. Catalogos editables

Actual:

- `plantKnowledge.ts` estatico.
- catalogo dinamico vive en memoria.

Ideal:

- `species_catalog`
- `care_archetypes`
- `pests`
- `diseases`
- `substrates`

### 6. Storage con metadata clara

Actual:

- Firebase Storage guarda imagenes.
- Firestore guarda `fotoUrl` y `fotoPath`.
- Reglas Storage no validan membresia por base nombrada.

Ideal:

- bucket `plant-images`;
- tabla `plant_images` o campos en `observations`;
- path no adivinable;
- RLS/policies conectadas a owner/member;
- base guarda metadata, no blobs.

## Dificultad estimada

### Migrar sin datos historicos

Dificultad: media.

Motivo:

- No hay que migrar datos valiosos.
- Se puede crear Supabase desde cero.
- Hay que reescribir capa de datos/auth/storage.

Riesgo principal:

- Romper el flujo actual justo antes de Beta 1.

### Actualizar Firebase al modelo ideal

Dificultad: media-alta.

Motivo:

- Firestore puede modelar subcolecciones, pero roles/gardens/reportes son menos naturales que en SQL.
- Storage Rules siguen con la friccion de base nombrada si no se migra a `(default)`.
- Consultas relacionales y reportes B2B/B2G seran mas incomodos.

### Migrar a Supabase despues de Beta 1

Dificultad: media.

Motivo:

- Beta 1 entrega aprendizaje de producto.
- La arquitectura ideal se disena con mas informacion real.
- Se evita tirar el mes a infraestructura si todavia hay fricciones UX.

## Recomendacion

La recomendacion cambia con la aclaracion de que no hay datos valiosos:

**No hay que descartar Supabase. De hecho, probablemente es la mejor base para la arquitectura final.**

Pero hay que decidir el momento.

Recomendacion practica:

1. No hacer una migracion improvisada en medio de documentacion/diagramas.
2. Hacer esta semana un spike tecnico de Supabase liderado por Matyas.
3. Si el spike demuestra login Google + tabla `plants` + storage de imagenes + RLS basica en 1-2 dias, migrar antes de Beta 1 puede ser viable.
4. Si el spike se alarga o bloquea el flujo, mantener Firebase para Beta 1 y migrar inmediatamente despues.

## Spike recomendado para dimensionar

Duracion maxima: 1-2 dias.

Objetivo:

- probar si Supabase puede reemplazar Firebase sin frenar Beta 1.

Alcance minimo:

1. Crear proyecto Supabase vacio.
2. Activar Auth Google.
3. Crear tablas:
   - `profiles`
   - `plants`
   - `plant_images`
   - `plant_events`
4. Crear bucket `plant-images`.
5. Subir una imagen comprimida.
6. Guardar en base solo path/id/metadata.
7. Leer plantas propias con RLS.
8. Hacer una prueba desde app o script.

Criterio de exito:

- login Google funciona;
- una planta se crea;
- una imagen se sube a Storage;
- una fila guarda referencia a la imagen;
- RLS impide leer plantas de otro usuario;
- Matyas confirma que puede operar schema con MCP o CLI sin friccion grave.

Criterio de corte:

- si en 2 dias no hay flujo minimo, no se bloquea Beta 1;
- Firebase sigue como base temporal;
- Supabase pasa a checkpoint posterior.

## Division en tareas pequenas

### DB-01 - Decision de ambiente

- Crear o elegir proyecto Supabase de prueba.
- Definir si sera solo spike o futuro beta.

### DB-02 - Auth Google

- Configurar OAuth Google.
- Confirmar login y `auth.users`.

### DB-03 - Schema minimo

Tablas minimas:

```sql
profiles
plants
plant_images
plant_events
```

### DB-04 - Storage minimo

- bucket `plant-images`;
- path por usuario/planta;
- limite de peso;
- tipos permitidos.

### DB-05 - RLS minimo

- owner lee/escribe su planta;
- owner lee/escribe imagenes asociadas;
- eventos pertenecen a plantas del owner.

### DB-06 - Adaptador de datos

- crear capa `src/lib/data` o equivalente;
- evitar que UI dependa directamente del proveedor.

### DB-07 - Prueba de flujo

- crear planta;
- subir foto;
- ver ficha;
- registrar riego.

### DB-08 - Decision

- migrar antes de Beta 1;
- o mantener Firebase y programar migracion despues.

## Pregunta de decision

La decision no es "Firebase o Supabase para siempre".

La decision real es:

**Podemos demostrar el flujo Supabase minimo en 1-2 dias sin sacrificar la beta individual robusta?**

Si la respuesta es si, Supabase puede entrar antes de Beta 1.

Si la respuesta es no, Firebase sigue como puente temporal y Supabase queda como arquitectura final.
