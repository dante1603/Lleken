# Traspaso para proximo chat

Fecha: 2026-05-05

## Frase para retomar

```text
Vamos con el anti-popping de Lleken. Lee docs/process/NEXT_CHAT_HANDOFF.md, docs/product/BETA_UX_AND_TESTING_PLAN.md y docs/architecture/PLANT_CREATION_V2.md, y comienza a trabajar desde UX-1.
```

## Contexto que no se debe perder

En esta sesion se decidio que antes de redisenar fuerte o construir jardines conviene resolver la sensacion de popping/recarga entre pantallas.

El problema observado por Dante:

- al cambiar de ventana la app recarga datos;
- se ve un popping molesto;
- Home se siente poco util;
- el flujo crear planta se siente rigido;
- Dante suele ir directo a "Mis plantas";
- ya existen 4 usuarios registrados en Supabase, suficientes para probar jardines, grupos y compartir plantas;
- tambien se quiere agregar un boton para que testers reporten bugs/mejoras desde la app.

## Orden logico acordado

1. **UX-1: Anti-popping y estado compartido**
   - Crear cache/contexto compartido para plantas visibles y planta actual.
   - Reutilizar datos entre Home, Mis plantas, Calendario y Perfil.
   - Mostrar datos cacheados inmediatamente y refrescar en segundo plano.
   - Evitar loaders de pantalla completa si ya hay datos recientes.
   - Mantener el comportamiento actual, solo mejorar fluidez.

2. **UX-2: Home util**
   - Convertir Home en centro de accion.
   - Mostrar cuidados de hoy, plantas en riesgo, acciones rapidas, actividad reciente y acceso a feedback.
   - Evaluar si Home debe seguir siendo pantalla principal o si "Mis plantas" debe tomar mas protagonismo.

3. **UX-3: Crear planta menos rigido**
   - Preparar entrada flexible: foto, manual, problema/sintoma, plaga, jardin, borrador.
   - No romper el flujo actual de foto con IA.

4. **UX-4: Feedback de testers**
   - Boton "Reportar bug/mejora".
   - Formulario simple.
   - Guardar en Supabase, idealmente tabla `tester_feedback`.

5. **UX-5: Jardines v1**
   - Crear jardin.
   - Agregar planta a jardin.
   - Probar miembros con 4 usuarios actuales.
   - Roles: owner, caregiver, viewer.

6. **UX-6: Compartir planta individual**
   - Mantenerlo separado de jardines.
   - Caso simple: compartir una planta con cuidador u observador.

## Archivos importantes

- `docs/product/BETA_UX_AND_TESTING_PLAN.md`: plan beta de UX, Home, jardines, feedback y anti-popping.
- `docs/architecture/PLANT_CREATION_V2.md`: modelo de creacion flexible, diagnosticos, observaciones, plagas y tolerancia a fallos.
- `docs/current/DATABASE_STATE.md`: estado real de Supabase.
- `src/lib/plants.ts`: capa actual de datos de plantas.
- `src/pages/Home.tsx`: pantalla Home a mejorar despues del anti-popping.
- `src/pages/PlantsList.tsx`: Mis plantas.
- `src/pages/Calendar.tsx`: calendario.
- `src/pages/PlantProfile.tsx`: ficha de planta.

## Primer trabajo concreto: UX-1

Objetivo:

Mejorar la navegacion sin cambiar la funcionalidad visible.

Implementacion probable:

- Crear `src/contexts/PlantDataContext.tsx` o equivalente.
- Mover carga de plantas visibles desde pantallas sueltas a una capa compartida.
- Exponer:
  - `plants`;
  - `loading`;
  - `refreshPlants`;
  - `getPlantById` o cache de planta actual;
  - estados de error no invasivos.
- Actualizar Home, PlantsList y Calendar para usar el contexto.
- PlantProfile puede usar planta cacheada primero y refrescar luego.

Verificacion:

- Navegar Home -> Mis plantas -> Calendario -> Ficha -> volver sin loaders/popping innecesarios.
- `npm run check` debe pasar.

## Cuidado importante

No empezar rediseño visual grande antes de resolver UX-1. El anti-popping es el piso para que Home, jardines y crear planta v2 se sientan bien.
