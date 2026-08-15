# Firebase historico

Estado vigente 2026-06-02: Firebase no es la fuente operativa actual de Lleken. El flujo principal usa Supabase Auth, Supabase Postgres y Supabase Storage. Este archivo se conserva solo para interpretar deuda antigua o errores de bundles/commits previos.

No planificar trabajo nuevo sobre Firestore o Firebase Storage sin decision explicita. Para el estado real de datos, ver `DATABASE_STATE.md`.

## Por que aparecian permisos insuficientes

La app antigua inicializaba Firestore con una base nombrada:

```ts
getFirestore(app, firebaseConfig.firestoreDatabaseId)
```

Ese ID hoy es:

```text
ai-studio-e42563f0-2bca-4002-a006-e1f7d2da321f
```

Si las reglas se despliegan a `(default)` en vez de a esa base, el navegador seguira mostrando:

```text
Missing or insufficient permissions
```

En el flujo vigente no se debe resolver esto desplegando Firebase como camino principal. Si aparece este error en la app publicada, primero confirmar que el bundle desplegado sea el que usa Supabase.

## Archivos relevantes

- `firebase.json`: apunta Firestore a la base nombrada.
- `firestore.rules`: reglas para `users/{uid}` y `plants/{plantId}`.
- `storage.rules`: reglas para imagenes en Storage.

## Comando historico

Desde la raiz del repo:

```bash
firebase deploy --only firestore,storage
```

Si usas Firebase CLI sin sesion iniciada:

```bash
firebase login
firebase use gen-lang-client-0185924050
firebase deploy --only firestore,storage
```

## Validacion historica

Despues del deploy:

- Iniciar sesion con Google en un bundle antiguo.
- Confirmar que `users/{uid}` se crea o actualiza en Firestore.
- Abrir Inicio/Mis plantas y confirmar que no aparecen warnings de permisos.
- Crear una planta de prueba cuando Gemini tenga creditos disponibles.

## Cuando considerar estos datos

Estos datos solo son utiles si:

- necesitas leer plantas antiguas antes de descartarlas;
- investigas por que un deploy antiguo todavia carga Firebase;
- decides eliminar definitivamente restos Firebase del repo.

No migrar datos antiguos a Supabase por defecto; `DATABASE_STATE.md` ya registra que se acepta perder datos anteriores.

## Nota sobre plantas compartidas

El modelo Firestore antiguo mantenia `memberIds` y `caregiverIds`. El paso vigente de cuidadores debe reescribirse para Supabase usando tablas de membresia y RLS, no estos campos legacy.
