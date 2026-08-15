# Plan de autenticacion para desarrollo local y produccion

Fecha: 2026-07-10.
Estado: diagnostico documentado; cambio externo y prueba pendientes.

## Problema

Al iniciar sesion desde localhost, el flujo OAuth termina en el dominio real. Esto impide probar cambios con rapidez y puede mezclar sesiones o datos de desarrollo con produccion.

## Evidencia del repositorio

- La app calcula el retorno con `window.location.origin`, por lo que respeta localhost y produccion.
- El frontend local corre en `http://localhost:3000`.
- Supabase es el proveedor de Auth y Google OAuth.
- `.env.local` contiene un `APP_URL` en puerto 3001, pero no se encontro uso actual de esa variable.

## Configuracion objetivo

En Supabase Auth -> URL Configuration:

- conservar el dominio real como **Site URL**;
- agregar como **Redirect URL** exacta `http://localhost:3000/home`;
- si se necesita tolerar mas rutas locales, autorizar solo el patron local minimo que soporte Supabase y que el equipo realmente use;
- conservar tambien la URL de retorno productiva correspondiente.

El callback de Google debe seguir apuntando al callback de Supabase indicado por el proveedor. El retorno final a localhost lo controla la Redirect URL autorizada por Supabase, no un callback OAuth distinto por cada pagina React.

## Criterios de aceptacion

1. Desde `http://localhost:3000/login`, Google Auth regresa a `http://localhost:3000/home`.
2. Desde produccion, Google Auth regresa al dominio productivo.
3. Refrescar `/home` funciona en ambos entornos.
4. No existe una URL productiva fija en el cliente para forzar el retorno.
5. La documentacion y `.env.local` usan el mismo puerto local.

## Seguridad y datos

Autorizar localhost para OAuth es una practica normal de desarrollo cuando la lista de retorno es explicita. No conviene usar comodines amplios en produccion.

Como siguiente decision, elegir una de estas estrategias:

- **Proyecto Supabase de desarrollo separado (recomendado):** aisla usuarios, datos, Storage y migraciones de prueba.
- **Proyecto compartido con datos marcados:** mas rapido al inicio, pero aumenta el riesgo de contaminar datos reales y probar RLS sobre informacion productiva.

## Fuera de alcance de este documento

- cambiar el proveedor de autenticacion;
- eliminar Supabase;
- implementar credenciales locales falsas;
- modificar codigo antes de verificar la configuracion remota.

