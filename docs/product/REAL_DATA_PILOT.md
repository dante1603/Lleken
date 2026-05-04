# Piloto con datos reales PAC

Fecha: 2026-05-04

## Contexto

El lunes 2026-05-04 empieza una nueva etapa de testing con datos reales del huerto PAC.

Datos iniciales:

- Cuenta principal: primer usuario del proyecto.
- Primer cuidador: cuenta del amigo que participa en el piloto.
- Primer caso botanico real: propagacion de matico para Dante.
- Estrategia inicial: operacion manual por detras de la primera cuenta, con mejoras de front a medida que aparezcan escenarios reales.

## Principio de trabajo

La primera fase no busca automatizar todo.

El objetivo es capturar evidencia real, ordenar datos y mejorar el producto con casos concretos:

- fotos reales;
- especie identificada;
- contexto del lugar;
- accion recomendada;
- accion tomada;
- resultado posterior;
- ajuste necesario en UI, copy, datos o algoritmo.

## Flujo manual recomendado

1. Crear o actualizar la planta desde la cuenta principal.
2. Registrar quien cuida o reporta la observacion.
3. Guardar foto inicial y contexto.
4. Generar plan con IA/catalogo.
5. Revisar manualmente el plan antes de usarlo como verdad.
6. Registrar acciones concretas como eventos: riego, cambio de ubicacion, recorte, cambio de agua, nota.
7. Hacer seguimiento con foto en pocos dias.
8. Comparar prediccion inicial contra resultado real.

## Datos que conviene empezar a capturar

- `source_context`: PAC, casa, interior, balcon, exterior, propagacion.
- `reporter`: usuario que tomo la foto o entrego el dato.
- `confidence`: confianza de identificacion y plan.
- `manual_review_status`: pendiente, revisado, corregido.
- `recommended_action`: accion sugerida.
- `actual_action`: accion tomada por la persona.
- `outcome`: mejoro, igual, empeoro, desconocido.
- `follow_up_due_at`: fecha sugerida de revision.

Estas claves pueden vivir al inicio en notas/eventos. Mas adelante deben mapearse a `ai_analyses`, `diagnoses`, `recommendations` y `recommendation_outcomes`.

## Primeras mejoras de producto esperadas

- Vista de "caso real" dentro de la ficha o historial.
- Eventos mas visibles que expliquen que paso entre foto inicial y seguimiento.
- Estado de recomendacion: sugerida, aplicada, descartada, resultado observado.
- Indicador honesto de incertidumbre.
- Mejor soporte para propagacion, esquejes y plantas que aun no estan en maceta final.

