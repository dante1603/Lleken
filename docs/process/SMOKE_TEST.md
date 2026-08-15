# Lleken - Smoke Test Manual

Este checklist debe ejecutarse antes de un deploy productivo o antes de mostrar la app a testers.

## Entorno

1. Confirmar variables en `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `GEMINI_API_KEY`
   - `APP_URL`
   - `API_PORT` si se usa un puerto distinto de `8787`
2. Levantar servicios locales:

```bash
npm run dev:api
npm run dev
```

3. Abrir `http://localhost:3000`.

## 1. Autenticacion y carga inicial

Objetivo: validar que los usuarios puedan entrar y cargar datos base.

- [ ] Login con Google redirige correctamente a `/home`.
- [ ] El perfil aparece con nombre o email esperado.
- [ ] `/home` carga sin `NaN`, pantalla trabada ni errores visibles.
- [ ] La consola del navegador no muestra errores de Supabase Auth.

## 2. Journey principal: agregar planta

Objetivo: validar foto -> IA -> ubicacion -> clima -> plan -> ficha.

- [ ] Desde `/home` o navegacion inferior se puede iniciar nueva planta.
- [ ] La camara o subida de archivo funciona.
- [ ] Identificacion IA completa sin error `500`.
- [ ] Ubicacion actual o ciudad manual funciona.
- [ ] El perfil se genera y redirige a `/planta/:id`.
- [ ] La planta queda visible en `Mis plantas`.
- [ ] Supabase guarda filas relacionadas en `plants`, `plant_events`, `plant_media` y `environmental_logs`.
- [ ] La foto se muestra desde URL firmada temporal, sin persistir URL firmada como dato permanente.

## 3. Calendario y riego

Objetivo: validar que el calendario use datos guardados y actualice estado.

- [ ] `/calendar` muestra tareas basadas en plantas reales.
- [ ] Registrar riego actualiza la planta sin error de permisos.
- [ ] La tarea se recalcula o deja de aparecer como vencida/hoy.
- [ ] Al volver a ficha, el historial refleja el cuidado.

## 4. Seguimiento por foto

Objetivo: validar analisis de estado y persistencia de seguimiento.

- [ ] Desde una ficha existente se puede iniciar seguimiento.
- [ ] La foto nueva se analiza con IA.
- [ ] El resultado muestra estado, riesgo o recomendacion.
- [ ] El historial de la planta se actualiza.
- [ ] Si cambia el estado, Home/Calendario reflejan el cambio al refrescar.

## 5. Anti-popping UX-1

Objetivo: validar continuidad visual entre pantallas.

- [ ] Navegar Home -> Mis plantas -> Calendario -> Ficha -> volver.
- [ ] Si ya hay datos cacheados, no aparecen loaders de pantalla completa innecesarios.
- [ ] No se percibe recarga brusca al cambiar entre pantallas principales.
- [ ] Si hay refresco en segundo plano, la UI conserva datos utiles.

## Que hacer si falla

1. Detener deploy o prueba con testers.
2. Revisar consola del navegador y terminales.
3. Revisar errores de Supabase Auth/RLS/Storage.
4. Revisar errores Gemini, especialmente `429 RESOURCE_EXHAUSTED` o `503`.
5. Registrar el bloqueo en `docs/ai-inbox/PENDING_TASKS.md` si no se resuelve en la sesion.

Documento actualizado: 2026-06-02.
