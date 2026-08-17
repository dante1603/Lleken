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

## Verificacion 2026-08-17 — arquetipos funcionales

Esta seccion contrasta el snapshot anterior con `main` al 2026-08-17. Para la direccion botanica y de dominio completa, ver `../product/FUNCTIONAL_CARE_ARCHETYPES.md`.

- `CarePlan` ya contiene `arquetipo_cuidado` y reglas estructuradas de humedad, luz, humedad ambiental, temperatura, drenaje y fertilizacion.
- `src/lib/speciesCatalog.ts` ya resuelve `care_archetypes` y puede declarar `careBasis: 'care_archetype'` cuando no existe cuidado mas especifico de especie.
- Supabase ya enlaza especies con `care_archetype_id`.
- El plan generado por IA ya exige uno de seis arquetipos actuales.
- La identificacion, en cambio, **no conserva el arquetipo como salida contractual independiente**: el prompt lo menciona, pero el JSON de identificacion y `normalizePlantIdentification` no transportan ese dato.
- Los fallbacks locales usan `aroide_tropical` internamente cuando falta un arquetipo; esto no debe considerarse un default universal seguro para plantas de jardin.

Direccion acordada: permitir que una planta permanezca como `Especie no confirmada` mientras conserva un perfil funcional inferido con procedencia y confianza propias. Especie y perfil funcional son niveles de certeza distintos. El perfil debe actuar como fallback de cuidado y nunca como confirmacion taxonomica.

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
