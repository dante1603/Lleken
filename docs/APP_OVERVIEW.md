# Lleken — Visión general de arquitectura y funcionalidad

> Documento vivo. Actualizar al cerrar cada checkpoint.
> Última actualización: 2026-04-28, cierre de C4.

Este archivo es el punto de entrada para entender el proyecto completo. Sirve como contexto para sesiones de diseño, ideación de mejoras y onboarding de nuevas herramientas o colaboradores.

---

## Qué es Lleken

App mobile-first para cuidar plantas. El flujo central es: el usuario toma una foto de su planta → la IA la identifica → el usuario confirma su ubicación → la IA genera un plan de cuidados ajustado al clima real → la app guarda todo y muestra un calendario de tareas, historial de cuidados y seguimiento por foto.

**Público objetivo:** personas con plantas en casa o balcón que quieren recordatorios útiles, no formularios complicados.

**Idioma de la UI:** español.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 |
| Estilos | Tailwind CSS v4 (plugin Vite) |
| Animaciones | Motion (Framer Motion v12) |
| Routing | React Router v7 |
| Iconos | Lucide React |
| UI primitives | Radix UI (Dialog, Slot) |
| Backend local | Express 4 + tsx (watch mode) |
| IA | Google Gemini 2.5 Flash (via `@google/genai`) |
| Auth | Firebase Auth (Google Sign-In) |
| Base de datos | Firestore (base nombrada, no `default`) |
| Fotos | Firebase Storage |
| Clima y geocoding | Open-Meteo (gratuito, sin clave) |
| Tests | Vitest |
| Build | Vite con chunks manuales (firebase, vendor, ui) |

### Variables de entorno (`.env.local`)

```
GEMINI_API_KEY=     # clave de Google AI Studio
APP_URL=http://localhost:3000
API_PORT=8787       # opcional, default 8787
```

---

## Comandos esenciales

```bash
npm run dev:api     # levanta Express en puerto 8787 (con hot-reload)
npm run dev         # levanta Vite en puerto 3000
npm run check       # lint + build + tests (verificación completa)
npm run lint        # solo TypeScript --noEmit
npm run build       # build de producción
npm run test        # tests con Vitest
```

En Windows PowerShell usar `cmd /c npm.cmd run dev` si aparece bloqueo de `.ps1`.

---

## Estructura de archivos

```
Lleken/
├── server/
│   ├── index.ts                 # API Express: endpoints IA, geocoding, knowledge
│   └── dynamicPlantKnowledge.ts # repositorio y lógica de conocimiento dinámico de IA
├── src/
│   ├── App.tsx                  # router principal, lazy loading de rutas
│   ├── main.tsx                 # punto de entrada React
│   ├── index.css                # estilos base Tailwind
│   ├── contexts/
│   │   └── AuthContext.tsx      # proveedor de autenticación Firebase
│   ├── components/
│   │   ├── BottomNav.tsx        # navegación inferior mobile
│   │   ├── NewPlantProgress.tsx # barra de progreso del flujo nueva planta
│   │   └── PrivateRoute.tsx     # guarda de rutas autenticadas
│   ├── lib/
│   │   ├── ai.ts                # cliente frontend: llama /api/ai/*
│   │   ├── aiSchema.ts          # normalización y validación de respuestas IA
│   │   ├── aiErrors.ts          # mensajes de error amigables para errores IA
│   │   ├── firebase.ts          # inicialización Firebase (app, auth, db, storage)
│   │   ├── images.ts            # compresión de imágenes antes de enviar
│   │   ├── plants.ts            # CRUD Firestore, lógica de dominio (riego, historial)
│   │   ├── plantFormatters.ts   # funciones de formato separadas de la UI
│   │   ├── plantKnowledge.ts    # catálogo estático de especies conocidas
│   │   ├── utils.ts             # helpers generales
│   │   └── weather.ts           # consulta Open-Meteo, resumen de clima
│   ├── pages/                   # pantallas (ver sección Rutas)
│   └── types/
│       └── index.ts             # tipos TypeScript compartidos
├── docs/
│   ├── APP_OVERVIEW.md          # este archivo
│   ├── AI_PIPELINE.md           # detalle del flujo IA paso a paso
│   ├── CHECKPOINTS.md           # estado actual y próximo checkpoint
│   ├── FIREBASE.md              # notas de la base nombrada y reglas
│   ├── PLANT_CARE_RESEARCH.md   # investigación botánica para mejorar planes
│   ├── SMOKE_TEST.md            # checklist manual antes de deploy
│   └── WORKFLOW.md              # reglas de trabajo por ciclos cortos
├── firestore.rules
├── storage.rules
├── firebase.json
├── vite.config.ts
└── ROADMAP.md                   # visión de producto y pasos de ejecución
```

