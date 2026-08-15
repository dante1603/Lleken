# Aportes Product Design y backlog UX por cortes

Fecha: 2026-06-03

Origen: auditoria estrategica de producto sobre la documentacion vigente y las pantallas actuales de Lleken.

## Lectura corta

Lleken ya tiene una base funcional creible: Supabase operativo, Auth, Storage privado, flujo de nueva planta, calendario, historial, seguimiento por foto y una Home que empieza a priorizar tareas. El siguiente valor no esta en abrir muchas funciones nuevas, sino en hacer que la app responda muy bien una pregunta diaria:

> Que planta necesita accion hoy, que accion debo tomar y por que debo confiar en esa recomendacion?

Este documento convierte los aportes de Product Design en cortes delegables para varias sesiones. No reemplaza `BETA_UX_AND_TESTING_PLAN.md`; lo baja a tareas mas manejables.

## Principios de trabajo

- Cerrar primero el uso individual antes de abrir jardines, cuidadores o IoT.
- Usar datos ya disponibles antes de pedir nuevas tablas o nuevas llamadas de IA.
- Mantener Home como centro de accion solo si demuestra utilidad real.
- Mostrar confianza: fuente del dato, fecha, clima usado, ultima accion y razon de cada recomendacion.
- Preferir cortes pequenos con verificacion humana en navegador.
- No hacer redisenos amplios de marca mientras la beta aun necesita validar flujo.

## Orden recomendado

1. Validar continuidad visual entre Home, Mis plantas, Calendario y Ficha.
2. Cerrar Home util con acciones de hoy y plantas prioritarias.
3. Agregar feedback beta real para aprender de testers.
4. Mejorar confianza en recomendaciones IA/clima.
5. Redisenar entrada de nueva planta para aceptar mas de un camino.
6. Abrir jardines v1 solo despues de probar el flujo individual.
7. Hacer QA visual/accesibilidad sobre pantallas mobile.
8. Ejecutar prueba beta corta con usuarios reales.

## Cortes delegables

### PD-1. Auditoria visual mobile con capturas

- **Objetivo:** capturar el flujo real en navegador y detectar fricciones visuales, de navegacion y accesibilidad.
- **Pantallas:** Login, Home, Mis plantas, Calendario, Ficha, Nueva planta, Seguimiento.
- **Fuera de alcance:** implementar cambios, redisenar marca, tocar base de datos.
- **Entregable:** carpeta local con screenshots numerados y notas por paso.
- **Criterio de aceptacion:** cada hallazgo apunta a una pantalla concreta y propone un ajuste pequeno o una decision pendiente.
- **Verificacion:** app corriendo en localhost; revision mobile o viewport pequeno.

### PD-2. Home util como centro de accion

- **Objetivo:** que una persona entienda que debe hacer hoy sin entrar primero a Mis plantas.
- **Base existente:** `src/pages/Home.tsx` ya deriva tareas, plantas prioritarias y carga semanal desde `PlantDataContext`.
- **Alcance:** prioridad del dia, semana de cuidados, acciones rapidas, plantas prioritarias y actividad reciente.
- **Fuera de alcance:** feedback persistido, jardines, sharing, nueva IA, cambio de schema.
- **Criterio de aceptacion:** Home muestra una accion prioritaria concreta, su razon y el boton correcto.
- **Verificacion:** `npm run check`; prueba manual Home -> Calendario -> Ficha -> volver.

### PD-3. Feedback beta minimo

- **Objetivo:** permitir que testers reporten bug, confusion o mejora desde la app.
- **Alcance MVP:** boton visible, formulario simple y persistencia en Supabase.
- **Campos sugeridos:** tipo, severidad, ruta, planta opcional, descripcion, metadata de navegador, estado.
- **Fuera de alcance:** panel admin completo, notificaciones, asignacion automatica.
- **Criterio de aceptacion:** un tester puede enviar un reporte y el equipo puede leerlo en Supabase.
- **Verificacion:** `npm run check`; prueba manual desde Home o Perfil.

### PD-4. Confianza en IA y clima

- **Objetivo:** explicar por que la app recomienda una accion de cuidado.
- **Alcance:** mostrar fecha de ultima actualizacion, clima usado, ultima accion registrada y razon corta.
- **Fuera de alcance:** reentrenar IA, cambiar proveedor, persistir toda la capa `ai_analyses`.
- **Criterio de aceptacion:** en Ficha y Home se entiende si la recomendacion viene de riego, estado, clima, seguimiento o plan.
- **Verificacion:** prueba manual con planta estable, planta con riego pendiente y planta en riesgo.

### PD-5. Nueva planta v2 como entrada flexible

- **Objetivo:** dejar de forzar siempre el camino foto primero.
- **Entradas beta:** identificar con foto, agregar manual, reportar problema, continuar seguimiento.
- **Fuera de alcance:** jardines, borradores complejos, multiusuario.
- **Criterio de aceptacion:** la pantalla inicial de nueva planta permite elegir el tipo de tarea sin romper el flujo IA actual.
- **Verificacion:** `npm run check`; prueba manual de flujo foto IA existente.

### PD-6. Jardines v1 chico

- **Objetivo:** probar colaboracion sin convertirla en una plataforma completa.
- **Alcance:** crear jardin, listar plantas del jardin, invitar cuidador, rol observador/cuidador.
- **Prerequisito:** PD-1, PD-2 y PD-3 cerrados o validados.
- **Fuera de alcance:** calendario avanzado por jardin, asignacion compleja de tareas, metricas B2B/B2G.
- **Criterio de aceptacion:** Usuario A crea jardin, B cuida, C observa y D no puede verlo.
- **Verificacion:** prueba manual con usuarios reales o cuentas de prueba.

### PD-7. QA visual y accesibilidad mobile

- **Objetivo:** limpiar inconsistencias visibles antes de beta.
- **Alcance:** tamanos de botones, estados vacios, loading, errores, contraste, foco, textos largos y mojibake visible.
- **Fuera de alcance:** redisenar todo el sistema visual.
- **Criterio de aceptacion:** pantallas principales no tienen texto cortado, botones ambiguos ni estados vacios pobres.
- **Verificacion:** screenshots mobile y recorrido con teclado cuando aplique.

### PD-8. Prueba beta guiada

- **Objetivo:** aprender si la app se entiende sin explicacion externa.
- **Participantes:** 3 a 5 usuarios o testers cercanos.
- **Tareas:** crear planta, entender Home, registrar cuidado, revisar ficha, enviar feedback.
- **Fuera de alcance:** encuesta larga o investigacion academica pesada.
- **Criterio de aceptacion:** lista de fricciones priorizadas por frecuencia y severidad.
- **Verificacion:** notas de prueba y backlog actualizado.

## No hacer todavia

- No abrir IoT antes de validar cuidado diario.
- No abrir pagos antes de entender retencion beta.
- No convertir jardines en feature grande antes de probar permisos simples.
- No agregar nuevas llamadas IA si el insight puede salir de datos existentes.
- No redisenar toda la marca para corregir problemas de flujo.

## Proximo corte sugerido

Tomar primero `PD-1` o cerrar la tarea activa UX-1. Si UX-1 se valida bien, avanzar a `PD-2`. Si UX-1 falla, corregir continuidad visual antes de sumar feedback o jardines.
