# Checkpoints de Lleken

Estado inicial registrado el 2026-04-28:

- `npm run lint`: pasa.
- `npm run build`: pasa.
- `npm run check`: pasa fuera del sandbox local cuando Vite/esbuild requiere iniciar proceso.
- Advertencia actual: bundle JS principal sobre 500 kB.
- Hay cambios locales sin commit en varias pantallas, librerias y servidor.

## C0 - Orden operativo

Estado: completo

Objetivo:

- Dejar un sistema de trabajo claro para que el proyecto avance por ciclos verificables.

Alcance:

- Documentar flujo de trabajo.
- Documentar checkpoints.
- Agregar comando unico de verificacion.

Verificacion:

- `npm run lint`
- `npm run build`
- Revisar que `docs/WORKFLOW.md` y este archivo expliquen como seguir.

Resultado:

- `npm run check` pasa.
- Queda C1 como siguiente checkpoint activo recomendado.

Salida esperada:

- Equipo trabaja con un checkpoint activo por vez.
- Cada cierre deja evidencia de comandos y prueba manual.

## C1 - Baseline funcional del flujo nueva planta

Estado: en progreso

Objetivo:

- Confirmar que el flujo foto -> identificacion -> ubicacion -> plan -> ficha funciona completo en local.

Alcance:

- `src/pages/Camera.tsx`
- `src/pages/IdentifyPlant.tsx`
- `src/pages/LocationInput.tsx`
- `src/pages/GeneratingProfile.tsx`
- `src/pages/PlantProfile.tsx`
- `src/lib/ai.ts`
- `src/lib/plants.ts`
- `server/index.ts`

Checklist:

- Referencia visual `nuevaplanta.md` integrada en las pantallas reales del flujo.
- La IA puede devolver `contexto_inferido` con valores visibles desde la foto o `null` cuando no pueda determinar.
- El formulario de ubicacion muestra sugerencias al escribir y permite guardar coordenadas precisas.
- Geolocalizacion intenta resolver comuna/ciudad y rellena el campo en vez de solo mostrar estado.
- API local levanta con `npm run dev:api`.
- Vite levanta con `npm run dev`.
- Se puede seleccionar o tomar una foto.
- La IA responde desde backend, no desde frontend.
- La ubicacion puede ingresarse manualmente.
- El plan se genera con clima o fallback controlado.
- La planta se guarda con `ownerId`, `memberIds`, `fotoUrl` y `fotoPath`.
- La ficha abre sin depender de llamar IA otra vez.

Verificacion:

- `npm run lint`
- `npm run build`
- Prueba manual creando una planta de prueba.

Riesgos:

- Creditos o clave Gemini.
- Reglas Firebase no desplegadas a la base correcta.
- Permisos de Storage limitados por base Firestore nombrada.

## C2 - Ficha de planta e historial

Estado: pendiente

Objetivo:

- Hacer que la ficha sea confiable y no acumule logica duplicada.

Alcance:

- Mostrar datos guardados de manera consistente.
- Registrar riego, notas y seguimiento.
- Separar calculos reutilizables fuera de la UI si crecen demasiado.
- Confirmar que historial no se rompe con plantas legacy.

Verificacion:

- `npm run lint`
- `npm run build`
- Crear planta, registrar riego, registrar nota y volver a abrir ficha.

## C3 - Calendario real

Estado: pendiente

Objetivo:

- Convertir el calendario en una vista accionable basada en planes guardados.

Alcance:

- Generar tareas desde frecuencia de riego y seguimiento.
- Marcar tareas realizadas.
- Reflejar cambios en historial/planta.
- Evitar tareas fijas que ignoren clima o ultimo cuidado.

Verificacion:

- `npm run lint`
- `npm run build`
- Probar calendario con al menos dos plantas.

## C4 - Calidad y deuda visible

Estado: pendiente

Objetivo:

- Reducir fragilidad antes de crecer en funciones.

Alcance:

- Corregir mojibake en textos.
- Agregar primeros tests de dominio para normalizacion IA y calculos de calendario.
- Revisar lazy loading o chunking para bajar advertencia de bundle.
- Documentar smoke test de release.

Verificacion:

- `npm run lint`
- `npm run build`
- Tests agregados pasan.
- Build sin advertencias criticas o con deuda registrada.