---

## Rutas y pantallas

Todas las rutas excepto `/login` son privadas (requieren auth).

| Ruta | Archivo | Qué hace |
|---|---|---|
| `/login` | `Login.tsx` | Login con Google |
| `/home` | `Home.tsx` | Dashboard: saludo, contadores, acceso rápido |
| `/plants` | `PlantsList.tsx` | Listado de plantas con búsqueda y filtros |
| `/calendar` | `Calendar.tsx` | Calendario de tareas derivadas del plan de cuidados |
| `/nueva-planta` | `Camera.tsx` | Captura de foto (cámara o galería) |
| `/nueva-planta/identificando` | `IdentifyPlant.tsx` | Muestra resultado de identificación IA |
| `/nueva-planta/ubicacion` | `LocationInput.tsx` | Input de ciudad/geolocación con sugerencias |
| `/nueva-planta/generando` | `GeneratingProfile.tsx` | Genera plan + guarda planta en Firestore |
| `/planta/:id` | `PlantProfile.tsx` | Ficha completa: foto, estado, plan, historial |
| `/planta/:id/actualizar-desde-foto` | `RefreshPlantPreview.tsx` | Re-identifica planta desde foto nueva |
| `/planta/:id/seguimiento` | `FollowUpCamera.tsx` | Captura foto de seguimiento |
| `/planta/:id/seguimiento/analizando` | `FollowUpIdentify.tsx` | Analiza foto de seguimiento con IA |
| `/profile` | `Profile.tsx` | Perfil de usuario, estadísticas, plan, logout |

### Navegación inferior (BottomNav)

Visible en todas las pantallas autenticadas. Tabs: Inicio, Mis plantas, Cámara (acción principal), Calendario, Perfil.

---

## Modelo de datos — Firestore

### Colección `plants/{plantId}`

```ts
Plant {
  // Identidad
  id: string
  ownerId?: string           // uid del dueño
  caregiverIds?: string[]    // uids de cuidadores
  memberIds?: string[]       // ownerId + caregiverIds (para queries)
  userId?: string            // campo legacy (plantas creadas antes del modelo de cuidadores)

  // Foto
  fotoUrl?: string           // URL pública de Firebase Storage
  fotoPath?: string          // path en Storage (para eliminar)

  // Especie
  nombrePersonalizado?: string
  nombre_sugerido?: string   // apodo creativo generado por IA
  nombre_comun?: string
  nombre_cientifico?: string
  species_key?: string       // slug para conocimiento dinámico
  familia?: string
  knowledge_source?: {
    source: 'static_catalog' | 'ai_generated'
    catalogId?: string
    confidence?: 'alta' | 'media' | 'baja'
    matchedBy?: 'scientific_name' | 'common_name' | 'alias'
  }

  // Estado de salud
  estado?: 'saludable' | 'necesita_atencion' | 'en_riesgo'
  puntuacion_salud?: number  // 0–100

  // Ubicación y clima
  ciudad?: string
  lat?: number
  lon?: number
  clima_actual?: WeatherConditions  // temp_actual, temp_max, temp_min, lluvia, humedad_relativa

  // Plan de cuidados (generado por IA, normalizado)
  plan_cuidados?: CarePlan

  // Contexto inferido por IA desde la foto
  contexto_inferido?: {
    ubicacion_tipo?: 'interior' | 'balcon' | 'exterior' | null
    maceta_con_drenaje?: boolean | null
    tamano_maceta?: 'pequena' | 'mediana' | 'grande' | null
    luz_usuario?: 'baja' | 'media' | 'brillante_indirecta' | 'sol_directo' | null
  }

  // Contexto confirmado por el usuario
  contexto?: {
    ubicacion_tipo?: 'interior' | 'balcon' | 'exterior'
    maceta_con_drenaje?: boolean
    tamano_maceta?: 'pequena' | 'mediana' | 'grande'
    luz_usuario?: 'baja' | 'media' | 'brillante_indirecta' | 'sol_directo'
  }

  // Info general
  info_general?: { descripcion, origen, curiosidades[], usos_comunes[], condiciones_ideales }

  // Fechas y historial
  fecha_creacion: number     // timestamp ms
  fecha_ultimo_riego?: number
  fecha_ultimo_seguimiento?: number
  historial_acciones?: PlantAction[]
}
```

