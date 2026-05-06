# Modelo predictivo progresivo

Fecha: 2026-05-04

Fuente inicial: `Arquitectura_IA_Kellu_Lleken.md`

## Idea central

Lleken debe partir con una prediccion minima y mejorar con evidencia.

En la primera fase, el sistema puede operar con:

- foto;
- especie probable;
- ubicacion;
- clima externo;
- plan botanico base;
- seguimiento manual.

Luego, cuando existan mas datos reales, sensores o hardware Kellu, la prediccion se recalibra con observaciones.

## Capas del modelo

### 1. Prior inicial

La IA y el catalogo botanico generan una hipotesis:

- especie;
- estado;
- riesgo principal;
- plan de cuidado;
- confianza.

Esta hipotesis no es verdad absoluta. Es una inferencia inicial.

### 2. Evidencia

Cada evento real mejora o corrige la hipotesis:

- riego;
- poda;
- cambio de ubicacion;
- cambio de agua;
- foto de seguimiento;
- comentario del cuidador;
- clima local;
- sensor futuro.

### 3. Posterior

El sistema compara lo recomendado contra lo ocurrido:

- la planta mejoro;
- no cambio;
- empeoro;
- la persona no aplico la recomendacion;
- el dato era insuficiente.

Ese resultado debe alimentar `recommendation_outcomes` cuando el flujo este listo.

## Logicas matematicas utiles

- Derivada discreta: detectar si humedad, salud visual o riesgo cambian rapido.
- Integral acumulada: estimar luz, agua o exposicion acumulada durante un periodo.
- Medias moviles: suavizar ruido en sensores o mediciones visuales.
- Distancia de idoneidad: comparar vector ideal de especie contra ambiente real.
- Actualizacion bayesiana: subir o bajar confianza con nueva evidencia.

## Aplicacion al caso matico

Prior:

- Matico por morfologia foliar y tallo semilenoso.
- Preparacion de esqueje aceptable.
- Riesgo por baja luz.

Evidencia siguiente:

- foto a 3 dias;
- turgencia de hojas;
- claridad del agua;
- aparicion de raices;
- confirmacion de traslado a luz indirecta.

Posterior esperado:

- Si las hojas siguen firmes y el agua esta clara, mantener plan.
- Si hay marchitez, reducir hoja y revisar luz/temperatura.
- Si la base se oscurece, registrar riesgo de pudricion y cambiar estrategia.

## Regla para el producto

La UI debe mostrar recomendaciones como decisiones revisables:

- "Lleken cree que..."
- "Confianza inicial..."
- "Prueba segura ahora..."
- "Revisar en..."
- "Resultado observado..."

Esto ayuda a testear sin prometer automatizacion perfecta antes de tener datos suficientes.

