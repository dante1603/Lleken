# Arquetipos funcionales de cuidado

Fecha: 2026-08-17
Estado: dirección de producto y dominio documentada; implementación completa pendiente.

## Decisión

Llekén debe conservar una capa de **arquetipos funcionales de cuidado** entre la identificación botánica exacta y el fallback genérico.

La finalidad no es fingir una especie cuando la IA no puede identificarla. La finalidad es conservar información de cuidado de menor resolución pero todavía útil: estrategia hídrica, luz, drenaje, humedad ambiental, forma de crecimiento y estado de establecimiento.

Jerarquía deseada de evidencia para cuidados:

1. especie revisada/curada;
2. especie conocida en catálogo estático;
3. especie inferida con procedencia y confianza explícitas;
4. perfil funcional/arquetipo inferido con confianza explícita;
5. fallback desconocido conservador.

Una identificación incierta puede, por tanto, quedar como `Especie no confirmada` y a la vez conservar un perfil funcional probable. Esos dos niveles de confianza no deben confundirse.

## Premisa botánica

La idea tiene fundamento botánico, con una salvedad importante: los grupos funcionales son útiles cuando describen respuestas compartidas a condiciones ambientales, pero no sustituyen la variación entre especies ni el contexto local.

La literatura de rasgos funcionales describe síndromes de rasgos asociados a estrategias frente a gradientes de luz, agua, nutrientes y temperatura. En horticultura práctica se usa una lógica compatible: la selección de plantas suele cruzar requerimientos de luz y humedad del suelo, y existen grupos con condiciones de cultivo claramente compartidas.

Ejemplos útiles para Llekén:

- cactus y muchas suculentas comparten tolerancia a sequía y necesidad de drenaje alto, aunque existen excepciones importantes como cactus epífitos de bosque húmedo;
- romero, salvia, tomillo, orégano/mejorana y ajedrea comparten bien un perfil mediterráneo de sol y drenaje;
- las hortalizas de huerto requieren una vigilancia hídrica bastante más continua que las aromáticas mediterráneas;
- árboles y arbustos leñosos cambian radicalmente de régimen hídrico entre la fase recién plantada y la fase establecida;
- plantas de sombra húmeda pueden agruparse por combinación de luz y humedad aunque pertenezcan a linajes distintos.

Conclusión: el arquetipo es una **aproximación funcional contextual**, no una categoría taxonómica.

## Lo que ya existe en `main`

La premisa ya está parcialmente implementada.

### Contrato de datos

`src/types/index.ts` define `CareArchetype` con seis valores actuales:

- `suculenta_cactus`
- `aroide_tropical`
- `alta_humedad`
- `baja_luz_resistente`
- `floracion_interior`
- `comestible_aromatica`

`CarePlan` ya guarda `arquetipo_cuidado` junto con reglas estructuradas de humedad del sustrato, luz, humedad ambiental, temperaturas, drenaje y fertilización.

### Catálogo de especies

`src/lib/speciesCatalog.ts` ya entiende `care_archetypes` y puede resolver una ficha cuya base de cuidado sea `care_archetype`. La resolución mezcla, en orden de mayor especificidad, cuidado por arquetipo, conocimiento estático de especie y cuidado explícito de especie.

La base también enlaza `species_catalog` con `care_archetype_id`; la migración `202605020003_link_species_catalog.sql` ya usa este vínculo para el tomate.

### IA

`server/ai/core.ts` pide al modelo pensar en un arquetipo durante identificación y exige `arquetipo_cuidado` al generar el plan de cuidados.

Sin embargo, el JSON contractual de identificación no contiene ese campo y `normalizePlantIdentification` tampoco lo conserva. En la práctica, el arquetipo queda formalizado durante la generación/normalización del plan de cuidados, no como una inferencia independiente persistida desde la identificación.

### Fallback actual

`src/lib/aiSchema.ts` y `src/lib/plantKnowledge.ts` usan `aroide_tropical` como arquetipo conservador interno cuando falta uno confirmado para derivar ciertos defaults.

Esto es razonable para el sesgo histórico hacia plantas de interior, pero **no es un fallback universal seguro para jardín**. Una planta xerófita, una aromática mediterránea o una leñosa exterior desconocida pueden recibir supuestos incorrectos si se fuerza ese default.

## Problemas del modelo actual

### 1. El arquetipo no es una salida de identificación de primera clase

La IA puede reconocer que algo parece una suculenta o una leñosa mediterránea sin poder asegurar especie. Esa información útil hoy no tiene un contrato independiente que sobreviva a la identificación.