#### Tipo `CarePlan` (dentro de `plan_cuidados`)

```ts
CarePlan {
  riego_frecuencia_dias?: number     // estimación base en días
  instrucciones?: string
  alertas_clima?: string[]
  riego_ajuste_clima?: string
  exposicion_sol?: string            // texto libre para UI
  seguimiento_foto_dias?: number
  tareas_adicionales?: string[]

  // Campos estructurados (C4)
  arquetipo_cuidado?: CareArchetype
    // suculenta_cactus | aroide_tropical | alta_humedad
    // baja_luz_resistente | floracion_interior | comestible_aromatica

  regla_humedad_sustrato?: SoilMoistureRule
    // top_2cm_seco | top_5cm_seco | secar_completo | humedad_pareja

  luz_categoria?: LightCategory
    // baja_media | brillante_indirecta | media_alta
    // sol_directo_suave | sol_directo_alto

  humedad_objetivo?: 'baja' | 'media' | 'alta'
  temp_min_segura_c?: number
  temp_max_confort_c?: number
  drenaje_requerido?: boolean
  fertilizacion_temporada?: 'crecimiento_activo' | 'minima' | 'no_recomendada'
  toxicidad?: { humanos?, mascotas?, irritante_piel? }
  senales_alerta?: string[]
}
```

#### Tipo `PlantAction` (dentro de `historial_acciones`)

```ts
{
  tipo: 'creacion' | 'riego' | 'revision_humedad' | 'revision_plagas'
       | 'fertilizacion' | 'poda' | 'trasplante' | 'cosecha'
       | 'foto' | 'nota' | 'tratamiento_plaga'
  fecha: number
  descripcion?: string
  seguimiento?: Partial<Seguimiento>  // solo cuando tipo === 'foto'
}
```

### Colección `users/{uid}`

```ts
AppUserProfile {
  name: string
  email: string | null
  photoURL: string | null
  plan: 'free' | 'paid'
  ownedPlantLimit: number    // default 3 en free
  createdAt: number
  updatedAt?: number
}
```

### Firebase Storage

Estructura de paths: `plants/{plantId}/profile/{uid}-{timestamp}-{random}.jpg`
y `plants/{plantId}/follow-up/{uid}-{timestamp}-{random}.jpg`.

**Nota importante:** La base Firestore usa un ID custom (`ai-studio-e42563f0-2bca-4002-a006-e1f7d2da321f`). Firebase Storage Rules solo puede consultar la base `(default)`, por lo que Storage no valida membresía contra `plants` mientras no se migre. Ver `docs/FIREBASE.md`.

---

## Backend API (`server/index.ts`)

Express corriendo en `http://localhost:8787`. Vite hace proxy de `/api/*` a este puerto.
Modelo Gemini: `gemini-2.5-flash`.

### Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | healthcheck |
| GET | `/api/ai/usage` | resumen de tokens y costo estimado Gemini (últimas 100 llamadas) |
| GET | `/api/location/search?query=&count=` | autocomplete de ciudades vía Open-Meteo Geocoding |
| GET | `/api/location/reverse?latitude=&longitude=` | geocoding inverso vía Open-Meteo |
| GET | `/api/plants/knowledge` | catálogo estático de especies conocidas |
| GET | `/api/plants/knowledge/dynamic` | catálogo dinámico generado por IA |
| GET | `/api/plants/knowledge/dynamic/:speciesKey` | entrada individual del catálogo dinámico |
| POST | `/api/plants/knowledge/dynamic/ensure` | genera o recupera conocimiento dinámico para una especie |
| POST | `/api/ai/identify-plant` | identifica especie desde foto (base64) |
| POST | `/api/ai/care-plan` | genera plan de cuidados con datos botánicos + clima |
| POST | `/api/ai/follow-up` | analiza foto de seguimiento |
| POST | `/api/ai/refresh-plant-from-photo` | re-identifica + regenera plan desde foto nueva |

### Manejo de errores Gemini

- `429 RESOURCE_EXHAUSTED`: el plan de cuidados tiene fallback a plan conservador local. La identificación falla con error legible.
- `503 unavailable`: igual que 429 para plan de cuidados.
- Clave ausente: error 500 inmediato.

---

## Pipeline de IA — flujo nueva planta

