# Lleken

App móvil para cuidar plantas, iniciada desde Google AI Studio.

## Correr en local

Requisitos: Node.js instalado.

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Pegar tu clave de Gemini en `.env.local`:

   ```bash
   GEMINI_API_KEY="TU_CLAVE_DE_GEMINI"
   APP_URL="http://localhost:3000"
   ```

3. Levantar la app:

   ```bash
   npm run dev:api
   npm run dev
   ```

   Usa dos terminales: una para la API local y otra para Vite.

4. Abrir:

   ```text
   http://localhost:3000
   ```

En Windows PowerShell puede aparecer un bloqueo con `npm.ps1`. Si pasa, usa:

```bash
cmd /c npm.cmd run dev
```

## Servicios actuales

- Autenticación: Firebase Auth con Google.
- Base de datos: Firestore con colección global `plants`.
- Fotos: Firebase Storage; Firestore guarda `fotoUrl` y `fotoPath`.
- Perfil de usuario: se crea/actualiza en `users/{uid}` al iniciar sesión.
- IA: el frontend llama a `/api/ai/*`; la API local usa Gemini para identificar planta, generar cuidados y analizar fotos de seguimiento.

## Modelo de plantas

Las plantas se mantienen en una colección global para soportar cuidadores y futuro pago:

- `ownerId`: dueño de la planta.
- `caregiverIds`: cuidadores que pueden registrar cuidados.
- `memberIds`: dueño + cuidadores, usado para listar plantas visibles.
- `userId`: campo legacy para seguir leyendo plantas creadas antes de esta mantención.

El plan gratis usa `users/{uid}.ownedPlantLimit`, por ahora con valor inicial `3`, y cuenta solo plantas propias. Las plantas compartidas no consumen cupo del cuidador.

## Reglas Firebase

El repo incluye:

- `firestore.rules`: acceso por dueño/cuidador y compatibilidad con plantas legacy.
- `storage.rules`: imágenes restringidas a usuarios autenticados, con validación de tipo y tamaño.
- `firebase.json`: referencia a ambas reglas.

Nota: este proyecto usa una base Firestore con ID custom de AI Studio. Firebase Storage Rules solo puede consultar Firestore `(default)`, por eso Storage no puede validar membresía contra `plants` mientras la base no sea default.

## Opciones de base de datos

### Opción recomendada ahora: Firebase

Mantener Firebase es lo más directo porque la app ya usa Google Sign-In, Firestore y Storage. Permite crear plantas, guardar fotos en Storage, registrar cuidados y preparar el acceso compartido sin migrar Auth.

### Opción robusta para más adelante: Supabase

Buena si quieres SQL/Postgres, consultas más avanzadas y ownership explícito por filas. Requiere migrar Auth o conectar Google OAuth en Supabase, además de cambiar las llamadas actuales de Firebase.

### Opción app offline: SQLite local + sync

Útil si después se convierte a app nativa y quieres que funcione sin internet. Tiene más complejidad porque necesitas sincronización con un backend.

## Notas de local

Si el login con Google falla en localhost, revisa en Firebase Console:

- Authentication > Sign-in method > Google activado.
- Authentication > Settings > Authorized domains incluye `localhost`.

Si la identificación de plantas falla, revisa que `.env.local` tenga una clave válida de Gemini.
