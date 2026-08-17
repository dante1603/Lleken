# Informe botánico de implementación — motor de cuidados por factores

Fecha: 2026-08-17  
Estado: referencia de implementación para la próxima misión técnica.  
Ámbito: plantas comunes de interior, maceta, jardín y huerto; prioridad a casos frecuentes y a decisiones de cuidado seguras.

## 0. Resumen ejecutivo

El problema no es que Llekén necesite “más consejos botánicos”. El problema es que un plan de cuidado estático o un arquetipo único no representa cómo una planta entra en riesgo.

La dirección correcta es:

```text
identidad botánica / perfil funcional
        ↓
parámetros y tolerancias de partida
        ↓
estados observados + ambiente + historial
        ↓
curvas de respuesta por factor
        ↓
interacciones + duración + tendencia
        ↓
riesgos específicos con incertidumbre
        ↓
acción segura y explicable
        ↓
resultado observado / recalibración futura
```

**Los arquetipos no deciden el cuidado.** Solo aportan priors o defaults cuando la especie no está confirmada. El motor de cuidado debe trabajar con factores independientes que varían en el tiempo.

Ejemplo:

- “parece una suculenta” permite asumir provisionalmente alta importancia del drenaje y mayor tolerancia a sequedad;
- no permite concluir “regar cada 14 días”;
- si además observamos sustrato todavía húmedo, frío, poca luz y riego reciente, convergen señales de riesgo por exceso de agua;
- si la misma planta está seca, caliente y con alta demanda evaporativa, la recomendación puede cambiar.

Este documento concentra la botánica necesaria para implementar la primera versión del motor sin exigir que el agente vuelva a investigar la premisa desde cero.

---

# 1. Problema a resolver

## 1.1 El modelo “especie → calendario” es demasiado rígido

Una especie puede tener un rango típico de cuidados, pero la acción correcta hoy depende del estado actual y del contexto.

Un intervalo como `riego_frecuencia_dias = 7` falla porque siete días pueden significar condiciones completamente distintas según:

- estación y temperatura;
- radiación/luz;
- demanda atmosférica;
- maceta vs suelo;
- volumen de sustrato;
- drenaje;
- lluvia;
- tamaño y estado de raíces;
- etapa de establecimiento;
- riego anterior;
- crecimiento activo o reposo.

Por eso la frecuencia calendario debe ser una **estimación de revisión**, no una orden automática de riego.

## 1.2 El modelo “arquetipo → cuidado” también es insuficiente

Un arquetipo funcional sigue siendo útil, pero debe aportar parámetros, no una receta final.

Ejemplo: `mediterranea_xerica` puede aportar priors como:

- preferencia por alta luz;
- alta importancia del drenaje;
- tolerancia relativamente mayor a períodos secos;
- mayor penalización por humedad radicular persistente.

Pero el cuidado actual debe salir del estado real.

## 1.3 Los factores no son una suma lineal simple

Las plantas experimentan estresores simultáneos o secuenciales. La literatura sobre estrés combinado muestra que sequía + calor, luz + sequía y otras combinaciones pueden producir respuestas no aditivas y dependientes de intensidad, tiempo y especie.

Por tanto:

```text
riesgo != humedad + temperatura + luz de forma rígida
```

Debe existir capacidad para interacciones.

## 1.4 Estado, riesgo, diagnóstico y acción no son equivalentes

El dominio debe mantener separados:

1. **estado**: “el sustrato fue observado húmedo”;
2. **riesgo**: “la combinación actual eleva riesgo de exceso de agua”;
3. **hipótesis**: “daño radicular/pudrición es posible”;
4. **recomendación**: “no regar todavía; revisar drenaje y persistencia de humedad”;
5. **resultado**: “mejoró / se mantuvo / empeoró”.

Una hoja amarilla, marchitez o una foto ambigua nunca deben convertirse por sí solas en diagnóstico confirmado.

---

# 2. Fundamento botánico que gobierna el diseño

Esta sección resume lo que el implementador debe tomar como premisa de dominio.

## 2.1 El balance hídrico depende de oferta y demanda

Una planta no “necesita agua” solo porque el sustrato esté seco ni deja de necesitarla solo porque la humedad ambiental sea alta.

Hay al menos dos lados del sistema:

- **oferta hídrica**: agua accesible en sustrato/suelo + capacidad de las raíces para captarla;
- **demanda atmosférica**: pérdida potencial de agua por transpiración, influida por temperatura, humedad del aire/VPD, radiación y área foliar.

La literatura de hidráulica vegetal muestra que la respuesta a secado del suelo y la respuesta a VPD son procesos relacionados pero distinguibles, con escalas temporales distintas y con interacción entre sí.

**Implicación de producto:** humedad del suelo y demanda atmosférica deben ser factores separados.

## 2.2 El VPD es conceptualmente mejor que “humedad ambiental” aislada

La humedad relativa cambia de significado con la temperatura. Cuando sea posible derivarlo desde temperatura + humedad relativa, el déficit de presión de vapor (VPD) representa mejor la demanda evaporativa atmosférica.

Para una primera implementación:

- si hay temperatura + humedad relativa confiables, puede calcularse un `atmosphericDemand` derivado;
- si no, mantener temperatura y humedad como factores independientes con menor precisión;
- no inventar VPD si faltan datos.

