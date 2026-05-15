# Plan de trazabilidad para endurecimiento arquitectonico

Fecha: 2026-05-15

Este plan ordena el trabajo posterior a la integracion de `mejoras-matyas`. Su objetivo es evitar cambios grandes sin evidencia y mantener una validacion humana entre etapas.

## Regla de avance

Cada etapa debe cerrar con:

- cambio acotado en una rama identificable;
- evidencia tecnica registrada en el resumen de la tarea;
- validacion humana del flujo visible cuando aplique;
- decision explicita de continuar, ajustar o revertir.

No mezclar etapas si la anterior deja un flujo central inestable.

## Estado base

- Rama de entrada: `mejoras-matyas`.
- Rama de integracion controlada: `codex/integracion-mejoras-matyas`.
- Verificacion base esperada: `npm run check`.
- Main debe recibir solo trabajo que ya paso verificacion y revision humana minima.

## Etapa 0 - Regular GitHub y base de trabajo

Objetivo: dejar las mejoras de Matyas integradas de forma clara antes de tocar arquitectura.

Alcance:

- confirmar commits incluidos en `mejoras-matyas`;
- validar que las dependencias y locks quedan coherentes;
- aceptar la carpeta `.agents/skills` como parte aprobada del repo;
- decidir si se fusiona a `main` directo o mediante PR.

Evidencia tecnica:

- `git status --short --branch`;
- `git log --oneline --decorate --graph --all -n 30`;
- `npm run check`.

Validacion humana:

- revisar que los cambios de Matyas son esperados;
- confirmar si se puede actualizar `main`.

Criterio de salida:

- `main` o una rama de integracion queda como base estable para la etapa 1.

## Etapa 1 - Crear planta como operacion confiable

Objetivo: reducir el riesgo de plantas guardadas a medias.

Problema detectado:

- `createPlantForUser` hoy coordina varias escrituras desde frontend: `plants`, `plant_events`, `environmental_logs`, `plant_media`, Storage y `species_catalog`.
- Si una escritura intermedia falla, puede quedar informacion parcial.

Direccion recomendada:

- encapsular la operacion en un contrato unico;
- definir estados recuperables para errores parciales;
- evaluar RPC/backend para escrituras transaccionales donde sea posible;
- si Storage queda fuera de transaccion, documentar compensacion o reintento.

Evidencia tecnica:

- pruebas unitarias o de integracion del caso exitoso;
- prueba forzada de fallo en evento/media si se puede aislar;
- `npm run check`.

Validacion humana:

- crear planta real en beta/local y confirmar que no queda pantalla rota;
- revisar mensaje visible ante fallo recuperable.

Criterio de salida:

- el flujo de nueva planta tiene contrato claro de exito, fallo y recuperacion.

## Etapa 2 - Persistir evidencia IA

Objetivo: separar resultado visible de evidencia auditable.

Problema detectado:

- las tablas `ai_analyses`, `diagnoses` y `recommendations` existen, pero el flujo actual guarda principalmente datos normalizados en `plants`, eventos y media.

Direccion recomendada:

- guardar cada analisis IA relevante en `ai_analyses`;
- vincular `event_id`, `media_id`, `plant_id`, modelo, payload bruto/controlado y salida normalizada;
- crear `diagnoses` cuando la IA emite hipotesis de salud, plaga, luz, sustrato o riego;
- mantener permisos: el cliente no debe escribir evidencia IA sensible si la IA corre en backend.

Evidencia tecnica:

- insercion comprobable en `ai_analyses` para creacion y seguimiento;
- lectura protegida por RLS;
- `npm run check`.

Validacion humana:

- revisar una planta creada y confirmar que la app sigue mostrando el resultado normal;
- confirmar que la evidencia queda disponible para auditoria sin ensuciar la UI.

Criterio de salida:

- una llamada IA importante deja trazabilidad persistente.

## Etapa 3 - Cerrar contrato de miembros y colaboracion

Objetivo: evitar que base, UI y casos de uso digan cosas distintas sobre plantas compartidas.

Problema detectado:

- Supabase tiene `plant_members`, `gardens` y `garden_members`, pero el mapeo frontend aun reconstruye `memberIds` como solo propietario.

Direccion recomendada:

- decidir si colaboracion queda fuera del MVP visible o entra como beta;
- si entra, cargar membresias reales desde Supabase;
- ajustar `canCareForPlant`, listados y pantallas de detalle a roles reales;
- si no entra, marcarlo explicitamente como futuro en UI/docs/UML.

Evidencia tecnica:

- prueba con planta propia;
- prueba con planta compartida o caso simulado;
- `npm run check`.

Validacion humana:

- revisar que no se promete colaboracion si no esta operativa;
- probar visibilidad con dos usuarios cuando aplique.

Criterio de salida:

- permisos visibles y permisos de base cuentan la misma historia.

## Etapa 4 - Estados explicitos del flujo

Objetivo: evitar pantallas ambiguas cuando falla IA, clima, Storage o persistencia.

Estados candidatos:

- `draft`;
- `identifying`;
- `needs_confirmation`;
- `generating_plan`;
- `saving`;
- `partial`;
- `ready`;
- `failed_recoverable`.

Evidencia tecnica:

- estados modelados en tipos o helper central;
- UI con mensajes diferenciados para fallos recuperables;
- `npm run check`.

Validacion humana:

- revisar flujo normal;
- revisar al menos un fallo simulado o fallback.

Criterio de salida:

- el usuario entiende que paso y que puede hacer cuando el flujo no termina perfecto.

## Etapa 5 - Actualizar diagramas y documentacion

Objetivo: que UML, docs y codigo no se contradigan.

Alcance:

- marcar implementado vs preparado/futuro;
- reflejar si la creacion usa contrato backend/RPC o cliente;
- reflejar persistencia de evidencia IA;
- reflejar estado real de colaboracion.

Evidencia tecnica:

- docs actualizados en `docs/current` o `docs/architecture`;
- diagramas exportados si corresponde;
- enlaces desde `docs/INDEX.md` si se agregan documentos nuevos.

Validacion humana:

- revisar diagramas con criterio de defensa/evaluacion;
- confirmar que no se sobreprometen funciones futuras.

Criterio de salida:

- el proyecto puede explicarse sin contradicciones entre repo, diagramas y demo.
