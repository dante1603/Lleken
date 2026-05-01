# Estado de base de datos y almacenamiento

Fecha: 2026-05-01

Este documento aclara el estado real de datos de Lleken para evitar decisiones confusas entre Firebase, Supabase y futuras migraciones.

## Resumen ejecutivo

Estado actual: **Firebase sigue siendo la base operativa real del proyecto**, pero no hay datos valiosos que obliguen a conservarlo.

- Auth: Firebase Auth con Google.
- Base de datos: Firestore en una base nombrada.
- Fotos: Firebase Storage.
- Reglas: existen reglas para `users/{uid}` y `plants/{plantId}`.
- Riesgo principal: Storage no puede validar membresia contra la base Firestore nombrada.
- Decision actualizada: **Supabase es candidato serio para la arquitectura final**. Antes de decidir si entra antes de Beta 1, conviene hacer un spike tecnico de 1-2 dias.

## Estado actual en codigo

Archivo: `src/lib/firebase.ts`

```ts
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

Esto significa que la app usa Firestore con el `firestoreDatabaseId` definido en `firebase-applet-config.json`.

## Base Firestore actual

Archivo: `firebase.json`

```json
{
  "firestore": [
    {
      "database": "ai-studio-e42563f0-2bca-4002-a006-e1f7d2da321f",
      "rules": "firestore.rules"
    }
  ]
}
```

La base actual no es `(default)`, sino:

```text
ai-studio-e42563f0-2bca-4002-a006-e1f7d2da321f
```

## Modelo actual

Colecciones activas:

- `users/{uid}`
- `plants/{plantId}`

Dentro de `plants/{plantId}` hoy vive casi todo:

- identidad de planta;
- foto principal;
- ubicacion y clima;
- plan de cuidados;
- contexto inferido/confirmado;
- estado de salud;
- campos de sharing (`ownerId`, `caregiverIds`, `memberIds`);
- fechas;
- `historial_acciones` como array acotado.

## Reglas actuales

### Firestore

`firestore.rules` permite:

- usuario lee/actualiza su propio `users/{uid}`;
- una planta se crea solo si `ownerId`, `userId` y `memberIds` corresponden al usuario autenticado;
- lectura de planta si el usuario es miembro;
- update completo si es owner;
- update acotado si es cuidador/miembro y no toca campos de sharing;
- delete solo si es owner.

Esto es una buena base para C5, pero todavia falta probar con dos cuentas reales.

### Storage

`storage.rules` permite:

- leer imagenes de plantas si el usuario esta autenticado;
- subir imagenes si el usuario esta autenticado y el archivo es imagen menor a 5 MB.

Limitacion importante:

- Storage no valida si el usuario pertenece a la planta.
- Esto ocurre porque Firebase Storage Rules solo puede consultar Firestore `(default)`, no la base nombrada actual.

## Estado de cuidadores

El modelo esta parcialmente preparado:

- `ownerId`
- `caregiverIds`
- `memberIds`

Pero el producto no esta completo:

- no hay UI final para invitar;
- no hay aceptacion de invitacion;
- el listado principal aun prioriza owner/legacy;
- falta prueba con dos cuentas;
- falta decidir si C5 sera por planta o si se posterga para gardens.

## Supabase

Supabase aparece como opcion futura en los requisitos, y con la aclaracion actual pasa a ser una opcion real de corto plazo.

Datos que cambian la evaluacion:

- no hay datos valiosos que migrar;
- el equipo quiere guardar imagenes aparte y dejar en base solo ids/paths/metadata;
- Supabase Free puede alcanzar para primeros testers si se controla Storage;
- Matyas ya tiene experiencia montando aplicaciones funcionales en Supabase;
- Supabase MCP puede acelerar schema y administracion de base.

Decision recomendada ahora:

- Hacer un spike Supabase acotado.
- No iniciar una migracion completa sin probar primero Auth Google + Storage + RLS + flujo minimo.
- Si el spike funciona en 1-2 dias, migrar antes de Beta 1 es viable.
- Si el spike se alarga, Firebase queda como puente temporal y Supabase pasa a siguiente checkpoint.

## Opciones futuras

### Opcion A - Mantener Firebase para Beta 1

Recomendada solo si el spike Supabase no demuestra el flujo minimo rapido.

Ventajas:

- Menos riesgo.
- El codigo ya funciona con Firebase.
- Permite probar producto antes de migrar infraestructura.
- Evita perder tiempo en migracion durante beta.

Deudas aceptadas:

- Storage con validacion limitada.
- Base nombrada incomoda para reglas de Storage.
- Modelo `historial_acciones` no escala para largo plazo.

### Opcion B - Migrar Firestore nombrado a `(default)`

Ventajas:

- Storage Rules podria validar membresia contra Firestore.
- Simplifica parte del ecosistema Firebase.

Riesgos:

- Requiere migracion/control de datos.
- Puede romper configuracion actual.
- No entrega valor directo al tester si el flujo individual aun no esta estable.

### Opcion C - Migrar a Supabase

Ventajas:

- PostgreSQL da mejor modelo relacional para gardens, observations, diagnoses y roles.
- Supabase Storage queda mas alineado con permisos.
- MCP y experiencia de Matyas pueden acelerar la construccion.
- Como no hay datos valiosos, no hay migracion historica dolorosa.

Riesgos:

- Migracion grande.
- Reescritura de reglas/queries/auth/storage.
- Puede consumir el mes completo y retrasar la beta.

## Decision para Beta 1

Para la primera beta cerrada:

1. Ejecutar spike Supabase de 1-2 dias.
2. Si funciona: planificar migracion temprana a Supabase con base vacia.
3. Si no funciona: mantener Firebase como puente para Beta 1.
4. En ambos casos, no bloquear Beta 1 con una migracion sin prueba.
5. Mantener `DATABASE_MIGRATION_PLAN.md` como mapa de decision.

## Preguntas abiertas

- La beta cerrada correra con el proyecto Firebase actual o se creara un ambiente separado?
- Cuantos testers tendra Beta 1?
- Se permitira que testers suban fotos reales desde el primer dia?
- El piloto PAC usara la misma base que los testers individuales o un ambiente separado?
- Queremos resolver primero C5 por planta o saltar a gardens mas adelante con un modelo mejor?