No usar un único umbral universal de VPD para todas las plantas: las respuestas varían entre especies y estrategias hidráulicas.

## 2.3 Saturación prolongada amenaza raíces por falta de oxígeno

En suelos o sustratos saturados, el agua desplaza aire de los poros. La mayoría de las plantas de jardín no está adaptada a anegamiento continuo; el mal drenaje puede asfixiar raíces y favorecer deterioro/pudrición.

**Implicación:** el riesgo por exceso de agua no depende solo de “cuánta agua se aplicó”, sino especialmente de:

- estado de humedad;
- duración de humedad alta;
- drenaje/aireación;
- temperatura;
- demanda de agua de la planta.

## 2.4 Sequía y calor convergen

La combinación de suelo seco + alta demanda atmosférica puede causar una limitación hidráulica mucho mayor que cada factor considerado por separado.

**Implicación:** el motor debe tener un término de interacción entre sequedad de zona radicular y demanda evaporativa/calor.

## 2.5 La respuesta cambia con duración y velocidad

Una exposición puntual no equivale a una condición persistente.

Debe distinguirse:

- valor actual;
- tiempo acumulado fuera del rango;
- rapidez del cambio;
- recurrencia;
- tiempo desde la última intervención.

Ejemplos:

- sustrato húmedo inmediatamente después del riego puede ser normal;
- sustrato que continúa muy húmedo durante demasiado tiempo es otra señal;
- un día caliente no equivale a una ola de calor;
- una planta movida bruscamente desde sombra a sol fuerte puede sufrir aun cuando una planta ya aclimatada de la misma especie tolere esa luz.

## 2.6 La etapa de establecimiento cambia el riesgo hídrico

Árboles y arbustos recién plantados requieren riego más regular mientras las raíces se expanden. Una planta leñosa ya establecida puede tolerar períodos mucho más largos usando un volumen radicular mayor.

**Implicación:** `establishment` debe ser modificador independiente, no otro arquetipo taxonómico.

Valores iniciales de dominio:

```ts
type EstablishmentState =
  | 'newly_planted'
  | 'establishing'
  | 'established'
  | 'unknown';
```

No copiar frecuencias exactas de guías de una región como calendario universal. Usarlas para justificar que el estado de establecimiento cambia fuertemente la frecuencia/volumen y la sensibilidad a déficit hídrico.

## 2.7 Las suculentas son un buen arquetipo, pero tienen excepciones

Muchos cactus y suculentas almacenan agua, toleran sequía y requieren sustrato muy drenante. El exceso de agua prolongado puede producir daño radicular y pudrición.

Excepción importante: cactus epífitos de bosque, como Schlumbergera/Epiphyllum/Rhipsalis, tienen estrategias de agua/luz distintas.

**Implicación:** una morfología suculenta puede dar un prior xerófito, pero la identificación o evidencia de hábito epífito debe poder sobreescribirlo.

## 2.8 Las aromáticas mediterráneas forman un grupo útil

Romero, tomillo, salvia, orégano/mejorana y ajedrea comparten condiciones horticulturales suficientemente parecidas como para un preset funcional: sol y drenaje alto, evitando raíces persistentemente anegadas.

**Implicación:** es un buen fallback para jardines de clima mediterráneo cuando la especie exacta no está segura.

## 2.9 El huerto productivo tiene otra estrategia hídrica

Hortalizas de huerto suelen requerir disponibilidad de agua más continua durante crecimiento y producción; déficits de pocos días durante calor pueden afectar crecimiento o rendimiento.

**Implicación:** no agrupar “comestible/aromática” como una sola estrategia. Albahaca/tomate/lechuga y romero/tomillo no deben compartir el mismo prior hídrico solo por ser comestibles.

## 2.10 Luz y humedad del suelo son ejes independientes

Existen plantas de:

- sol + seco;
- sol + húmedo;
- sombra + seco;
- sombra + húmedo.

La horticultura práctica y las guías de selección de plantas usan combinaciones de ambos ejes.

**Implicación:** una etiqueta como `baja_luz_resistente` no puede determinar por sí sola el agua.

---

# 3. Regla de precedencia de conocimiento

Para cada parámetro botánico:

```text
ficha de especie revisada
    > ficha de especie conocida
    > perfil funcional inferido
    > fallback neutral
```

El contexto observado no debe falsificar identidad, pero sí modifica el riesgo.

Ejemplo:

- ficha de romero: tolerancia hídrica específica;
- si la especie no está confirmada pero el perfil es `mediterranea_xerica`, usar sus priors;
- si ni especie ni perfil son confiables, no forzar `aroide_tropical`: usar incertidumbre y acciones conservadoras.

---

# 4. Diccionario de factores para la primera implementación

No todos deben persistirse en DB en la primera misión. El motor debe poder consumirlos cuando existan.

## 4.1 Zona radicular / sustrato

### `rootZoneMoisture`

Estado semántico recomendado:

```ts
type MoistureBand =
  | 'very_dry'
  | 'dry'
  | 'moderate'
  | 'moist'
  | 'wet'
  | 'saturated'
  | 'unknown';
```

No interpretar porcentajes de sensores como equivalentes entre sustratos sin calibración.

