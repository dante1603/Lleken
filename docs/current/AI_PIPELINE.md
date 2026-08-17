# Pipeline de IA y datos

La app debe separar con claridad que hace el codigo y que hace la IA. La IA no debe decidir permisos, ownership, rutas de Storage ni estructura final de Firestore.

## Flujo nueva planta

1. **Codigo: capturar y preparar imagen**
   - `Camera.tsx` recibe archivo desde camara/galeria.
   - `compressImageFile` reduce peso y entrega un data URL temporal.

2. **IA: extraer JSON botanico desde imagen**
   - `identifyPlantFromImage` recibe la imagen.
   - Devuelve nombre comun, nombre cientifico, familia, estado, puntuacion e informacion general.
   - No guarda datos.
   - El JSON se normaliza antes de llegar a la pantalla.

3. **Codigo: capturar contexto del usuario**
   - `LocationInput.tsx` pide nombre personalizado, ciudad o geolocalizacion.
   - La ubicacion es input del usuario/navegador, no de la IA.

4. **Codigo: consultar telemetria**
   - `getWeatherForPlant` resuelve coordenadas y clima real.
   - Si falla, genera un resumen conservador para que la IA no invente clima.

5. **IA: generar plan de cuidados**
   - `generateCarePlan` recibe datos botanicos + resumen de clima.
   - Devuelve solo instrucciones, frecuencia, alertas y tareas.
   - El plan se normaliza con rangos seguros para frecuencias y arrays.

6. **Codigo: persistir**
   - `createPlantForUser` crea la planta en Supabase.
   - Resuelve o crea la entrada botanica en `species_catalog` y guarda `plants.species_id`.
   - Sube foto a Supabase Storage privado (`plant-images`).
   - Guarda metadata de imagen en `plant_media` usando `storage_path`.
   - Guarda evento inicial en `plant_events`.
   - Guarda clima/contexto ambiental en `environmental_logs`.

7. **Codigo: mostrar pantalla final**
   - `PlantProfile.tsx` renderiza datos guardados.
   - La UI no depende de volver a llamar IA.

## Flujo seguimiento

1. **Codigo:** seleccionar/comprimir foto.
2. **Codigo:** cargar planta y validar permisos.
3. **IA:** `analyzeFollowUpImage` devuelve estado, puntuacion y recomendacion.
4. **Codigo:** normalizar respuesta, subir foto, actualizar planta e historial.

## Reglas de arquitectura

- Las pantallas orquestan flujo y estados visuales.
- `src/lib/ai.ts` es cliente frontend y solo llama endpoints `/api/ai/*`.
- `server/index.ts` contiene prompts, cliente Gemini y endpoints HTTP.
- `src/lib/aiSchema.ts` normaliza respuestas antes de exponerlas a pantallas o Supabase.
- `src/lib/weather.ts` contiene datos externos no-IA.
- `src/lib/plants.ts` contiene persistencia y permisos de dominio.
- En produccion, `server/index.ts` debe migrar a Cloud Functions, Cloud Run u otro backend desplegado.
- Las imagenes no se guardan en la base de datos; la base guarda paths y metadata.
- Las URLs firmadas de Storage se generan al leer, no se persisten.

## Pendiente importante

Gemini ya no se llama desde el frontend. Para desarrollo local hay que levantar la API con `npm run dev:api` y Vite con `npm run dev`.

Tambien falta persistir salidas IA completas en `ai_analyses` para nueva planta y seguimiento. La estructura de base ya existe; el flujo actual guarda los datos normalizados principales en `plants`, `plant_events`, `plant_media` y `environmental_logs`.
