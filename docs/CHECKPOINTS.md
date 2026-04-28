# Checkpoints de Lleken

## Estado al cierre de sesion — 2026-04-28

Checkpoint activo completado: **C4**
Siguiente checkpoint recomendado: **C5 — Cuidadores basicos**

### Verificaciones al cierre

- `npm run lint`: pasa.
- `npm run build`: pasa.
- `npm run check`: pasa (lint + build + tests).
- Tests unitarios: `src/lib/__tests__/ai.test.ts` y `src/lib/__tests__/plants.test.ts` pasan.
- Bundle optimizado: chunks separados para firebase (~116 kB gz), vendor (~17 kB gz) y ui.

### Advertencia de git — leer antes de tocar codigo

El ultimo commit es `dd44009 fase c1 lista`. Todo el trabajo de C2, C3 y C4 existe como cambios locales sin commit. Antes de iniciar C5, hacer commit de este estado:

```bash
git add .
git commit -m "fase c2-c4 completa: ficha, calendario, calidad y tests"
```

### Archivos nuevos desde el ultimo commit (no trackeados aun)

- `docs/SMOKE_TEST.md`: checklist manual de pruebas antes de deploy.
- `src/lib/__tests__/ai.test.ts`: tests de normalizacion IA.
- `src/lib/__tests__/plants.test.ts`: tests de logica de riego y calendario.
- `src/lib/plantFormatters.ts`: funciones de formato separadas de la UI.

### Lo que cambio en C2–C4

C2 (ficha e historial): `PlantProfile.tsx`, `src/lib/plants.ts`, `src/types/index.ts` — ficha consistente, historial funcional, logica de dominio separada.

C3 (calendario real): `Calendar.tsx` — tareas derivadas de `riego_frecuencia_dias` y `seguimiento_foto_dias`, ajustadas por clima, marcables como realizadas.

C4 (calidad): `vite.config.ts` (manualChunks), textos corregidos, tests agregados, `docs/SMOKE_TEST.md` creado, `src/lib/aiSchema.ts` con arquetipos y reglas de sustrato/luz.

### Deuda conocida al cierre

- Limite del plan gratis documentado pero aun no bloquea creacion de plantas.
- Flujo de cuidadores preparado en modelo de datos (`caregiverIds`, `memberIds`) pero sin UI.
- La base Firestore es nombrada (`ai-studio-e42563f0-...`); Storage Rules no puede validar membresia contra ella hasta migrar a `(default)`.
- `server/index.ts` debe migrar a Cloud Functions o Cloud Run antes de produccion real.
- Bundle de produccion aun supera el umbral de advertencia de Vite (deuda aceptada).

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

Estado: completo

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
- API local levanta con `npm run dev:api` (ahora con auto-reload gracias a `tsx watch`).
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

Estado: completo

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

Estado: completo

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

Estado: completo

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

---

## C5 - Cuidadores basicos

Estado: pendiente

Objetivo:

- Permitir que el dueno de una planta invite a un cuidador, y que ese cuidador pueda ver y registrar cuidados en la planta compartida.

Por que ahora: el modelo de datos ya esta preparado (`caregiverIds`, `memberIds`). Este checkpoint hace que eso sea visible y usable desde la UI, sin tener que cambiar Firestore ni las reglas.

Alcance:

- `src/pages/PlantProfile.tsx`: agregar seccion "Cuidadores" que muestre quienes tienen acceso y un boton para invitar.
- `src/lib/plants.ts`: agregar funcion `addCaregiverToPlant(plantId, caregiverUid)` que actualice `caregiverIds` y `memberIds`.
- `src/pages/Profile.tsx` o nueva pantalla: mostrar plantas donde el usuario es cuidador (no dueno).
- `src/lib/plants.ts`: ajustar la consulta de listado para incluir plantas donde `memberIds` contiene el uid del usuario (ademas de las propias).
- Probar reglas Firestore con un segundo usuario antes de asumir que funcionan.

Fuera de alcance en este checkpoint:

- UI de invitacion por email o link (requiere Cloud Functions o un flujo de email separado).
- Diferenciacion de permisos granulares entre dueno y cuidador (se puede agregar en C6).
- Migracion de la base Firestore a `(default)`.

Checklist:

- El dueno puede agregar un cuidador por UID o email (busqueda basica en `users`).
- El cuidador ve la planta en su listado.
- El cuidador puede registrar riego y seguimiento.
- El cuidador no puede eliminar la planta ni cambiar el dueno.
- Las reglas Firestore existentes en `firestore.rules` cubren este flujo; si no, ajustarlas.
- La planta compartida no consume cupo del plan gratis del cuidador.

Verificacion:

- `npm run lint`
- `npm run build`
- Prueba manual con dos cuentas Google distintas en localhost.
- Confirmar en Firebase Console que `caregiverIds` y `memberIds` se actualizan correctamente.

Riesgos:

- Las reglas de Firestore pueden no estar desplegadas a la base nombrada. Ver `docs/FIREBASE.md`.
- El listado por `memberIds` requiere un indice compuesto en Firestore; si la consulta falla, Firebase Console mostrara un enlace directo para crearlo.
