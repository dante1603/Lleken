# Modelo de cuidado por factores y convergencia de riesgo

Fecha: 2026-08-17
Estado: dirección canónica de producto/dominio; implementación pendiente.

## Decisión central

La recomendación de cuidados de Llekén no debe salir de una etiqueta única ni de un calendario fijo. Debe resultar de la **composición de factores independientes que cambian en el tiempo**, parametrizados por lo que sabemos de la planta y su contexto.

Los arquetipos funcionales definidos en `FUNCTIONAL_CARE_ARCHETYPES.md` son útiles como **priors/defaults de parámetros**, especialmente cuando la especie no está confirmada. No son el motor de decisión final.

La forma conceptual es:

`identidad/perfil -> tolerancias y curvas base -> estado + ambiente + historial -> contribuciones de riesgo -> interacciones -> recomendación revisable`

## Principio: la planta es un sistema dinámico

Una planta no tiene un único "estado de salud" suficiente para decidir cuidados. Hay variables diferentes que evolucionan con ritmos distintos y cuya combinación genera riesgos específicos.

Ejemplos de dimensiones relevantes:

- humedad del sustrato/zona radicular;
- balance hídrico y tiempo desde riegos/lluvias;
- luz recibida y luz acumulada;
- temperatura actual, extremos y duración de exposición;
- humedad atmosférica / demanda evaporativa cuando esté disponible;
- drenaje, aireación y tipo/volumen de sustrato;
- ubicación: interior, maceta, balcón, suelo exterior;
- fase de establecimiento: recién plantada vs establecida;
- crecimiento/estación/fenología cuando se conozca;
- síntomas visuales y su trayectoria;
- plagas/enfermedades como hipótesis separadas;
- intervenciones recientes: poda, trasplante, fertilización, tratamiento, cambio de lugar.

No todas son observables hoy. El modelo debe distinguir siempre:

- **observado**: dato aportado/medido;
- **derivado**: cálculo desde datos observados;
- **inferido**: estimación de IA o heurística;
- **desconocido**: sin evidencia suficiente.

Nunca rellenar un estado desconocido como si fuera observado.

## Curvas por factor

Cada factor debe poder convertirse en una contribución de idoneidad/riesgo relativa a la especie o perfil funcional.

Ejemplo conceptual para temperatura:

- dentro de zona cómoda -> riesgo térmico bajo;
- acercándose al límite -> riesgo sube gradualmente;
- fuera del rango seguro -> riesgo sube con fuerza;
- duración de la exposición modifica el impacto.

Lo mismo aplica a humedad del sustrato, luz, déficit hídrico, humedad ambiental u otros factores.

No asumir que las curvas son simétricas ni lineales. Una especie puede tolerar mucho mejor sequía moderada que encharcamiento, o viceversa.

Representación conceptual:

```ts
interface FactorState {
  key: string;
  value?: number | string | boolean;
  observedAt?: number;
  provenance: 'observed' | 'derived' | 'ai_inferred' | 'unknown';
  confidence?: 'alta' | 'media' | 'baja';
}

interface FactorResponse {
  factor: string;
  suitability?: number; // 0..1
  risk?: number;        // 0..1
  evidence: string[];
  uncertainty: number;  // 0..1
}
```

Los tipos exactos no son todavía contrato de implementación.

## El riesgo aparece por convergencia

La recomendación no debe ser simplemente `si X entonces Y`. Un riesgo puede emerger cuando varias curvas desfavorables coinciden.

Ejemplos:

### Riesgo de pudrición / exceso de agua

Convergencia típica:

- sustrato húmedo;
- drenaje deficiente;
- temperatura baja;
- poca luz / baja demanda hídrica;
- riego reciente o repetido;
- síntomas compatibles.

Una sola señal no confirma pudrición. Varias señales coherentes elevan el riesgo y justifican una acción conservadora como esperar, mejorar aireación o pedir inspección.

### Riesgo de deshidratación / estrés hídrico

Convergencia típica:

- sustrato seco;
- alta temperatura;
- alta radiación/luz;
- aire seco o alta demanda evaporativa;
- planta recién establecida o con poca reserva radicular;
- marchitez compatible.

