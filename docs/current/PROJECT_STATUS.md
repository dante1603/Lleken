# Estado actual del proyecto - 2026-05-05

Este documento resume el estado operativo de Lleken despues de enviar la postulacion al concurso.

## Contexto

- La postulacion al concurso ya fue enviada.
- La postulacion posiciona Lleken como plataforma inteligente de cuidado para huertos comunitarios urbanos, con PAC como piloto real.
- El trabajo de ideacion queda sin presion inmediata por mas de un mes.
- La prioridad mas alta cambia a: tener un prototipo suficientemente solido para desplegarlo con un grupo pequeno de testeo antes del 2026-06-01.
- Supabase ya reemplazo Firebase como base operativa del flujo principal de login y creacion de plantas.
- Google Drive queda como documentacion de solo lectura por ahora, porque la edicion nativa de Docs/Sheets fallo por permisos.
- La documentacion activa y los diagramas se trabajaran primero en el repo y se exportaran a PDF cuando necesiten circular fuera del codigo.
- Las secciones que requieran intervencion directa de integrantes se postergan hasta definir mejor el flujo del equipo.

## Fuentes incorporadas el 2026-05-01

- `Lleken_Postulacion_InnovaSostenible2026.docx`: actualiza narrativa, problema, piloto PAC, equipo y roles.
- `plan_negocios.pdf`: actualiza modelo B2C + B2B/B2G, niveles de suscripcion e IoT como fase 2.
- `Investigacion_plandenegocios.pdf`: aporta contexto AgriTech, mercado municipal/B2G, megasequia y competencia.
- `PLAN_ARQUITECTURA.md` de Descargas: cruza estado tecnico, postulacion, vision de cuidado y arquitectura futura.

## Prioridad actual

Preparar un prototipo beta pequeno, estable y explicable.

En concreto, antes de crecer en features nuevas, el proyecto necesita:

- Diagramas actuales que expliquen que existe hoy y que esta pendiente.
- Un mapa claro de flujos criticos para detectar bloqueos antes del testeo.
- Documentacion tecnica vigente cerca del codigo.
- Checkpoints cortos con verificacion real.
- Un smoke test manual repetible antes de mostrar la app a testers.

## Estado funcional resumido

Funciona actualmente:

- Login con Google.
- Flujo nueva planta: foto, identificacion IA, ubicacion, clima, plan de cuidados y ficha.
- Backend local Express para desarrollo y funciones Vercel planas para produccion.
- Separacion de clave Gemini fuera del frontend.
- Primer deploy funcional en Vercel (`https://lleken.vercel.app`).
- Creacion de planta nueva confirmada en produccion con llamadas IA funcionando.
- Plan de cuidados con catalogo estatico cuando hay match y fallback conservador si Gemini falla en el plan.
- Guardado de fotos en Supabase Storage privado y datos principales en Supabase Postgres.
- Metadata de imagen en `plant_media` usando `storage_path`, no imagenes ni URLs firmadas persistidas en base.
- Catalogo botanico inicial en `species_catalog`; las plantas nuevas enlazan `species_id` cuando hay nombre comun/cientifico.
- Ficha de planta con historial acotado.
- Registro de riego, notas y seguimiento.
- Seguimiento por foto con analisis IA.
- Refresh de planta desde foto nueva con vista previa.
- Calendario con tareas derivadas del plan y del ultimo cuidado.
- Tests unitarios de normalizacion IA y logica de riego/calendario.

Vision actualizada:

- Fase 1: app inteligente para foto, clima, plan, calendario y seguimiento.
- Fase 2: hardware IoT con sensores de humedad/temperatura y posible riego automatizado.
- Segmento inicial de validacion: huerto PAC + grupo pequeno de testers.
- Escalamiento futuro: huertos comunitarios, jardines compartidos, municipalidades, ONGs, colegios y programas RSE.

Pendiente o riesgoso:

- Cuidadores: el modelo relacional esta preparado (`gardens`, `garden_members`, `plant_members`), pero falta UI y prueba con dos cuentas.
- Plantas compartidas: soporte de membresia existe en schema/RLS, pero falta flujo producto completo.
- Plan gratis: existe limite conceptual/local, pero falta UI de upgrade y politica final.
- Backend produccion: Vercel Hobby funciona para la beta si se mantiene bajo 12 funciones serverless; si crece el backend, conviene consolidar endpoints o mover IA a Cloud Run/Functions.
- Catalogo dinamico: hay `species_catalog`, pero falta curacion/revision humana y decision de backend para writes.
- IA estructurada: existen tablas `ai_analyses`, `diagnoses`, `recommendations`, pero el flujo actual aun no persiste todas las salidas IA alli.
- Firebase: quedan archivos historicos que conviene limpiar cuando confirmemos que no hay regresiones.

## Forma de documentar desde ahora

- Repo: verdad tecnica, diagramas fuente, checkpoints, estado del proyecto y cambios implementados.
- PDF: formato de lectura/entrega para compartir fuera del repo.
- Drive: referencia de solo lectura y organizacion externa mientras no tengamos edicion confiable.

## Meta de prototipo para testeo pequeno

El prototipo debe permitir que una persona externa pueda:

1. Entrar con Google.
2. Crear una planta desde foto.
3. Entender que identifico la app y que tan segura es la recomendacion.
4. Guardar la planta.
5. Ver su calendario.
6. Registrar un cuidado simple.
7. Hacer seguimiento por foto.
8. Recuperarse de errores comunes sin quedar bloqueada.

## Cierre tecnico 2026-05-02

- Supabase proyecto `kfhoyvofjyvjmgtfzpuu` quedo conectado a la app.
- Google Auth fue probado por el usuario.
- Crear planta fue probado en la UI.
- La planta de prueba `tomaco` quedo guardada con imagen en Storage, evento, log ambiental y `species_id`.
- `npm run check` pasa.
- Ultimo commit subido: `5b64fda fix: link plants to species catalog`.

## Cierre tecnico 2026-05-04

- Vercel quedo como hosting y capa de funciones serverless para la primera beta.
- Supabase sigue siendo Auth, Postgres y Storage.
- La variable `GEMINI_API_KEY` vive en Vercel y fue validada indirectamente al crear una planta real.
- Se resolvio el error de deploy por funcion inexistente `api/[...path].ts`.
- Se resolvio el limite Hobby de Vercel limpiando funciones duplicadas/diagnosticas.
- Produccion quedo bajo el limite con 7 funciones serverless.
- El usuario confirmo que pudo incluir una planta nueva en la app desplegada.
- Commit de cierre operativo: `6dab944 fix: stay under Vercel Hobby function limit`.

## Cierre tecnico 2026-05-05

- Se agregaron dos nuevas paginas: `SpeciesEncyclopedia` (`/especie/:speciesKey`) y `SpeciesMonitor` (`/dev/especies`).
- Se agregaron dos nuevas librerias: `src/lib/speciesCatalog.ts` (consulta y merge de datos de catalogo botanico desde Supabase) y `src/lib/speciesMonitor.ts` (vista agregada de especies para superficies de admin/dev).
- Se agrego la migracion `202605050001_species_monitoring.sql`: funcion `private.get_species_monitor_data()` que expone conteos y frescura por especie sin exponer filas privadas de plantas.
- Ambas rutas nuevas quedaron registradas en `App.tsx` con lazy loading.
- Se agrego `DESIGN_RULES.md` en `docs/process/` con reglas de diseno de UI/UX del proyecto.
- Se limpio carpeta accidental `Documents/` del repositorio y se agrego al `.gitignore`.
- TypeScript (`tsc --noEmit`) sin errores. Sin `console.log` de debug en `src/`.
- El estado funcional del flujo principal no cambio; estas son adiciones sin regresion al flujo existente.

## Siguiente foco documental

Trabajar los diagramas en este orden:

1. Casos de uso.
2. Flujo de usuario / navegacion.
3. Componentes / arquitectura logica.
4. Secuencia: nueva planta.
5. Secuencia: seguimiento por foto.
6. ER actual.
7. ER propuesto.
8. Estados de una planta.
9. Clases / modelo TypeScript de dominio.

Este orden prioriza explicabilidad para el equipo y el testeo pequeno antes de entrar a migraciones de datos.