### `wetPersistence`

Cuánto tiempo permanece húmeda la zona radicular respecto a lo esperable.

```ts
type PersistenceBand = 'fresh' | 'normal' | 'prolonged' | 'unknown';
```

Puede derivarse de observaciones repetidas + riego/lluvia.

### `drainage`

```ts
type DrainageBand = 'sharp' | 'normal' | 'poor' | 'unknown';
```

Señales observables útiles para el usuario:

- orificios de drenaje presentes;
- agua queda acumulada en plato/cubremaceta;
- maceta sin salida;
- suelo encharcado o agua estancada;
- sustrato tarda demasiado en secarse.

### `containerContext`

```ts
type RootContext =
  | 'small_pot'
  | 'large_pot'
  | 'raised_bed'
  | 'ground'
  | 'unknown';
```

No asignar riesgo automáticamente; modifica memoria térmica/hídrica y volumen radicular.

---

## 4.2 Agua aplicada e historial

### `lastWateringAt`
### `lastRainAt`
### `recentRainAmount`
### `wateringEventsWindow`

El objetivo es saber si la humedad observada es coherente con una intervención reciente o si está persistiendo sin explicación.

**Regla:** lluvia y riego son entradas al balance, no órdenes directas de “saltar X días”.

---

## 4.3 Temperatura

Mantener:

- actual;
- mínima/máxima reciente;
- exposición acumulada por sobre/bajo rangos del perfil/especie;
- velocidad/cambio brusco cuando sea relevante.

No definir un rango universal de confort para todas las plantas.

Puede existir alerta meteorológica genérica de helada/calor, pero la severidad botánica debe depender del perfil.

---

## 4.4 Luz / radiación

Estado inicial semántico:

```ts
type LightBand =
  | 'deep_shade'
  | 'shade'
  | 'part_shade'
  | 'bright_indirect'
  | 'gentle_direct'
  | 'strong_direct'
  | 'unknown';
```

Cuando existan datos mejores, puede sustituirse por DLI/PPFD o irradiancia derivada.

Factores temporales adicionales:

- duración de exposición;
- cambio brusco de ubicación;
- estación;
- hemisferio/orientación cuando la recomendación use ventanas.

**Nota Chile/hemisferio sur:** una recomendación de orientación copiada desde guías del hemisferio norte puede invertirse. La lógica debe derivar orientación solar desde latitud/hemisferio y no almacenar frases fijas como verdad universal.

---

## 4.5 Demanda atmosférica

Preferir, en orden:

1. VPD derivado de temperatura + humedad relativa confiables;
2. temperatura + humedad relativa separadas;
3. temperatura sola con mayor incertidumbre.

Representación inicial:

```ts
type AtmosphericDemandBand =
  | 'low'
  | 'moderate'
  | 'high'
  | 'extreme'
  | 'unknown';
```

Los umbrales exactos deben pertenecer a configuración/curvas, no quedar hardcodeados como verdad botánica universal.

---

## 4.6 Establecimiento

```ts
type EstablishmentState =
  | 'newly_planted'
  | 'establishing'
  | 'established'
  | 'unknown';
```

Efecto:

- `newly_planted` eleva sensibilidad a déficit hídrico;
- `established` no implica inmunidad a sequía, solo mayor capacidad potencial de exploración radicular;
- la especie/perfil sigue importando.

---

## 4.7 Fenología / crecimiento

Primera versión:

```ts
type GrowthState =
  | 'active_growth'
  | 'flowering_fruiting'
  | 'dormant_or_slow'
  | 'stressed'
  | 'unknown';
```

Usos:

- producción puede aumentar sensibilidad a agua en cultivos;
- reposo/baja actividad reduce demanda y debe moderar fertilización/riego;
- estrés previo puede elevar precaución ante nuevas intervenciones.

No inferir fenología solo por mes sin hemisferio/clima/especie.

---

## 4.8 Síntomas visuales

Los síntomas son evidencia, no causa.

Tipos útiles:

- `wilting`
- `yellowing`
- `brown_tips`
- `scorch_or_bleaching`
- `soft_dark_tissue`
- `shriveling`
- `leaf_drop`
- `spots_or_lesions`
- `pest_visible`
- `unknown_abnormality`

Cada síntoma debe transportar:

- observado vs inferido por IA;
- confianza;
- partes afectadas;
- progresión si hay historial.

Ejemplo: `wilting` puede ser compatible tanto con déficit de agua como con raíces dañadas por exceso de agua. El motor debe usar humedad/drenaje/historial para separar hipótesis.

---

# 5. Perfiles funcionales prioritarios y priors botánicos

Esta tabla contiene **dirección relativa**, no porcentajes de sensor ni calendarios rígidos.

