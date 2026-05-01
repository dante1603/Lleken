# Plan de evolución de arquitectura — Lleken

> Documento de planificación, no de ejecución inmediata.
> Cruza: `../current/APP_OVERVIEW.md` (estado actual) + `../product/PLANT_CARE_RESEARCH.md` (fundamentos botanicos).
> Fecha: 2026-04-30.
> Actualizacion 2026-05-01: se incorporan como fuentes la postulacion Innova Sostenible, el plan de negocios, la investigacion comercial y el `PLAN_ARQUITECTURA.md` externo preparado desde Descargas. El eje de arquitectura se mantiene: motor tripartito, arquetipos, incertidumbre, `observations`, `diagnoses`, `gardens`, `careArchetypes` y `speciesCatalog`.

---

## 1. Diagnóstico en una frase

Hoy Lleken **funciona como calendario con foto**, pero la visión de producto pide un **copiloto hortícola** que razone con tres entradas (especie + clima + contexto del lugar) y hable en **probabilidades**, no en órdenes. La brecha más cara de cerrar después no es UI ni IA: **es el modelo de datos**.

---

## 2. Por qué la base de datos actual se va a quedar corta

### Problemas concretos del modelo actual

El documento `Plant` de hoy guarda **todo plano dentro del mismo objeto**:

- foto, especie, ubicación, clima, plan, contexto inferido, contexto confirmado, fechas, historial, e historial de acciones.

Eso causa cuatro problemas que vas a sentir muy pronto:

**a) `historial_acciones` es un array dentro del documento.**
Cada riego, foto, nota, etc. se mete ahí. Firestore tiene **límite de 1 MB por documento**. Una planta activa por 1 año puede acumular cientos de eventos. No vas a chocar con el límite la primera semana, pero **vas a chocar**, y migrar eso después es doloroso.

**b) No existe el concepto de "Huerto" (Garden).**
Si el proyecto llega a huertos comunitarios, varias personas cuidan **un mismo espacio físico** con **muchas plantas**. Hoy modelas eso como "una persona dueña + N cuidadores **por planta**". Si el huerto tiene 40 plantas, alguien tiene que invitar al cuidador 40 veces. **El modelo no representa la realidad.**

**c) El "arquetipo de cuidado" es información de catálogo, no de planta.**
Hoy `arquetipo_cuidado` se guarda en cada `plan_cuidados` de cada planta. Si mañana cambias la regla de "suculenta_cactus", tienes que actualizar **todas** las plantas. Debería vivir en una colección `careArchetypes` separada y la planta solo apuntar a ella.

**d) No hay forma de aprender.**
La visión de producto pide **ajuste continuo**: la IA debería usar fotos pasadas y resultados pasados para mejorar el plan. Pero hoy `historial_acciones` mezcla riegos con fotos con notas. No hay una colección `observations` que la IA pueda consultar como "hechos verificables sobre esta planta".

---

## 3. Modelo de datos propuesto (vista panorámica)

> No tienes que implementar todo de golpe. Esto es **el destino**, no el próximo paso.

```
users/{uid}                    ← perfil de usuario (igual que hoy)
gardens/{gardenId}             ← NUEVO: un huerto/jardín (espacio físico compartido)
  members/{uid}                ← subcolección: roles dentro del huerto
plants/{plantId}               ← planta individual (queda más liviana)
  observations/{obsId}         ← NUEVO subcolección: cada evento (riego, foto, nota, plaga…)
  diagnoses/{diagId}           ← NUEVO subcolección: cada vez que la IA opina sobre el estado
careArchetypes/{archetypeId}   ← NUEVO: catálogo de arquetipos (suculenta, aroide…)
speciesCatalog/{speciesKey}    ← persistir el knowledge dinámico que hoy vive en memoria
```

### Por qué cada uno

