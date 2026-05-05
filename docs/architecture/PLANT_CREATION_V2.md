# Creacion y diagnostico de plantas v2

Fecha: 2026-05-05

Este documento define hacia donde debe evolucionar el flujo de ingreso de plantas. La idea principal es dejar de pensar "crear planta" como una linea unica y empezar a tratarlo como un proceso flexible: entrada de datos, observacion, diagnostico, confirmacion, guardado recuperable y seguimiento.

## Problema actual

El flujo actual funciona bien para el caso feliz:

1. Foto inicial.
2. IA identifica especie.
3. Usuario confirma ubicacion/contexto.
4. App consulta clima.
5. IA genera plan.
6. App guarda planta, evento, foto, clima y metadata.

Pero el producto ya necesita casos mas amplios:

- crear planta con foto;
- crear planta sin foto;
- crear planta por nombre manual;
- crear borrador y completar despues;
- agregar planta a un huerto o espacio compartido;
- detectar plaga al momento de crear;
- detectar problema de salud sin estar seguro de la especie;
- registrar una observacion como "sustrato seco bajo la capa superior";
- indicar que la planta esta mal ubicada por luz;
- generar plan conservador si falla la IA, el clima o la foto;
- permitir que el usuario corrija la hipotesis de IA.

## Diferencia clave

No todo lo que ocurre al agregar una planta es "identificacion".

Hay cuatro dominios distintos:

| Dominio | Pregunta | Ejemplos |
|---|---|---|
| Identidad botanica | Que planta parece ser? | tomate, matico, ficus, especie no confirmada |
| Contexto del lugar | Donde y como vive? | interior, balcon, maceta sin drenaje, luz baja |
| Observacion concreta | Que hecho reporto el usuario o la camara? | tierra seca, hojas amarillas, manchas, plaga visible |
| Diagnostico | Que podria estar pasando y con que riesgo? | falta de luz, exceso de riego, plaga probable, estres por calor |

La app debe guardar estos dominios separados. Una planta puede tener identidad incierta y aun asi tener una observacion valida. Tambien puede tener diagnostico sin que la especie este 100% confirmada.

## Estados propuestos para el flujo

El ingreso de una planta deberia tener estados recuperables:

```text
draft
  Datos iniciados, todavia incompletos.

identifying
  La IA esta intentando leer foto o nombre.

needs_confirmation
  Hay hipotesis, pero el usuario debe confirmar especie/contexto.

diagnosing
  La app esta evaluando salud, plagas, luz, sustrato o riesgo.

ready_to_save
  Ya hay datos minimos para persistir.

active
  Planta creada y usable en calendario/perfil.

partial
  Planta guardada con informacion incompleta pero recuperable.

creation_failed
  Fallo algo y debe quedar registro para reintentar o limpiar.
```

## Casos que debe soportar

### A. Crear desde foto sana

Entrada: foto.
Resultado: identidad probable, contexto inferido, plan de cuidado, planta activa.

### B. Crear desde foto con plaga o enfermedad

Entrada: foto.
Resultado:

- planta activa o parcial;
- diagnostico inicial con `riesgo`;
- sintomas observados;
- preguntas para confirmar;
- accion segura inmediata;
- tarea de seguimiento mas cercana.

Ejemplo: "posible plaga en hojas, aislar de otras plantas y revisar reverso de hojas".

### C. Crear desde problema reportado por usuario

Entrada: texto/manual, por ejemplo:

- "la tierra esta seca al remover la capa superior";
- "las hojas estan amarillas";
- "esta en una pieza oscura";
- "creo que tiene bichos".

Resultado:

- observacion guardada;
- diagnostico si hay suficiente informacion;
- plan conservador si falta especie o foto.

### D. Crear sin foto

Entrada: nombre comun/cientifico aproximado.
Resultado: planta parcial o activa con `knowledge_source` de baja/media confianza.

### E. Crear borrador

Entrada: cualquier dato incompleto.
Resultado: registro recuperable para no perder el trabajo del usuario.

## Modelo de datos sugerido

Supabase ya tiene tablas que apuntan en esta direccion:

- `plants`
- `plant_events`
- `plant_media`
- `environmental_logs`
- `ai_analyses`
- `diagnoses`
- `recommendations`
- `recommendation_outcomes`

La mejora recomendada es usarlas como flujo real, no solo como estructura preparada.

### Plant

Debe representar la entidad viva principal.

Campos importantes:

- identidad actual;
- estado visible;
- plan de cuidado actual;
- contexto confirmado;
- ultima fecha de riego;
- ultima observacion;
- estado de creacion si aplica.

### Plant event

Debe registrar hechos.

Ejemplos:

- creacion;
- riego;
- foto;
- nota;
- revision de humedad;
- revision de plagas;
- correccion de ubicacion;
- cambio de sustrato;
- trasplante.

### Diagnosis

Debe guardar hipotesis, no verdades absolutas.

Ejemplos de causas probables:

- exceso de riego;
- falta de agua;
- falta de luz;
- exceso de sol directo;
- maceta sin drenaje;
- sustrato compactado;
- plaga probable;
- estres por frio/calor.

Campos recomendados:

```ts
type Diagnosis = {
  health_state: 'saludable' | 'necesita_atencion' | 'en_riesgo';
  health_score: number;
  symptoms_observed: string[];
  probable_causes: {
    cause: string;
    confidence: 'alta' | 'media' | 'baja';
    evidence: string;
  }[];
  questions_to_confirm: string[];
  safe_immediate_action: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  uncertainty_notes?: string;
};
```

### Recommendation

Debe transformar diagnosticos en acciones.

Ejemplos:

- revisar humedad en 24 horas;
- mover a luz indirecta;
- aislar por posible plaga;
- no regar hasta confirmar sustrato;
- tomar foto de seguimiento en 3 dias.

## Atomicidad y tolerancia a fallos

La creacion no deberia depender de que todos los pasos salgan perfectos.

Regla recomendada:

- Lo transaccional en base de datos debe ir junto.
- Storage y llamadas externas deben ser recuperables.
- Si falla una parte, la app debe dejar un estado claro.

Ejemplos:

| Fallo | Comportamiento deseado |
|---|---|
| Falla IA de identificacion | guardar borrador o planta parcial con especie no confirmada |
| Falla clima | usar plan conservador y marcar clima pendiente |
| Falla subida de foto | permitir planta sin foto y ofrecer reintento |
| Falla metadata de foto | registrar error y reintentar vinculacion |
| Falla diagnostico | guardar observacion sin diagnostico |

Esto evita perder el progreso del usuario.

## Tipado del frontend

El estado entre pantallas no debe viajar como `any`.

El flujo deberia tener tipos explicitos:

```ts
type NewPlantFlowMode =
  | 'photo_identification'
  | 'manual_entry'
  | 'diagnostic_first'
  | 'draft_resume'
  | 'existing_species';

type NewPlantFlowState = {
  mode: NewPlantFlowMode;
  draftId?: string;
  image?: string;
  plantData?: Partial<Plant>;
  diagnosisInput?: {
    userObservation?: string;
    suspectedIssue?: 'plaga' | 'luz' | 'riego' | 'sustrato' | 'otro';
  };
  city?: string;
  coords?: { lat: number; lon: number };
  context?: PlantContext;
};
```

Este tipo permite que el compilador avise si una pantalla espera foto cuando el caso manual no la tiene.

## Popping y recarga entre pantallas

El popping visual que se ve al cambiar de ventana probablemente viene de dos fuentes:

1. Cada pantalla vuelve a cargar sus propios datos desde Supabase.
2. Las rutas con `lazy()` muestran fallback mientras cargan el chunk de la nueva pantalla.

Esto se va a notar mas cuando el flujo tenga borradores, diagnosticos y pasos intermedios.

Recomendacion:

- crear un `PlantDataProvider` o store liviano para cachear plantas visibles, planta actual y estados de carga;
- emitir datos cacheados inmediatamente y refrescar en segundo plano;
- evitar pantallas vacias si ya hay datos recientes;
- prefetch de rutas criticas del flujo nueva planta;
- mantener el estado de creacion en un draft persistente o contexto compartido, no solo en `location.state`.

## Orden de implementacion recomendado

1. Definir tipos compartidos de `NewPlantFlowState`.
2. Crear un cache/contexto de datos para reducir popping entre Home, Lista, Calendario y Perfil.
3. Convertir `createPlantForUser` en orquestador tolerante a fallos.
4. Persistir salidas IA en `ai_analyses`.
5. Usar `diagnoses` para plagas, luz, sustrato, riego y problemas de salud.
6. Agregar borradores o estados de creacion parcial.

No conviene meter todo de golpe. El primer paso visible deberia ser cache/estado compartido, porque mejora experiencia sin cambiar la base de datos.