| Perfil | Agua / sequedad tolerada | Penalización por humedad persistente | Drenaje | Luz típica | Notas de implementación |
| --- | --- | --- | --- | --- | --- |
| `xerofita_suculenta` | alta tolerancia relativa a sequedad | alta/muy alta | `sharp` | alta, normalmente | excepción epífitas; no asumir pleno sol para todas |
| `mediterranea_xerica` | moderada/alta una vez establecida | alta | `sharp` | sol | buen perfil para romero/tomillo/salvia/orégano/lavanda |
| `huerto_herbacea_productiva` | baja tolerancia a déficit prolongado durante crecimiento | moderada/alta si hay anegamiento | `normal` | media-alta/sol según especie | agua más continua; calor/producción aumentan demanda |
| `herbacea_ornamental_mesica` | moderada | moderada | `normal` | depende de subperfil | usar ejes de agua + luz; grupo deliberadamente amplio |
| `sombra_humeda` | baja/moderada tolerancia a sequedad | moderada; no equivale a anegamiento | `normal` a retentivo pero aireado | sombra/parte sombra | “húmedo” ≠ “saturado”; helechos son ejemplo frecuente |
| `lenosa_jardin` | depende mucho de especie + establecimiento | moderada | `normal` salvo adaptación | variable | `establishment` es obligatorio cuando se conozca |
| `tropical_mesica` | baja/moderada tolerancia a sequedad | moderada/alta | `normal`, aireado | filtrada/brillante indirecta | útil para muchas tropicales; no usar como default universal |

## 5.1 Lo que un perfil puede proporcionar

- forma aproximada de la curva de tolerancia hídrica;
- severidad relativa de saturación;
- prioridad de drenaje;
- rango cualitativo de luz;
- modificadores esperables por crecimiento/estación;
- preguntas que conviene hacer al usuario.

## 5.2 Lo que un perfil NO puede proporcionar de forma segura

Nunca heredar solo desde perfil:

- toxicidad para personas/mascotas;
- comestibilidad;
- dosis de fertilizante;
- pesticidas o tratamientos químicos;
- diagnóstico de patógeno;
- seguridad alimentaria;
- resistencia exacta a helada;
- rangos térmicos precisos de especie;
- frecuencia fija de riego.

---

# 6. Curvas de respuesta: diseño implementable

## 6.1 Principio

Cada factor `x_i(t)` se transforma en una contribución relativa para un riesgo concreto mediante una función parametrizada:

```text
r_i = f_i(x_i, parametros_especie_o_perfil)
```

No existe una única curva de “salud”. Un mismo factor puede aportar distinto riesgo según la hipótesis.

Ejemplo:

- `rootZoneMoisture = wet`
  - contribución alta al riesgo de exceso de agua en `xerofita_suculenta`;
  - contribución menor en `sombra_humeda`;
  - contribución no nula en ambas si además existe `drainage = poor` y persistencia.

## 6.2 Primera versión: curvas semánticas por tabla

No hace falta empezar con funciones continuas. Puede usarse una lookup table por banda:

```ts
type RiskContribution = 0 | 0.25 | 0.5 | 0.75 | 1;
```

Ejemplo conceptual, NO contrato final:

```ts
const excessWaterByProfile = {
  xerofita_suculenta: {
    dry: 0,
    moderate: 0.1,
    moist: 0.35,
    wet: 0.75,
    saturated: 1,
  },
  sombra_humeda: {
    dry: 0,
    moderate: 0,
    moist: 0.1,
    wet: 0.35,
    saturated: 0.8,
  },
};
```

Los números son **pesos iniciales de ingeniería para probar comportamiento**, no mediciones botánicas. Deben quedar configurables y testeables.

## 6.3 Segunda versión: funciones continuas

Cuando existan sensores/datos suficientes:

- funciones piecewise;
- splines;
- curvas logísticas;
- curvas aprendidas por especie/perfil;
- intervalos de confianza.

La arquitectura inicial no debe impedir esa evolución.

---

# 7. Modelo de convergencia de riesgo

Para riesgo `k`:

```text
R_k(t) = normalize(
    bias_k
  + Σ w_i * r_i(t)
  + Σ w_ij * r_i(t) * r_j(t)
  + temporalMemory_k(t)
)
```

Esto es una estructura de implementación, no una afirmación de que la fisiología real sea literalmente esa ecuación.

## 7.1 Por qué conservar interacciones

Porque factores combinados pueden ser sinérgicos, antagonistas o no aditivos.

El primer motor puede usar pocos términos explícitos y explicables, por ejemplo:

```text
wet × poorDrainage
wet × coldOrLowDemand
wet × lowLight

dry × highAtmosphericDemand
dry × heat
dry × newlyPlanted

strongLight × highTemperature
strongLight × suddenExposureChange
```

No crear todas las combinaciones posibles.

---

# 8. Tres riesgos para la primera misión técnica

## 8.1 Riesgo A — exceso de agua / deterioro de zona radicular

### Factores principales

- `rootZoneMoisture`
- `wetPersistence`
- `drainage`
- `recentWateringOrRain`
- `temperature / atmosphericDemand`
- `light`
- perfil/especie
- síntomas compatibles

### Interacciones prioritarias

1. `wet/saturated × poorDrainage`
2. `wet × prolonged`
3. `wet × lowAtmosphericDemand`
4. `wet × lowLight`
5. `wet × xericProfile`

### Síntomas compatibles, nunca confirmatorios

- amarilleo;
- marchitez con sustrato húmedo;
- tejido oscuro/blando;
- caída de hojas;
- crecimiento frenado.

### Recomendaciones seguras posibles

Bajo riesgo:
- continuar observación normal.

