# Firebase operativo

## Por que aparecen permisos insuficientes

La app inicializa Firestore con una base nombrada:

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

No hace falta reiniciar la base de datos para resolver eso. Primero hay que desplegar reglas a la base correcta.

## Archivos relevantes

- `firebase.json`: apunta Firestore a la base nombrada.
- `firestore.rules`: reglas para `users/{uid}` y `plants/{plantId}`.
- `storage.rules`: reglas para imagenes en Storage.

## Comando esperado

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

## Validacion manual

Despues del deploy:

- Iniciar sesion con Google.
- Confirmar que `users/{uid}` se crea o actualiza.
- Abrir Inicio/Mis plantas y confirmar que no aparecen warnings de permisos.
- Crear una planta de prueba cuando Gemini tenga creditos disponibles.

## Cuando si considerar reiniciar/migrar datos

Reiniciar o migrar datos solo vale la pena si:

- Hay plantas antiguas sin `ownerId`/`memberIds` y quieres normalizarlas.
- Decides moverte a la base `(default)` para simplificar reglas de Storage.
- Quieres separar ambientes `dev`/`prod`.

Mientras el problema sea de reglas, borrar datos no lo arregla.

## Nota sobre plantas compartidas

El modelo mantiene `memberIds` y `caregiverIds`, pero el listado principal del MVP consulta plantas propias por `ownerId` y plantas legacy por `userId`. La consulta por `memberIds` queda reservada para el paso de cuidadores, donde conviene probar reglas e indices en emulador antes de activarla en la ruta principal.