### 2. Los seis valores mezclan dimensiones distintas

Los nombres actuales combinan criterios incompatibles entre sí:

- `aroide_tropical`: linaje/ecología;
- `baja_luz_resistente`: tolerancia ambiental;
- `floracion_interior`: fase/uso/entorno;
- `comestible_aromatica`: uso humano;
- `alta_humedad`: requisito ambiental.

Esto funciona como un conjunto pequeño de presets, pero escala mal a jardines y genera solapamientos.

### 3. Un solo enum no representa modificadores decisivos

El ejemplo más claro es establecimiento. Un árbol recién plantado y el mismo árbol ya establecido pertenecen al mismo tipo de planta, pero necesitan regímenes de riego muy diferentes. `recién_plantada` no debería convertirse en otro “tipo de árbol”; es un modificador del cuidado.

### 4. El catálogo actual está sesgado a interior/maceta

`PLANT_CARE_RESEARCH.md` ya documentaba arquetipos, pero su investigación original declara explícitamente foco en plantas de interior y maceta. Para Llekén como cuidador botánico general hace falta ampliar el modelo hacia jardín, huerto y plantas leñosas.

## Dirección propuesta: perfil funcional + arquetipo derivado

No eliminar `CareArchetype` inmediatamente. Mantener compatibilidad y evolucionar hacia un **perfil funcional estructurado** del que puedan derivarse presets de cuidado.

Propuesta conceptual:

```ts
interface FunctionalCareProfile {
  waterStrategy?: 'xeric' | 'dry_between' | 'moderate_even' | 'moist_even';
  lightStrategy?: 'shade' | 'part_shade' | 'bright_indirect' | 'sun';
  growthForm?: 'succulent' | 'herbaceous' | 'fern_like' | 'woody' | 'graminoid' | 'climber' | 'epiphyte';
  drainageNeed?: 'sharp' | 'normal' | 'moisture_retaining';
  establishment?: 'newly_planted' | 'established' | 'unknown';
  confidence?: 'alta' | 'media' | 'baja';
  evidence?: string[];
}
```

Los nombres exactos son una propuesta de diseño, no un contrato implementado todavía. Antes de migrar esquema deben validarse contra datos reales y especies objetivo.

Principio de resolución:

`especie conocida > perfil funcional > contexto real > fallback genérico`

El clima, el sustrato, la maceta/suelo, la exposición y las observaciones del usuario pueden modificar el cuidado, pero no deben reescribir silenciosamente la identidad botánica.

## Arquetipos prioritarios para jardines

Estos grupos son una primera capa operacional. No pretenden cubrir toda la botánica.

| Arquetipo funcional | Ejemplos comunes | Señal de cuidado compartida | Notas |
| --- | --- | --- | --- |
| `xerofita_suculenta` | cactus, aloe, jade, sedum, echeveria | alta importancia de drenaje; tolerancia a periodos secos; riesgo por exceso de agua | separar epífitas/tropicales cuando haya evidencia |
| `mediterranea_xerica` | romero, lavanda, tomillo, salvia, orégano | sol, drenaje alto, evitar humedad persistente | especialmente útil para jardines de clima mediterráneo |
| `huerto_herbacea_productiva` | tomate, ají/pimiento, lechuga, albahaca, perejil | humedad del suelo más regular; alto efecto de calor, producción y fase de crecimiento | la especie debe refinar fertilización y agua cuando se conozca |
| `herbacea_ornamental_mesica` | muchas anuales/perennes de macizo | drenaje normal + humedad moderada; luz según subperfil | grupo deliberadamente amplio; usar ejes de luz/agua para evitar sobreafirmar |
| `sombra_humeda` | helechos y diversas perennes de sombra | menor radiación + humedad del suelo más constante | no implica que todas requieran humedad ambiental alta |
| `lenosa_jardin` | arbustos y árboles ornamentales/frutales | riego profundo en zona radicular; frecuencia depende mucho del establecimiento | `newly_planted` vs `established` debe ser modificador obligatorio cuando se sepa |
| `tropical_mesica` | monstera, philodendron y otras tropicales de interior/jardín protegido | humedad intermedia, drenaje y luz filtrada/indirecta según especie | reemplaza el uso de `aroide_tropical` como default universal; el linaje exacto sigue siendo dato de especie |

No se propone todavía un arquetipo separado para cada forma de planta. Céspedes/graminoides, bulbosas/geófitas, acuáticas y epífitas merecen investigación específica antes de convertirlas en presets canónicos.

## Contrato deseado para identificación incierta