Riesgo moderado:
- posponer riego;
- volver a revisar humedad;
- confirmar drenaje/agua acumulada;
- explicar qué señales elevaron el riesgo.

Riesgo alto:
- no añadir más agua sin revisar;
- inspeccionar drenaje y zona radicular;
- pedir evidencia adicional/foto si hay síntomas;
- evitar afirmar “pudrición confirmada”.

### Lo que NO debe hacer el motor

- recomendar fungicida automáticamente;
- diagnosticar patógeno sin evidencia;
- decir “está sobre-regada” solo por una hoja amarilla;
- usar número de días desde último riego como único criterio.

---

## 8.2 Riesgo B — déficit hídrico / calor

### Factores principales

- `rootZoneMoisture`
- `atmosphericDemand`
- temperatura
- luz/radiación
- `establishment`
- contexto de raíz/maceta
- tendencia/persistencia
- síntomas compatibles

### Interacciones prioritarias

1. `dry × highAtmosphericDemand`
2. `dry × highTemperature`
3. `dry × strongLight`
4. `dry × newlyPlanted`
5. `dry × smallPot`

### Síntomas compatibles

- marchitez;
- pérdida de turgencia;
- hojas enrolladas;
- bordes secos;
- caída de flores/frutos en cultivos bajo estrés;
- encogimiento en suculentas.

### Recomendaciones seguras

Si el perfil tolera riego y el sustrato está realmente seco:
- recomendar riego profundo/adecuado al contexto;
- volver a evaluar respuesta;
- moderar exposición extrema si la planta no está adaptada.

Si humedad es desconocida:
- pedir comprobación del sustrato antes de ordenar riego.

### Lo que NO debe hacer

- interpretar marchitez = falta de agua sin revisar humedad;
- usar calor exterior para ordenar riego de una planta interior automáticamente;
- asumir que una xerófita nunca sufre déficit.

---

## 8.3 Riesgo C — estrés lumínico/térmico

### Factores principales

- nivel de luz actual;
- duración;
- temperatura;
- `atmosphericDemand`;
- cambio reciente de ubicación/exposición;
- perfil/especie;
- síntomas y lado de la planta afectado.

### Interacciones prioritarias

1. `strongLight × highTemperature`
2. `strongLight × highAtmosphericDemand`
3. `strongLight × suddenExposureChange`
4. `highTemperature × dryRootZone`

### Síntomas compatibles

- zonas blanqueadas;
- quemado localizado en cara expuesta;
- bordes secos;
- colapso/necrosis tras evento térmico;
- deformación/debilidad por luz insuficiente como riesgo diferente.

### Recomendaciones seguras

- reducir exposición bruscamente extrema cuando exista evidencia de falta de aclimatación;
- mover gradualmente, no hacer cambios violentos salvo peligro inmediato;
- corregir primero la combinación causal probable, no tratar manchas como enfermedad automáticamente.

---

# 9. Fertilización: mantener fuera del primer motor principal, pero con guardrails

La fertilización debe depender de:

- crecimiento activo;
- especie/perfil;
- luz disponible;
- temperatura;
- historial reciente;
- estado hídrico.

Guardrails iniciales:

- no fertilizar una planta severamente seca como respuesta a “se ve débil”;
- no recomendar fertilización automática en baja actividad/baja luz/frío;
- síntomas ambiguos de clorosis no prueban deficiencia;
- dosis específicas requieren ficha de especie/producto y no deben salir del arquetipo.

---

# 10. Plagas y enfermedades: evidencia paralela, no factor ambiental genérico

El motor de ambiente puede explicar predisposición/riesgo, pero plagas y patógenos deben conservar un canal diagnóstico separado.

Cuando la imagen sugiere plaga:

- registrar síntoma/evidencia;
- pedir confirmaciones observables;
- priorizar inspección, aislamiento si corresponde y medidas no químicas seguras;
- no recetar pesticidas desde una clasificación visual incierta.

El riesgo ambiental puede coexistir con plaga; no forzar una única causa.

---

# 11. Contrato de procedencia e incertidumbre

Todo factor debe llevar procedencia.

```ts
type EvidenceProvenance =
  | 'user_observed'
  | 'sensor'
  | 'weather'
  | 'derived'
  | 'ai_inferred'
  | 'catalog'
  | 'unknown';

interface FactorEvidence<T> {
  value?: T;
  observedAt?: string;
  provenance: EvidenceProvenance;
  confidence: number; // 0..1
  sourceId?: string;
}
```

Reglas:

- `unknown` no equivale a valor medio;
- una inferencia visual no equivale a sensor;
- clima de ciudad no equivale a microclima de una maceta interior;
- catálogo de especie describe tolerancia, no el estado actual;
- un factor desconocido debe aumentar incertidumbre o motivar una pregunta.

---

# 12. Salida deseada del motor

```ts
interface CareRiskAssessment {
  risk: 'excess_water' | 'water_deficit' | 'light_heat_stress';
  score: number;        // 0..1, relativo/configurable
  confidence: number;   // 0..1, calidad/completitud de evidencia
  severity: 'low' | 'moderate' | 'high';
  contributors: Array<{
    factor: string;
    contribution: number;
    evidence: string;
    provenance: EvidenceProvenance;
  }>;
  interactions: Array<{
    factors: string[];
    contribution: number;
    explanation: string;
  }>;
  missingCriticalFactors: string[];
  hypotheses: string[];
  safeActions: string[];
  recheck?: {
    factor: string;
    reason: string;
  };
}
```