### Riesgo de quemadura térmica/lumínica

Convergencia típica:

- exposición solar alta;
- temperatura extrema;
- cambio reciente desde sombra/interior;
- tejido joven o no aclimatado;
- síntomas localizados compatibles.

### Riesgo por fertilización inadecuada

Convergencia típica:

- baja luz o crecimiento lento;
- frío/estación de baja actividad;
- fertilización reciente;
- sustrato seco o acumulación probable de sales;
- síntomas compatibles.

## No es una suma estrictamente lineal

La primera implementación puede usar una suma ponderada interpretable, pero el diseño debe reservar interacciones.

Conceptualmente, para un riesgo `k`:

```text
R_k(t) = f(
  contribuciones individuales,
  interacciones entre factores,
  exposición acumulada,
  velocidad de cambio,
  historial reciente,
  incertidumbre
)
```

Una aproximación inicial explicable puede ser:

```text
score = Σ(w_i * r_i) + Σ(w_ij * r_i * r_j) + memoria_temporal
```

Luego se normaliza a una escala de riesgo/confianza.

Los términos `w_ij` importan porque factores ambientales combinados pueden tener efectos no aditivos. El modelo debe poder aprender o recalibrar estas interacciones con datos reales en el futuro.

## Tiempo: estado, derivada e integral

La dimensión temporal es central y conecta con `docs/architecture/PREDICTIVE_AI_MODEL.md`.

Llekén debería distinguir al menos:

- **nivel actual**: cómo está el factor ahora;
- **derivada/tendencia**: está mejorando, empeorando o cambiando rápido;
- **exposición acumulada**: cuánto estrés recibió durante una ventana;
- **recencia**: cuánto tiempo pasó desde un riego, lluvia, poda, trasplante o cambio ambiental;
- **persistencia**: una anomalía aislada vs varios días/eventos consecutivos.

Ejemplos:

- 32 °C durante 20 minutos no equivale a varios días de calor intenso;
- sustrato húmedo hoy puede ser normal tras un riego, pero es preocupante si sigue saturado demasiado tiempo;
- una foto con una hoja amarilla aislada pesa menos que una tendencia progresiva en varias revisiones.

## Papel de especie y arquetipo

La identidad botánica no produce directamente la acción. Produce **parámetros del modelo**.

Ejemplo:

```text
Monstera conocida
  -> curva de humedad: tolera humedad moderada, penaliza saturación prolongada
  -> curva de luz: óptimo indirecto brillante
  -> rango térmico aproximado
  -> sensibilidad conocida a ciertos contextos

Especie desconocida + perfil xerófito
  -> curvas más amplias hacia sequía
  -> penalización fuerte por saturación/drenaje pobre
  -> confianza menor
```

Por tanto:

`especie revisada > especie conocida > perfil funcional > fallback neutral`

pero todos alimentan el mismo motor factorial.

## Riesgo, recomendación y diagnóstico son cosas distintas

El sistema debe separar:

1. **estado/factor**: "sustrato observado húmedo";
2. **riesgo**: "la convergencia actual aumenta riesgo de exceso de agua";
3. **hipótesis diagnóstica**: "pudrición es una causa posible";
4. **recomendación**: "no regar todavía y revisar drenaje";
5. **resultado posterior**: "la planta mejoró/no cambió/empeoró".

Esto evita convertir síntomas ambiguos en diagnósticos falsos.

## Arquitectura de decisión propuesta

```text
              ┌─ especie / ficha revisada ─┐
foto/contexto ├─ perfil funcional inferido ├──> parámetros/tolerancias
              └─ fallback neutral ─────────┘
                            │
                            v
        ┌──────── estados y observaciones ────────┐
        │ humedad │ luz │ temp │ drenaje │ etapa │
        │ clima   │ síntomas │ historial │ etc.  │
        └─────────────────────────────────────────┘
                            │
                            v
                  curvas por factor
                            │
              ┌─────────────┴─────────────┐
              v                           v
      riesgo individual            interacción temporal
              └─────────────┬─────────────┘
                            v
                  riesgos convergentes
                            │
                            v
             acción segura + explicación
                            │
                            v
                 resultado observado
                            │
                            └──> recalibración futura
```

