# Requisitos Beta 1 - cuidado individual robusto

Version: 0.1
Fecha: 2026-05-01
Estado: borrador operativo

Este documento deriva de `REQUISITOS.md`, pero recorta el alcance para la primera beta cerrada. `REQUISITOS.md` queda como vision maestra; este archivo define lo que realmente debe estar estable para probar con un grupo pequeno antes del 2026-06-01.

## Principio de Beta 1

Menos funciones, mas estabilidad.

La beta inicial debe validar que una persona pueda cuidar **una planta individual** de manera confiable:

1. entrar;
2. crear planta desde foto;
3. entender el plan;
4. ver calendario;
5. registrar cuidado;
6. hacer seguimiento simple;
7. recuperarse de errores comunes.

No busca validar todavia jardines completos, invitaciones, historias avanzadas, migracion de base de datos, pagos reales ni hardware.

## Alcance incluido

### B1-RF-01 - Autenticacion y perfil basico

Prioridad: P0

El usuario puede:

- entrar con Google;
- mantener sesion;
- ver perfil basico;
- cerrar sesion.

Criterio de aceptacion:

- un tester entra desde celular sin ayuda;
- si no esta autenticado, las rutas privadas lo llevan a `/login`;
- el perfil `users/{uid}` existe o se actualiza sin error.

### B1-RF-02 - Crear planta individual desde foto

Prioridad: P0

El usuario puede crear una planta con:

- foto desde camara o galeria;
- identificacion IA;
- ubicacion manual o geolocalizacion;
- clima real o fallback controlado;
- plan de cuidados;
- guardado en Firestore + Storage;
- ficha visible al terminar.

Criterio de aceptacion:

- el flujo completo foto -> ficha funciona en mobile;
- si Gemini falla al generar plan, aparece fallback conservador cuando corresponda;
- si una foto o permiso falla, el usuario puede reintentar sin perder todo el flujo.

### B1-RF-03 - Claridad del plan de cuidados

Prioridad: P0

La ficha debe mostrar de forma entendible:

- nombre comun/cientifico si existe;
- estado de salud;
- frecuencia de riego estimada;
- regla observable de humedad/sustrato si existe;
- luz recomendada;
- alertas climaticas relevantes;
- proxima accion recomendada.

Criterio de aceptacion:

- un tester no tecnico puede responder: "que tengo que hacer con esta planta hoy o esta semana".

### B1-RF-04 - Calendario accionable

Prioridad: P0

El calendario muestra tareas reales derivadas del plan:

- riego;
- seguimiento fotografico simple segun `seguimiento_foto_dias`;
- tareas atrasadas o proximas;
- accion para marcar riego como realizado.

Criterio de aceptacion:

- al registrar riego desde calendario, cambia `fecha_ultimo_riego` y aparece en historial;
- el calendario no muestra tareas falsas desconectadas de la planta.

### B1-RF-05 - Historial simple

Prioridad: P0

La ficha permite registrar y ver:

- riego;
- nota;
- foto de seguimiento simple.

Criterio de aceptacion:

- las acciones quedan en `historial_acciones`;
- el historial muestra fecha y descripcion;
- el flujo no depende de `observations` todavia.

### B1-RF-06 - Seguimiento por foto simple

Prioridad: P1

El usuario puede subir una foto de seguimiento y recibir:

- estado estimado;
- sintomas observados si existen;
- causas probables;
- preguntas de confirmacion;
- accion segura inmediata.

Criterio de aceptacion:

- el resultado se guarda;
- la ficha refleja estado/puntuacion actualizados cuando corresponde;
- si la IA no esta disponible, el error es legible y no rompe la ficha.

### B1-RF-07 - Manejo de errores y recuperacion

Prioridad: P0

La beta debe manejar:

- Gemini sin cuota o temporalmente no disponible;
- falla de geolocalizacion;
- falla de permisos Firestore/Storage;
- foto no seleccionada o compresion fallida;
- red lenta.

Criterio de aceptacion:

- el usuario recibe mensaje claro;
- puede reintentar o volver sin quedar atrapado;
- no se crean plantas corruptas con foto o datos incompletos sin control.

### B1-RF-08 - Testeo humano

Prioridad: P0

Cada tester debe poder entregar feedback minimo:

- que intento hacer;
- donde se trabo;
- si entendio la recomendacion;
- si volveria a usar la app para esa planta.

Criterio de aceptacion:

- existe una pauta simple de testeo;
- cada sesion beta deja evidencia en una nota o documento.

## Fuera de alcance Beta 1

Estos puntos se mantienen en `REQUISITOS.md` como vision, pero no bloquean Beta 1:

- jardines como entidad completa;
- invitacion de cuidadores;
- transferencia de planta o jardin;
- historias avanzadas con multiples fotos;
- flujo de fotos inteligente con verificacion imagen por imagen;
- catalogo completo de plagas/enfermedades;
- persistencia del catalogo dinamico;
- migracion a Supabase;
- migracion Firestore `(default)`;
- pagos reales;
- notificaciones push;
- PWA completa instalable si retrasa el flujo principal;
- hardware IoT;
- app nativa.

## Historias como evolucion

Decision:

- Las historias son la evolucion futura del seguimiento.
- Beta 1 mantiene seguimiento simple.
- A futuro, `historial_acciones` debe migrar hacia una estructura mas robusta tipo `observations`/`stories`.

Traduccion tecnica futura:

- `historial_acciones` actual = suficiente para Beta 1.
- `observations` = registros escalables de riego/foto/nota.
- `diagnoses` = hipotesis IA separadas de hechos confirmados.
- `stories` = experiencia de usuario sobre observations + fotos + resumen visual.

## Criterios de listo para Beta 1

La beta se considera lista cuando un usuario externo puede, sin ayuda tecnica:

1. entrar con Google desde celular;
2. crear una planta desde foto;
3. completar ubicacion/clima;
4. guardar planta;
5. entender el plan de cuidados;
6. ver calendario;
7. registrar riego o nota;
8. hacer seguimiento por foto simple;
9. recuperarse de errores comunes;
10. entregar feedback util.

## Verificacion tecnica antes de entregar

- `npm run check` pasa.
- Smoke test manual actualizado y recorrido.
- Prueba mobile en viewport 360-430 px.
- Prueba con al menos una planta nueva.
- Prueba de error controlado: Gemini plan falla o geolocalizacion falla.
- Revision de que no se haya prometido jardines/cuidadores como feature lista.