Los tipos exactos pueden cambiar, pero la separación semántica debe conservarse.

## 12.1 Explicabilidad mínima

Una recomendación debe poder producir algo como:

> “Conviene esperar antes de regar. El sustrato sigue húmedo, el drenaje es incierto y la planta está recibiendo poca luz, por lo que ahora consume agua más lentamente. Revisa nuevamente la humedad antes del próximo riego.”

No debe limitarse a mostrar `riesgo 0.72`.

---

# 13. Manejo de datos faltantes

## 13.1 Regla general

Nunca completar silenciosamente variables desconocidas para conseguir una decisión.

### Si falta humedad del sustrato

Y la pregunta es si debe regarse:
- pedir revisión de humedad;
- usar clima/historial solo como contexto, no como sustituto.

### Si falta especie pero existe perfil funcional confiable

- usar curvas del perfil;
- bajar confianza;
- evitar afirmaciones específicas de especie.

### Si falta perfil y especie

- fallback neutral;
- recomendaciones de observación y riesgo mínimo reversible.

### Si clima no representa el microambiente

Ejemplo: planta interior y clima exterior.
- conservarlo como contexto de baja relación o excluirlo del score principal.

---

# 14. Qué datos deben preguntarse al usuario antes que investigar más botánica

Cuando faltan, estas preguntas tienen alto valor causal:

1. ¿El sustrato está seco, húmedo o mojado a algunos centímetros de profundidad?
2. ¿La maceta tiene drenaje y queda agua acumulada?
3. ¿Está en interior, balcón/maceta exterior o suelo?
4. ¿Cuánta luz directa recibe y en qué momento del día?
5. ¿Fue trasplantada o movida de lugar recientemente?
6. ¿Es recién plantada o lleva tiempo establecida?
7. ¿Cuándo fue el último riego/lluvia importante?
8. ¿El síntoma está avanzando o fue puntual?

Estas preguntas suelen reducir más incertidumbre que una identificación taxonómica marginalmente más precisa.

---

# 15. Escenarios canónicos para tests

Los tests deben cubrir aislamiento de factores y convergencia.

## T01 — suculenta húmeda + frío/poca luz

Entrada:
- perfil `xerofita_suculenta`;
- humedad `wet`;
- persistencia `prolonged`;
- luz baja;
- demanda atmosférica baja.

Esperado:
- riesgo exceso de agua alto;
- no regar;
- explicar persistencia + perfil + baja demanda;
- no diagnosticar pudrición como confirmada.

## T02 — misma suculenta recién regada, drenaje bueno, luz adecuada

Entrada:
- humedad `wet`;
- persistencia `fresh`;
- drenaje `sharp`;
- luz adecuada;
- riego reciente.

Esperado:
- riesgo menor que T01;
- monitorizar, no alarmar solo por humedad actual.

## T03 — aromática mediterránea seca pero estable

Entrada:
- `mediterranea_xerica`;
- `dry`;
- planta establecida;
- temperatura moderada;
- demanda atmosférica moderada;
- sin marchitez.

Esperado:
- no asumir urgencia;
- riesgo hídrico bajo/moderado según configuración;
- perfil desplaza tolerancia hacia sequedad.

## T04 — tomate/huerto seco + calor

Entrada:
- `huerto_herbacea_productiva`;
- `dry`;
- calor;
- alta demanda atmosférica;
- crecimiento activo.

Esperado:
- riesgo de déficit hídrico alto;
- recomendación de riego si humedad observada es confiable;
- explicar convergencia.

## T05 — marchitez con sustrato húmedo

Entrada:
- `wilting`;
- `wet`;
- drenaje pobre.

Esperado:
- NO recomendar agua;
- elevar riesgo de problema radicular/exceso;
- plantear hipótesis, pedir inspección.

## T06 — marchitez con sustrato seco + calor

Entrada:
- `wilting`;
- `dry`;
- alta demanda atmosférica.

Esperado:
- riesgo déficit hídrico alto;
- diferenciar de T05 pese al mismo síntoma.

## T07 — árbol recién plantado vs establecido

Mismo clima y suelo seco.

Esperado:
- `newly_planted` produce mayor riesgo hídrico que `established`;
- no cambiar la identidad de la planta.

## T08 — luz fuerte después de cambio brusco

Entrada:
- luz fuerte;
- cambio reciente desde sombra;
- temperatura alta.

Esperado:
- estrés lumínico/térmico alto;
- recomendar transición/reducción de exposición;
- explicación por interacción, no “esta especie no tolera sol” si la especie es incierta.

## T09 — dato crítico desconocido

Entrada:
- usuario pregunta si regar;
- humedad `unknown`;
- clima cálido.

Esperado:
- no inventar humedad;
- pedir revisión del sustrato;
- confianza baja.

## T10 — especie revisada sobreescribe perfil

Entrada:
- especie curada con parámetros propios;
- perfil funcional genérico contradictorio.

Esperado:
- parámetros de especie tienen precedencia;
- conservar el perfil como metadato si sirve, sin sobreescribir verdad específica.