## Estado actual del código relevante

En `main` al 2026-08-17 existe una base parcial:

- `CarePlan` ya estructura humedad, luz, temperatura, drenaje y arquetipo;
- `careDecision.ts` convierte una observación física de humedad en una recomendación segura, pero hoy esa decisión es deliberadamente simple y depende casi solo de humedad + regla de sustrato;
- `PREDICTIVE_AI_MODEL.md` ya propone derivadas discretas, integrales acumuladas, medias móviles, distancia de idoneidad y actualización bayesiana;
- clima, observaciones, historial y seguimiento ya existen en distintas partes del producto.

La brecha no es conceptual desde cero: falta **unificar esos datos en un motor de evaluación multifactorial** sin romper la separación entre hechos, inferencias y recomendaciones.

## Primera implementación razonable

No empezar con ML complejo. Hacer un motor determinista, explicable y testeable.

Fase inicial sugerida:

1. seleccionar 3 riesgos de alto valor:
   - exceso de agua/pudrición;
   - déficit hídrico/calor;
   - estrés de luz/temperatura;
2. definir 4–6 factores medibles/inferibles para cada riesgo;
3. normalizar cada factor a `0..1` con curvas simples por especie/perfil;
4. agregar pocos términos de interacción explícitos;
5. conservar incertidumbre y procedencia;
6. producir una recomendación segura + razones enumerables;
7. registrar resultado para calibración futura.

Esto permite que más adelante datos reales ajusten pesos, umbrales y curvas sin rediseñar el dominio.

## Tests esperados

### Automatizados

- misma humedad produce decisiones distintas según tolerancia funcional;
- humedad alta + frío + poca luz aumenta más el riesgo que cada factor aislado;
- sustrato seco + calor + alta luz eleva riesgo hídrico;
- dato desconocido aumenta incertidumbre, no se reemplaza por un valor inventado;
- especie revisada sobreescribe defaults del arquetipo;
- el historial temporal cambia la salida (recién regada vs humedad persistente);
- ningún riesgo se convierte automáticamente en diagnóstico confirmado.

### Validación humana

Las pruebas manuales deberían pedir a Dante revisar escenarios visibles, no solo "si la pantalla funciona":

- suculenta húmeda en ambiente frío/poca luz;
- aromática mediterránea seca pero estable;
- tomate en calor con sustrato secándose;
- helecho con baja humedad ambiental;
- árbol recién plantado vs árbol establecido;
- misma planta antes/después de cambio brusco de exposición.

El criterio humano es: ¿la recomendación y su explicación parecen coherentes con el conjunto de evidencia y dejan claro qué dato falta?

## Fuentes conceptuales

- Poorter H. et al. (2010), *A method to construct dose-response curves for a wide range of environmental factors and plant traits by means of a meta-analysis of phenotypic data*. Journal of Experimental Botany. DOI: 10.1093/jxb/erp358.
- Pons T.L. et al. (2022), *MetaPhenomics: quantifying the many ways plants respond to their abiotic environment, using light intensity as an example*. Plant and Soil.
- La literatura de estrés combinado muestra que sequía, calor, luz, salinidad y otros estresores pueden interactuar de forma no aditiva; por eso las interacciones deben ser parte explícita del diseño y no tratarse como una suma rígida.

## Relación con otros documentos

- `FUNCTIONAL_CARE_ARCHETYPES.md`: define cómo obtener priors funcionales cuando la especie es incierta.
- `../architecture/PREDICTIVE_AI_MODEL.md`: contiene la dirección histórica de prior -> evidencia -> posterior y herramientas temporales/matemáticas; este documento la concreta para decisiones de cuidado.
- `PLANT_CARE_RESEARCH.md`: conserva la evidencia botánica práctica sobre riego, luz, temperatura, humedad y plagas.

Este documento gobierna específicamente **cómo deben combinarse los factores para producir riesgo y recomendación**, hasta que una fuente posterior lo reemplace explícitamente.