1. **Camera.tsx** captura foto → `compressImageFile` reduce peso → imagen como data URL.
2. **POST `/api/ai/identify-plant`** → Gemini identifica especie, estado, puntuación, info general y contexto inferido → `normalizePlantIdentification` valida y aplica fallbacks.
3. El backend intenta enriquecer con `plantKnowledge.ts` (catálogo estático). Si no hay match, se marca `ai_generated`.
4. **LocationInput.tsx** pide ciudad o usa geolocalización → `GET /api/location/search` o `/api/location/reverse`.
5. **weather.ts** consulta Open-Meteo con coordenadas → genera `weatherSummary` y `WeatherConditions`.
6. **POST `/api/ai/care-plan`** → si hay match estático, usa ese plan directamente sin llamar IA. Si no, Gemini genera plan con contexto de clima → `normalizeCarePlan` valida rangos y tipos.
7. **plants.ts / createPlantForUser** → sube foto a Storage, crea documento Firestore con todos los campos, establece `ownerId`, `memberIds`.
8. **PlantProfile.tsx** renderiza datos guardados. No vuelve a llamar IA.

### Flujo seguimiento

1. **FollowUpCamera.tsx** captura foto.
2. **POST `/api/ai/follow-up`** → Gemini analiza estado, síntomas, riesgo y recomendación → `normalizeFollowUpResult`.
3. **plants.ts / recordFollowUp** → sube foto a Storage, actualiza `estado`, `puntuacion_salud`, `fecha_ultimo_seguimiento` e inserta acción en `historial_acciones`.

### Flujo refresh desde foto

1. Desde **PlantProfile.tsx** → **RefreshPlantPreview.tsx**.
2. **POST `/api/ai/refresh-plant-from-photo`** → re-identifica (si Gemini disponible) + regenera plan.
3. El usuario confirma los cambios antes de guardar.

---

## Sistema de conocimiento de plantas

### Catálogo estático (`src/lib/plantKnowledge.ts`)

Lista curada de especies comunes con plan de cuidados predefinido. Cuando hay match por nombre científico, nombre común o alias, el plan se usa directamente sin llamar Gemini (más rápido, sin costo, sin riesgo de respuesta inválida).

Versión actual: `2026-04-28`.

Especies incluidas (al cierre de C4): Monstera deliciosa, Epipremnum aureum (Pothos), Sansevieria (Lengua de suegra), Cactaceae general, y otras. Ver el archivo para la lista completa.

### Catálogo dinámico (`server/dynamicPlantKnowledge.ts`)

Para especies no cubiertas por el catálogo estático. Cuando una especie no tiene match, el backend puede generar y almacenar un registro dinámico con Gemini. Los registros tienen estado (`ai_generated`, `reviewed`, `rejected`, `merged`) y un contador de uso.

**Estado actual:** la infraestructura y los tipos están definidos. El repositorio en memoria está funcional. La persistencia a Firestore está preparada pero no activada aún.

---

## Lógica de dominio — riego y calendario (`src/lib/plants.ts`)

### `getAdjustedWateringFrequency(plant)`

Toma `riego_frecuencia_dias` como base y aplica ajustes:
- Lluvia + planta exterior: +2 días.
- Temperatura ≥ 28°C: −25% (redondeo hacia abajo, mínimo 1 día).
- Temperatura ≤ 12°C: +25% (redondeo hacia abajo).
- Los ajustes se combinan (ej. lluvia + frío = +3 días en exterior).

### `getWateringStatus(plant)`

Calcula si la planta necesita riego hoy basándose en `fecha_ultimo_riego` y la frecuencia ajustada. Devuelve `{ isDue: boolean, nextWateringDays: number }`.

### `assertOwnPlantLimit(uid)`

Antes de crear una planta, cuenta las plantas propias del usuario. Si el plan es `free` y llegó al límite (`ownedPlantLimit`, default 3), lanza error. Las plantas compartidas no consumen cupo.

---

## Normalización de IA (`src/lib/aiSchema.ts`)

Todas las respuestas de Gemini pasan por funciones de normalización antes de llegar a Firestore o la UI:

- `normalizePlantIdentification`: aplica fallbacks (`'Planta sin identificar'`, `puntuacion_salud: 75`, etc.), sanitiza strings, valida enums.
- `normalizeCarePlan`: restringe `riego_frecuencia_dias` a 1–30 días, `seguimiento_foto_dias` a 1–30, valida arquetipos y categorías de luz contra enums conocidos. Si `arquetipo_cuidado` es `suculenta_cactus`, deriva `regla_humedad_sustrato: 'secar_completo'` y `humedad_objetivo: 'baja'` automáticamente.
- `normalizeFollowUpResult`: valida `estado`, `riesgo` y arrays de síntomas.