Cuando la especie no esté confirmada, la salida debería poder expresar algo equivalente a:

```json
{
  "nombre_cientifico": "Especie no confirmada",
  "functional_profile": {
    "archetype": "mediterranea_xerica",
    "confidence": "media",
    "traits": {
      "waterStrategy": "dry_between",
      "lightStrategy": "sun",
      "growthForm": "woody",
      "drainageNeed": "sharp"
    },
    "evidence": ["rasgos visuales compatibles; no equivalen a identificación de especie"]
  }
}
```

Reglas:

- confianza de especie y confianza funcional son campos distintos;
- el perfil es `ai_inferred`, nunca “confirmado” por el mero hecho de generarse;
- si ni siquiera el perfil tiene evidencia suficiente, usar `unknown` en vez de forzar `aroide_tropical`;
- toxicidad, comestibilidad, tratamientos y otros datos de alto riesgo **no se heredan del arquetipo**;
- una especie revisada puede sobreescribir cualquier default funcional;
- el usuario debería poder corregir contexto observable (sol/sombra, maceta/suelo, drenaje, recién plantada), sin que eso confirme taxonomía.

## Impacto técnico esperado

Una futura misión de implementación debería revisar al menos:

- `src/types/index.ts`: separar perfil funcional inferido de `CarePlan`;
- `src/domain/identification.ts`: transportar la inferencia funcional con procedencia/confianza;
- `src/lib/aiSchema.ts`: normalizarla sin default taxonómico silencioso;
- `server/ai/core.ts`: incluirla en el contrato JSON de identificación y usarla como input del plan;
- `src/lib/speciesCatalog.ts`: mantener especie como verdad más específica y arquetipo como fallback;
- Supabase: decidir si el perfil inferido vive en `ai_analyses`, planta, evento o relación dedicada antes de añadir columnas;
- tests: comprobar especie desconocida + perfil conocido, perfil desconocido, override por especie y ausencia de herencia peligrosa.

No se autoriza desde este documento una migración ni un cambio de esquema. Primero debe existir una misión técnica con revisión del esquema real y de los datos actuales.

## Criterios de aceptación futuros

1. Una foto puede producir `Especie no confirmada` y aun así un perfil funcional útil.
2. El perfil queda guardado con procedencia y confianza propias.
3. El plan usa especie cuando existe; si no, usa perfil; si tampoco existe, usa fallback neutral.
4. No existe un default silencioso `aroide_tropical` para una planta de jardín desconocida.
5. El cuidado se ajusta por contexto/estado de establecimiento sin convertir ese contexto en identidad.
6. Toxicidad, comestibilidad y diagnósticos no se infieren solo por arquetipo.
7. Tests automatizados cubren resolución y precedencia.
8. Validación humana debe incluir casos visuales de jardín: suculenta, aromática mediterránea, hortaliza, helecho/sombra y leñosa recién plantada/establecida.

## Fuentes botánicas principales

- Reich PB et al. (2003), *The evolution of plant functional variation: Traits, spectra, and strategies*. International Journal of Plant Sciences. https://doi.org/10.1086/374368
- Penn State Extension, *Soil Management for Flowers and Ornamentals*. https://extension.psu.edu/trees-lawns-and-landscaping/ornamentals-and-floriculture/soil-management
- Penn State Extension, *Plant Guide: Shade To Part Shade - Wet To Moist Soil*. https://extension.psu.edu/plant-guide-shade-to-part-shade-wet-to-moist-soil
- RHS, *Plant a container: Mediterranean herbs*. https://www.rhs.org.uk/advice/grow-your-own/containers/june-edible-container-idea
- RHS, *How to grow cacti and succulents*. https://www.rhs.org.uk/plants/types/cacti-succulents/houseplants/growing-guide
- University of Minnesota Extension, *Watering the vegetable garden*. https://extension.umn.edu/gardening-minnesota/watering-vegetable-garden
- University of Minnesota Extension, *Watering newly planted trees and shrubs*. https://extension.umn.edu/planting-and-growing-guides/watering-newly-planted-trees-and-shrubs
- University of Minnesota Extension, *Watering established trees and shrubs*. https://extension.umn.edu/planting-and-growing-guides/watering-established-trees-and-shrubs

## Relación con documentación previa

`PLANT_CARE_RESEARCH.md` sigue siendo evidencia botánica de base. Este documento **refina y amplía su sección de arquetipos** para cubrir identificación incierta y plantas de jardín, y gobierna esa dirección específica hasta que una fuente más reciente la reemplace explícitamente.