| Colección                    | Por qué existe                                                                                       |
|------------------------------|------------------------------------------------------------------------------------------------------|
| `gardens`                    | Modelar huertos comunitarios: muchas plantas + muchos cuidadores en un mismo espacio físico.         |
| `gardens/{id}/members`       | Roles (`owner`, `caregiver`, `viewer`) sin tener que repetirlos en cada planta.                      |
| `plants/{id}/observations`   | Sacar el array `historial_acciones` del documento. Cada evento es un doc → escala infinito.          |
| `plants/{id}/diagnoses`      | Separar "lo que la IA cree" de "lo que el usuario confirmó". Es la base del aprendizaje acumulado.   |
| `careArchetypes`             | Reglas de cuidado en un solo lugar. Si actualizas "suculenta_cactus", todas las plantas se benefician.|
| `speciesCatalog`             | Hoy el catálogo dinámico vive en memoria del servidor. Si reinicias el server, se pierde.           |

---

## 4. Tareas de documentación (antes de tocar código)

Sirven para ver la app entera y detectar lo que no se ve en archivos sueltos.

### Doc-1. Diagrama de Casos de Uso (UML)
**Qué responde:** ¿Quién hace qué en la app? ¿Qué puede hacer un dueño vs. un cuidador vs. un visitante?
**Herramienta sugerida:** [Mermaid](https://mermaid.live) (texto → diagrama, vive en el repo).
**Entrega:** `docs/architecture/diagrams/casos-de-uso.md` (Mermaid).
**Tiempo estimado:** 1–2 horas.

### Doc-2. Diagrama Entidad-Relación (ER) del modelo actual
**Qué responde:** ¿Cómo se ven los datos hoy? ¿Qué se relaciona con qué?
**Por qué primero el actual:** para detectar dolor antes de proponer el nuevo.
**Entrega:** `docs/architecture/diagrams/er-actual.md` (Mermaid `erDiagram`).
**Tiempo estimado:** 1 hora.

### Doc-3. Diagrama ER del modelo propuesto
**Qué responde:** Lo mismo pero con `gardens`, `observations`, `careArchetypes`.
**Entrega:** `docs/architecture/diagrams/er-propuesto.md`.
**Tiempo estimado:** 1–2 horas.

### Doc-4. Diagrama de Secuencia: flujo "Nueva Planta"
**Qué responde:** Qué pasa **paso a paso** entre Camera.tsx, server, Gemini, Firestore y Storage cuando creas una planta.
**Entrega:** `docs/architecture/diagrams/seq-nueva-planta.md` (Mermaid `sequenceDiagram`).
**Tiempo estimado:** 1 hora.

### Doc-5. Diagrama de Secuencia: flujo "Seguimiento por foto"
**Qué responde:** Cómo viaja una foto de seguimiento, cómo se compara con la anterior, cómo se actualiza el estado.
**Entrega:** `docs/architecture/diagrams/seq-seguimiento.md`.
**Tiempo estimado:** 1 hora.

### Doc-6. Diagrama de Componentes / Arquitectura lógica
**Qué responde:** ¿Qué módulos hay? ¿Cómo dependen entre sí? (`pages/` → `lib/ai.ts` → `server/index.ts` → Gemini / Firebase / Open-Meteo).
**Entrega:** `docs/architecture/diagrams/arquitectura.md`.
**Tiempo estimado:** 1 hora.

### Doc-7. Mapa de pantallas y navegación (User Flow)
**Qué responde:** Cómo se mueve el usuario entre pantallas. Útil para detectar callejones sin salida.
**Entrega:** `docs/architecture/diagrams/user-flow.md`.
**Tiempo estimado:** 1–2 horas.

### Doc-8. Diagrama de Estados de una planta
**Qué responde:** Una planta nace → saludable → necesita_atencion → en_riesgo → recuperada / perdida. ¿Qué eventos disparan cada transición?
**Entrega:** `docs/architecture/diagrams/estados-planta.md` (Mermaid `stateDiagram-v2`).
**Tiempo estimado:** 1 hora.

> **Total estimado de documentación:** ~10 horas, divisibles en sesiones de 1–2 horas.
> **Sugerencia TDAH-friendly:** una sesión = un diagrama. No los hagas todos seguidos.

---

## 5. Checkpoints técnicos propuestos (continúan la nomenclatura C1…C4)

> Cada checkpoint es **una entrega completa y verificable**. No empezar el siguiente antes de cerrar el actual.

### C5 — Cuidadores básicos (ya estaba planificado)
**Estado:** pendiente, ya definido en `../process/CHECKPOINTS.md`.
**Lo dejamos como está**: dueño invita cuidador a una planta, cuidador la ve y la cuida.
**No metemos `gardens` todavía.** Primero hacer funcionar el caso simple.

### C6 — Sacar `historial_acciones` a subcolección `observations`
**Por qué ahora:** antes de que las plantas acumulen meses de datos.
**Alcance:**
- Crear subcolección `plants/{id}/observations/{obsId}`.
- Migrar acciones existentes con script de migración (un solo uso).
- Actualizar `PlantProfile.tsx` para leer de la subcolección con paginación (últimas 20 acciones).
- Mantener `fecha_ultimo_riego` y `fecha_ultimo_seguimiento` como campos derivados denormalizados en el doc principal (para queries rápidas).

**Tipo de evento (nuevo):**
```ts
Observation {
  id: string
  tipo: 'riego' | 'foto' | 'nota' | 'plaga' | 'fertilizacion' | 'poda' | 'trasplante'
  fecha: number
  autorUid: string                  // quién registró (dueño o cuidador)
  descripcion?: string
  // Solo si tipo === 'foto'
  fotoUrl?: string
  fotoPath?: string
  diagnosisId?: string              // referencia al diagnóstico IA asociado
  // Solo si tipo === 'plaga'
  plagaSospechada?: string
  aislamiento?: boolean
}
```

### C7 — Catálogo de arquetipos como colección
**Por qué ahora:** los arquetipos son el núcleo de la inferencia. Necesitan vivir en un solo lugar.
**Alcance:**
- Crear `careArchetypes/{archetypeId}` con campos: nombre, regla_humedad, luz_categoria, humedad_objetivo, temp_min, temp_max, fertilizacion_temporada, señales_alerta, fracasos_tipicos.
- Seedear con los 6 arquetipos de `aiSchema.ts` (suculenta_cactus, aroide_tropical, alta_humedad, baja_luz_resistente, floracion_interior, comestible_aromatica).
- En `Plant`, cambiar `arquetipo_cuidado: string` por `archetypeRef: string` (referencia al doc del catálogo).
- Endpoint admin para editar arquetipos sin tocar código.

### C8 — Modelo `Garden` (huerto comunitario)
**Por qué ahora:** sin esto, los espacios comunitarios no son defendibles técnicamente.
**Alcance:**
- Nueva colección `gardens/{gardenId}` con: nombre, descripción, lat, lon, ciudad, fotoPortada.
- Subcolección `gardens/{id}/members/{uid}` con rol: `owner` | `caregiver` | `viewer`.
- En `Plant`, agregar campo opcional `gardenId`.
- Reglas Firestore: si la planta tiene `gardenId`, los miembros del huerto la pueden ver/editar según su rol.
- Pantalla `/jardin/:id` con vista de huerto (mapa + lista de plantas + miembros).
- **No** romper plantas individuales sin huerto. Coexisten.

### C9 — Diagnósticos como subcolección `diagnoses` + motor tripartito
**Por qué ahora:** acá empieza la diferenciación real frente a competidores.
**Alcance:**
- Subcolección `plants/{id}/diagnoses/{diagId}`:
```ts
Diagnosis {
  fecha: number
  origen: 'identificacion_inicial' | 'seguimiento_foto' | 'manual'
  fotoUrl?: string
  // Inputs del motor tripartito
  inputVision: { especie?, confianza?, sintomas_observados[] }
  inputClima: { temp_actual, temp_max, lluvia_24h, humedad }
  inputContexto: { ubicacion_tipo, drenaje, tamano_maceta, luz }
  // Output con incertidumbre
  causas_probables: { causa: string, probabilidad: number, evidencia: string }[]
  preguntas_de_confirmacion: string[]
  accion_segura_inmediata: string
  riesgo: 'bajo' | 'medio' | 'alto' | 'critico'
}
```
- Refactorizar prompts de Gemini para devolver este formato estructurado.
- UI que muestre el diagnóstico como **"hipótesis con probabilidad"**, no como verdad absoluta.

### C10 — Persistir `speciesCatalog` en Firestore (deuda conocida)
**Por qué ahora:** ya documentado en `../current/APP_OVERVIEW.md` como deuda. Este es el momento natural.
**Alcance:** mover el catálogo dinámico de memoria del server a colección Firestore.

### C11 — Migración a base `(default)` y Cloud Functions
**Deuda técnica grande.** Requiere ventana de mantenimiento. Probablemente último checkpoint antes de demo o presentación importante.

---

## 6. Orden recomendado y por qué

```
[Doc-1, Doc-2, Doc-7]  ← primero, en cualquier orden, dan visión global
       ↓
[Doc-3]                ← decide si el modelo propuesto te convence
       ↓
[Doc-4, Doc-5, Doc-6, Doc-8]  ← profundizan zonas específicas
       ↓
C5 → C6 → C7 → C8 → C9 → C10 → C11
```

**Regla de oro:** no empezar C8 (Gardens) sin tener C5 (Cuidadores) cerrado y testeado. Gardens depende del modelo de roles que C5 valida.

---

## 7. Riesgos y trampas a evitar

- **No migres todo el modelo de un golpe.** Cada checkpoint debe dejar la app funcionando.
- **Scripts de migración una vez.** Cada vez que agregues una subcolección, escribe un script que migre las plantas viejas. No dejes "limbo" donde unas plantas usan modelo nuevo y otras viejo durante meses.
- **Tests antes de tocar `plants.ts`.** Ya tienes `plants.test.ts`. Cuando refactorices, los tests viejos no deben romperse (o si rompen, debe ser intencional y documentado).
- **No prometas C8 (Gardens) si no vas a llegar.** Mejor llevar C5–C7 sólidos a una presentación que C5–C9 inestables.

---

## 8. Métricas de éxito por checkpoint

| Checkpoint | Pregunta que debe responder |
|------------|----------------------------|
| Documentación | ¿Puedo explicar la app a alguien externo en 5 minutos con los diagramas? |
| C5 | ¿Dos cuentas Google distintas pueden cuidar la misma planta? |
| C6 | ¿Puedo registrar 100 riegos sin que el documento de planta crezca? |
| C7 | ¿Cambio una regla de "suculenta" en un solo lugar y todas las suculentas se actualizan? |
| C8 | ¿Puedo crear un huerto, sumar 5 plantas y 3 cuidadores en menos de 2 minutos? |
| C9 | ¿Cuando subo una foto borrosa, la IA dice "no estoy seguro" en lugar de inventar? |

---

## 9. Próximo paso concreto

1. ~~Hacer commit del trabajo C2–C4~~ — **hecho**.
2. Usar la carpeta `docs/architecture/diagrams/`.
3. Empezar por **Doc-2 (ER actual)**. Es el más útil: te muestra el dolor antes de proponer cura.
4. Una vez tengas Doc-2, agendar una sesión de 1 hora para Doc-7 (User Flow) y otra para Doc-3 (ER propuesto).

No empezar código de C5 hasta tener al menos Doc-2 + Doc-3 listos. **Sin el ER propuesto, C5 puede contradecir C8.**

---

## 10. Actualizacion de foco - 2026-05-01

La postulacion al concurso ya fue enviada. El foco de mayo es preparar un prototipo beta pequeno antes del 2026-06-01, por lo que el orden de diagramas cambia para maximizar claridad con equipo/testers antes de entrar a migraciones.

Orden actual recomendado:

1. Casos de uso.
2. User flow / navegacion.
3. Componentes / arquitectura logica.
4. Secuencia nueva planta.
5. Secuencia seguimiento por foto.
6. ER actual.
7. ER propuesto.
8. Estados de planta.
9. Clases / modelo TypeScript de dominio.

No empezar codigo grande de C5 hasta tener al menos casos de uso, user flow, componentes y ER actual revisados.

Drive queda como lectura por ahora; los diagramas fuente viven en el repo y las versiones de lectura se exportan a PDF.