---

# 16. Validación humana que debe acompañar los tests automáticos

Además de unit tests, la misión debería entregar una pequeña matriz que Dante pueda revisar en la app o en un harness de escenarios.

Debe mostrar, por escenario:

- inputs conocidos;
- inputs desconocidos;
- riesgo resultante;
- factores dominantes;
- acción sugerida;
- explicación humana.

Casos mínimos:

- suculenta;
- aromática mediterránea;
- hortaliza productiva;
- planta de sombra húmeda;
- leñosa recién plantada;
- misma leñosa establecida.

Objetivo de la revisión humana: comprobar que la explicación tiene sentido causal y que el sistema expresa incertidumbre, no “adivina” botánica.

---

# 17. Mapa técnico sobre el código actual

Este informe no autoriza cambios concretos de esquema, pero la futura misión debe inspeccionar y probablemente tocar estos puntos:

## `src/types/index.ts`

- `CarePlan` ya contiene parámetros estructurados de cuidado;
- `CareArchetype` existe;
- probablemente hará falta representar perfil funcional y resultados de riesgo de forma separada.

## `src/domain/careDecision.ts`

Es el punto conceptual más cercano al motor de decisión actual.

Hoy:
- recibe observación de humedad;
- distingue `dry/wet/not_sure`;
- devuelve regar/esperar/pedir revisión.

Dirección:
- evolucionar o envolverlo con un motor multifactorial;
- conservar la buena separación actual entre observación y recomendación.

No convertir esta misión en un refactor transversal innecesario.

## `src/lib/aiSchema.ts`

- hoy normaliza arquetipos y usa `aroide_tropical` como fallback interno en ciertos defaults;
- debe evitarse que ese fallback se convierta en verdad para jardín desconocido.

## `server/ai/core.ts`

- identificación ya pide pensar en arquetipo, pero no lo transporta como salida independiente;
- una futura misión de perfil funcional debe incorporar procedencia/confianza;
- el motor de riesgo no debería depender de pedirle al LLM un score opaco si los factores pueden calcularse determinísticamente.

## `src/lib/speciesCatalog.ts`

- ya permite `care_archetype` como base de cuidado;
- buen lugar para resolver parámetros de especie/perfil con precedencia clara.

## clima / historial / observaciones

Ya existen piezas en el producto. La misión debe reutilizarlas en vez de crear fuentes paralelas si están disponibles.

---

# 18. Estrategia de implementación recomendada

## Fase 1 — motor determinista puro

Crear funciones de dominio sin side effects ni LLM:

```text
resolveCareParameters(...)
normalizeFactorEvidence(...)
evaluateExcessWaterRisk(...)
evaluateWaterDeficitRisk(...)
evaluateLightHeatRisk(...)
buildCareRecommendation(...)
```

Ventajas:

- testeable;
- explicable;
- calibrable;
- desacoplado de UI;
- no depende de tokens/API;
- permite usar IA para extraer evidencia, no para inventar fisiología.

## Fase 2 — integración con entradas reales

- humedad observada por usuario;
- clima útil según ubicación/contexto;
- historial de riego/lluvia;
- perfil/especie;
- síntomas de seguimiento.

## Fase 3 — persistir resultados útiles

Solo después de revisar el esquema real:

- snapshots de factores;
- riesgo/recomendación;
- resultado posterior.

## Fase 4 — calibración con datos de Llekén

Cuando existan suficientes observaciones:

- ajustar pesos;
- ajustar curvas;
- aprender interacciones;
- estimar calibración por especie/perfil;
- comparar predicción con resultado posterior.

No empezar ML antes de tener señal y ground truth suficientes.

---

# 19. Criterios de aceptación de dominio

La implementación inicial se considera conceptualmente correcta si:

1. el arquetipo/perfil solo parametriza el motor, no entrega una acción fija;
2. humedad, luz, temperatura/demanda, drenaje e historial son factores independientes;
3. el tiempo modifica el riesgo;
4. existen interacciones explícitas en al menos los tres riesgos iniciales;
5. dato desconocido no se reemplaza silenciosamente por un valor inventado;
6. misma señal produce resultados distintos bajo contexto diferente cuando botánicamente corresponde;
7. síntomas no se convierten en diagnóstico confirmado;
8. especie curada tiene precedencia sobre perfil funcional;
9. perfil funcional tiene confianza/procedencia distinta a la identificación taxonómica;
10. la salida explica los factores principales de la recomendación;
11. ningún arquetipo transmite toxicidad, comestibilidad, pesticidas o seguridad alimentaria;
12. los tests incluyen aislamiento de factor, convergencia e incertidumbre;
13. existe una validación humana de escenarios además de tests automáticos.

---

# 20. Decisiones de producto vs evidencia botánica

Para que un implementador no confunda ambos niveles:

## Evidencia botánica sólida para el diseño