---

## Tests (`src/lib/__tests__/`)

| Archivo | Qué cubre |
|---|---|
| `ai.test.ts` | `normalizePlantIdentification` y `normalizeCarePlan`: fallbacks, sanitización, límites numéricos, arquetipos |
| `plants.test.ts` | `getAdjustedWateringFrequency` (lluvia, calor, frío, combinados) y `getWateringStatus` |

Correr con `npm run test` o incluido en `npm run check`.

---

## Estado actual del proyecto

**Checkpoint activo completado:** C4

### Qué está funcionando

- Login con Google y perfil de usuario en Firestore.
- Flujo completo: foto → identificación IA → ubicación → plan → ficha.
- Fotos guardadas en Firebase Storage; Firestore solo guarda URL y path.
- Historial de acciones (riego, seguimiento, notas) en la ficha de planta.
- Seguimiento por foto con análisis IA y actualización de estado.
- Refresh de planta desde foto nueva.
- Calendario con tareas derivadas del plan, ajustadas por clima.
- Límite de plan gratis (3 plantas propias).
- Bundle optimizado con chunks separados.
- Tests unitarios para lógica de IA y dominio.
- Smoke test documentado.

### Deuda conocida

- `ownedPlantLimit` bloquea creación pero no hay UI de upgrade aún.
- Flujo de cuidadores: el modelo de datos está listo (`caregiverIds`, `memberIds`) pero no hay UI para invitar ni listar plantas compartidas.
- La base Firestore es nombrada; Storage Rules no puede validar membresía. Mitigación: reglas de Storage validan solo auth, no pertenencia a la planta.
- `server/index.ts` debe migrar a Cloud Functions o Cloud Run antes de producción.
- El catálogo dinámico no persiste a Firestore todavía (solo memoria en runtime).
- Bundle de producción supera el umbral de advertencia de Vite (deuda aceptada).

### Git — advertencia

Todo el trabajo de C2–C4 está **sin commit**. El último commit es `dd44009 fase c1 lista`. Antes de empezar C5, correr:

```bash
git add .
git commit -m "fase c2-c4 completa: ficha, calendario, calidad y tests"
```

---

## Próximo checkpoint — C5: Cuidadores básicos

Ver definición completa en `docs/CHECKPOINTS.md`. Resumen:

- El dueño puede agregar un cuidador a una planta (por UID o email).
- El cuidador ve la planta en su listado.
- El cuidador puede registrar riego y seguimiento, pero no eliminar la planta.
- La planta compartida no consume cupo del cuidador.
- Se prueban las reglas Firestore con dos cuentas distintas.

---

## Ideas y mejoras anotadas (para sesiones de diseño)

Estas no están en ningún checkpoint activo. Son semillas para futuros ciclos.

**Experiencia de usuario:**
- Onboarding de primer uso con demo sin cuenta.
- Modo oscuro.
- Notificaciones push / PWA para recordatorios de riego.
- Galería de fotos por planta con línea de tiempo visual.
- Widget de estado rápido (watering streak, racha de días sin problemas).

**IA y cuidados:**
- Ajustar el plan automáticamente con cada seguimiento (aprendizaje acumulado).
- Detección de plagas específicas con más detalle y pasos de tratamiento.
- Modo "planta nueva sin identificar" con plan genérico seguro mientras se confirma la especie.
- Estimación de humedad del sustrato desde foto (sin sensores físicos).
- Considerar estación del año para ajustar fertilización y frecuencia de riego.

**Datos y negocio:**
- Dashboard de cuidados de la semana con resumen visual.
- Exportar historial de una planta como PDF o imagen.
- Límite de plan gratis con CTA de upgrade integrado en el flujo.
- Administración manual de plan pago (lista de espera o pago directo).
- Estadísticas del jardín: plantas por arquetipo, alertas frecuentes, racha de cuidados.

**Técnico:**
- Migrar base Firestore a `(default)` para habilitar validación de membresía en Storage Rules.
- Activar persistencia del catálogo dinámico en Firestore.
- Migrar API a Cloud Functions para producción real.
- Tests e2e con Playwright para los flujos críticos.
- Separar ambientes `dev` y `prod` en Firebase.