- oferta de agua del suelo y demanda atmosférica son componentes diferentes del estrés hídrico;
- VPD influye en transpiración y su interacción con secado del suelo importa;
- anegamiento prolongado reduce oxígeno radicular para plantas no adaptadas;
- establecimiento modifica fuertemente la necesidad de riego de leñosas;
- cactus/suculentas típicas favorecen drenaje y toleran más sequedad, con excepciones epífitas;
- hierbas mediterráneas comunes comparten sol + drenaje;
- plantas de huerto requieren disponibilidad hídrica más continua que perfiles xerófitos;
- combinaciones de estrés pueden ser no aditivas;
- síntomas visuales aislados suelen ser ambiguos.

## Decisiones de ingeniería/producto propuestas

- usar scores `0..1`;
- usar cinco niveles de contribución;
- empezar con tres riesgos;
- usar suma ponderada + términos de interacción;
- nombres exactos de tipos/enums;
- umbrales que separen `low/moderate/high`;
- pesos iniciales de cada factor.

Esos elementos deben quedar configurables. No son “leyes botánicas”.

---

# 21. Fuentes botánicas que sustentan este informe

## Dinámica hídrica, VPD y curvas de respuesta

- Koehler T. et al. (2023), **Transpiration response to soil drying versus increasing vapor pressure deficit in crops: physical and physiological mechanisms and key plant traits**, *Journal of Experimental Botany*. https://doi.org/10.1093/jxb/erad186
- McAdam S.A.M. & Brodribb T.J. (2015), **Evolution of Mechanisms Driving the Stomatal Response to Vapor Pressure Deficit**, *Plant Physiology*. https://doi.org/10.1104/pp.114.252940
- Grossiord C. et al. (2020/2021), revisión cuantitativa de efectos sistémicos de VPD sobre fisiología/productividad vegetal. PMCID: PMC8251766.

## Estrés combinado / no aditividad

- Li N. et al. (2025), **A Review of Differential Plant Responses to Drought, Heat, and Combined Drought + Heat Stress**, *Current Issues in Molecular Biology*. https://doi.org/10.3390/cimb47120975
- **Cross-Tolerance in a Changing Climate: Physiological Responses to Combined Abiotic Stress** (2026), *Phyton – International Journal of Experimental Botany*. https://doi.org/10.32604/phyton.2026.079971
- Zandalinas S.I. et al. y literatura de estrés combinado sintetizada en revisiones modernas: la combinación no debe inferirse como suma simple de respuestas aisladas.

## Curvas dosis–respuesta / modelado fenotípico

- Poorter H. et al. (2010), **A method to construct dose-response curves for a wide range of environmental factors and plant traits by means of a meta-analysis of phenotypic data**, *Journal of Experimental Botany*. https://doi.org/10.1093/jxb/erp358
- Pons T.L. et al. (2022), **MetaPhenomics: quantifying the many ways plants respond to their abiotic environment, using light intensity as an example**, *Plant and Soil*.

## Jardín y manejo práctico

- University of Minnesota Extension, **Watering the vegetable garden**: https://extension.umn.edu/gardening-minnesota/watering-vegetable-garden
- University of Minnesota Extension, **Watering newly planted trees and shrubs**: https://extension.umn.edu/planting-and-growing-guides/watering-newly-planted-trees-and-shrubs
- University of Minnesota Extension, **Planting and transplanting trees and shrubs**: https://extension.umn.edu/how/planting-and-transplanting-trees-and-shrubs
- RHS, **Plant a container: Mediterranean herbs**: https://www.rhs.org.uk/advice/grow-your-own/containers/veg-on-walls/june-edible-container-idea
- RHS, **How to grow cacti and succulents**: https://www.rhs.org.uk/plants/types/cacti-succulents/houseplants/growing-guide
- Penn State Extension, **Soil Management for Flowers and Ornamentals**: https://extension.psu.edu/trees-lawns-and-landscaping/ornamentals-and-floriculture/soil-management
- Penn State Extension, **Plant Guide: Shade To Part Shade - Wet To Moist Soil**: https://extension.psu.edu/plant-guide-shade-to-part-shade-wet-to-moist-soil

## Base previa de Llekén

- `docs/product/PLANT_CARE_RESEARCH.md`: riego por sustrato, luz, temperatura, humedad, fertilización, síntomas y plagas.
- `docs/product/FUNCTIONAL_CARE_ARCHETYPES.md`: fallback funcional bajo identificación incierta.
- `docs/product/CARE_RISK_MODEL.md`: dirección canónica del motor de riesgo.
- `docs/architecture/PREDICTIVE_AI_MODEL.md`: prior → evidencia → posterior, derivadas, integrales, medias móviles y actualización progresiva.

---

# 22. Regla final para el agente implementador

**No re-investigues botánica general antes de empezar.** Usa este informe y las fuentes enlazadas como base de dominio para la primera implementación.

Solo abre investigación nueva si durante la misión aparece una de estas situaciones:

1. se necesita un umbral numérico específico de una especie no documentada;
2. se quiere hacer una afirmación de toxicidad/comestibilidad/seguridad;
3. se necesita recomendar tratamiento químico;
4. aparece un grupo funcional no cubierto aquí (acuáticas, epífitas especializadas, carnívoras, céspedes/graminoides, bulbosas/geófitas, etc.);
5. los datos reales contradicen explícitamente un prior documentado.

Para la primera misión, el trabajo cognitivo ya está resuelto: construir un motor determinista, temporal, multifactorial, con interacciones limitadas, incertidumbre explícita y recomendaciones explicables.