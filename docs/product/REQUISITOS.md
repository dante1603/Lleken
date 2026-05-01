# Lleken — Documento de Requisitos Funcionales y No Funcionales

> Versión: 1.0  
> Fecha: 2026-05-01  
> Fase: Vision maestra + requisitos de evolucion  
> Estado: Activo

> Nota 2026-05-01: este documento conserva la vision amplia del producto. Para la primera beta cerrada enfocada en cuidado individual robusto, usar `REQUISITOS_BETA_1.md`. Jardines, historias avanzadas, flujo de fotos inteligente, migracion de datos, prediccion avanzada e IoT viven aqui como direccion futura, no como bloqueo de Beta 1.

---

## 1. Propósito y alcance

Este documento define los requisitos funcionales y no funcionales para llevar Lleken desde su estado actual de prototipo funcional (Checkpoint C4 completado) hasta una versión beta estable que pueda ser entregada a un grupo pequeño de testers.

El objetivo de esta fase no es tener todas las funcionalidades posibles, sino tener las funcionalidades clave **completas, estables y bien integradas**, de modo que los testers puedan usarla de forma real, generar datos de cuidado auténticos y entregar retroalimentación útil.

---

## 2. Estado de partida (qué ya existe)

Lo siguiente ya está implementado y funciona al cierre del Checkpoint C4:

- Login con Google (Firebase Auth).
- Flujo completo de nueva planta: foto → identificación IA → ubicación → clima → plan de cuidados → ficha.
- Fotos guardadas en Firebase Storage.
- Historial de acciones: riego, seguimiento, notas.
- Seguimiento por foto con análisis IA.
- Refresh de planta desde foto nueva.
- Calendario con tareas derivadas del plan, ajustadas por clima.
- Límite de plan gratuito (3 plantas propias).
- Tests unitarios para lógica de IA y dominio.
- Modelo de datos preparado para cuidadores (`caregiverIds`, `memberIds`), pero sin UI.

Todo lo que se describe en este documento **es adicional o una extensión de lo que ya existe**.

---

## 3. Requisitos Funcionales

Los requisitos están organizados por módulo. Cada uno tiene un identificador (`RF-XX`), una descripción, y notas sobre su relación con lo que ya existe.

---

### RF-01 — Gestión de plantas (extensión)

**Descripción:** El sistema ya permite registrar una planta desde foto con plan de cuidados automático. Esta sección describe las extensiones necesarias.

**RF-01.1** El usuario puede registrar una planta iniciando con una foto desde cámara o galería.

**RF-01.2** La IA identifica la especie, estado de salud y genera un plan de cuidados ajustado al clima de la ubicación indicada.

**RF-01.3** Al registrar una planta, el sistema solicita las variables de contexto que no pudo inferir desde la foto inicial (ver RF-04 — Flujo de fotos inteligente).

**RF-01.4** El usuario puede asignar una planta a un jardín al momento de crearla o en cualquier momento posterior.

**RF-01.5** El sistema muestra un indicador claro cuando el plan de cuidados se generó desde el catálogo estático versus desde IA en tiempo real, incluyendo el nivel de confianza.

**RF-01.6** El plan gratuito permite hasta 3 plantas propias. Las plantas recibidas como cuidador no consumen cupo.

---

### RF-02 — Jardines

**Descripción:** Un jardín es una agrupación de plantas que comparten una ubicación física y uno o más cuidadores. Es también la unidad principal de colaboración: cuando se invita a alguien a un jardín, obtiene acceso a todas sus plantas.

**RF-02.1** El usuario puede crear un jardín con: nombre, descripción opcional, ubicación (ciudad o coordenadas GPS).

**RF-02.2** El clima del jardín se obtiene automáticamente desde su ubicación y se comparte con todas las plantas que pertenecen a él.

**RF-02.3** Las plantas dentro de un jardín heredan la ubicación y el clima del jardín. Si una planta tiene ubicación propia, esta tiene prioridad.

**RF-02.4** El usuario puede agregar o quitar plantas de un jardín en cualquier momento.

**RF-02.5** El usuario puede ver todas las plantas de un jardín agrupadas en una vista específica del jardín.

**RF-02.6** Un jardín puede tener múltiples cuidadores. Al invitar a un cuidador al jardín, este obtiene acceso a todas las plantas del jardín (ver RF-03).

**RF-02.7** El dueño del jardín puede transferir la titularidad del jardín a otro usuario.

**RF-02.8** El sistema muestra el estado general del jardín: número de plantas, plantas que necesitan atención, próximas tareas del calendario agrupadas por jardín.

---

### RF-03 — Cuidadores y colaboración

**Descripción:** El sistema permite que un usuario comparta el cuidado de sus plantas o jardines con otras personas. El cuidador recibe todos los datos necesarios para hacerse cargo.

**RF-03.1** El dueño puede invitar a un cuidador a una planta específica o a un jardín completo, usando el email o el UID del usuario.

**RF-03.2** Al aceptar la invitación, el cuidador ve la planta o el jardín en su listado, con acceso al historial completo, el plan de cuidados y el calendario.

**RF-03.3** El cuidador puede registrar: riego, seguimiento por foto, notas y cualquier acción del historial.

**RF-03.4** El cuidador **no puede** eliminar la planta ni el jardín. Tampoco puede invitar a otros cuidadores (solo el dueño puede hacerlo).

**RF-03.5** El dueño puede transferir completamente el cuidado de una planta a otro usuario. Al transferir, el receptor se convierte en nuevo dueño y recibe todos los datos históricos, el plan de cuidados y las fotos.

**RF-03.6** Las plantas recibidas como cuidador no consumen el cupo del plan gratuito del cuidador.

**RF-03.7** Cuando se registra un cuidado (riego, seguimiento, etc.), el sistema registra qué usuario lo realizó, visible en el historial.

**RF-03.8** El dueño puede revocar el acceso de un cuidador en cualquier momento.

---

### RF-04 — Sistema de historias (checkpoints de planta)

**Descripción:** Una historia es un checkpoint del estado de la planta. A diferencia del seguimiento simple actual (que guarda una foto y genera un análisis puntual), las historias son registros más ricos que combinan múltiples fotos, comentarios del cuidador y metadatos generados automáticamente. Son la principal fuente de datos para el sistema predictivo.

**RF-04.1** El usuario puede crear una historia asociada a una planta, que incluye: una o varias fotos, un comentario o nota del cuidador, y la fecha del registro.

**RF-04.2** Al guardar una historia, el sistema genera automáticamente metadatos estructurados a partir de las fotos y el comentario: estado de salud estimado, síntomas detectados, variables de contexto inferidas (luz, sustrato, humedad visual), y recomendaciones.

**RF-04.3** Los metadatos de las historias se almacenan de forma estructurada y son accesibles para el sistema de predicción del backend.

**RF-04.4** Las historias funcionan como una línea de tiempo visual del estado de la planta. El usuario puede navegar por ellas de forma cronológica.

**RF-04.5** El sistema puede presentar las historias de formas dinámicas: carrusel de evolución visual, comparativa antes/después, resumen del período.

**RF-04.6** El calendario puede generar eventos automáticos de "crear historia de seguimiento" en intervalos definidos por el plan de cuidados (`seguimiento_foto_dias`).

**RF-04.7** El sistema puede usar historias de plantas del equipo como contenido de ejemplo y guía para nuevos usuarios, permitiéndoles ver cómo evoluciona una planta real a lo largo del tiempo.

---

### RF-05 — Flujo de fotos inteligente

**Descripción:** El flujo actual toma una foto general para identificar la planta. El nuevo flujo es más complejo: la IA analiza la foto inicial, determina qué información le falta para hacer un diagnóstico preciso, y solicita fotos específicas adicionales. Cada foto pedida pasa por un sistema de verificación antes de continuar.

**RF-05.1** Al iniciar el registro de una planta o una historia, el usuario toma una foto inicial general de la planta.

**RF-05.2** La IA analiza la foto inicial e identifica qué variables de contexto no puede inferir con seguridad. En base a esto, genera una lista de fotos adicionales que necesita.

**RF-05.3** Las fotos adicionales que el sistema puede solicitar incluyen, entre otras:
- Foto de las hojas (haz y envés).
- Foto del tallo.
- Foto de la tierra (superficie).
- Foto de la tierra removiendo la capa superficial.
- Foto de las flores o frutos (si aplica).
- Foto del macetero completo mostrando el fondo (drenaje).
- Foto de la fuente de luz (ventana, balcón, etc.).

**RF-05.4** Por cada foto solicitada, el sistema guía al usuario con instrucciones claras y un ejemplo visual de lo que se espera.

**RF-05.5** Al recibir cada foto adicional, la IA verifica si la imagen cumple con lo pedido (ángulo correcto, nitidez suficiente, objeto visible). Si cumple, continúa al siguiente paso. Si no cumple, le explica al usuario qué salió mal y le pide repetirla.

**RF-05.6** El usuario puede omitir una foto solicitada si no puede tomarla. En ese caso, el sistema lo registra como dato faltante y ajusta el nivel de confianza del plan.

**RF-05.7** Este flujo aplica tanto al registro inicial de una planta como al seguimiento por foto dentro del calendario.

**RF-05.8** El sistema registra todas las fotos tomadas en el proceso y las asocia a la historia o al registro de la planta.

---

### RF-06 — Calendario de cuidados (extensión)

**Descripción:** El calendario ya existe y muestra tareas derivadas del plan de cuidados. Esta sección describe las extensiones.

**RF-06.1** El calendario muestra tareas de riego ajustadas por clima.

**RF-06.2** El calendario genera eventos automáticos de "registrar seguimiento fotográfico" según `seguimiento_foto_dias` del plan.

**RF-06.3** Al abrir un evento de seguimiento desde el calendario, se inicia automáticamente el flujo de fotos inteligente (RF-05).

**RF-06.4** El usuario puede marcar tareas como realizadas directamente desde el calendario.

**RF-06.5** Las tareas completadas quedan registradas en el historial de la planta con la fecha real de realización.

**RF-06.6** El calendario puede agrupar tareas por jardín, permitiendo ver de un vistazo todo lo que hay que hacer en un espacio compartido.

---

### RF-07 — Sistema de conocimiento (base de datos estática ampliada)

**Descripción:** El sistema ya tiene un catálogo estático de plantas (`plantKnowledge.ts`). Para que el backend pueda hacer predicciones precisas, este catálogo necesita ampliarse significativamente e incorporar información sobre plagas y enfermedades.

**RF-07.1** La base de datos estática de plantas incluye, por especie: nombre científico, nombre(s) común(es), familia, plan de cuidados curado (frecuencia de riego, luz, sustrato, temperatura, humedad), señales de alerta comunes, toxicidad, y condiciones ideales.

**RF-07.2** La base de datos incluye un módulo de plagas: nombre de la plaga, descripción, plantas afectadas, síntomas visuales, condiciones que la favorecen, y pasos de tratamiento.

**RF-07.3** La base de datos incluye un módulo de enfermedades: nombre, tipo (fúngica, bacteriana, viral, nutricional), síntomas visuales, causas comunes, y pasos de tratamiento.

**RF-07.4** La base de datos incluye información sobre tipos de sustrato y tierra: composición, retención de humedad, plantas recomendadas, y señales de que el sustrato necesita cambio.

**RF-07.5** Cuando la IA detecta síntomas en una historia o seguimiento, consulta la base de datos estática para enriquecer el diagnóstico con información curada antes de generar una recomendación.

**RF-07.6** El catálogo dinámico (generado por IA para especies no cubiertas) persiste en la base de datos y se marca con su estado: `ai_generated`, `reviewed`, `rejected`, `merged`. Solo los registros `reviewed` se usan en producción como fuente de verdad.

---

### RF-08 — Autenticación y perfil

**RF-08.1** El usuario puede ingresar con su cuenta de Google.

**RF-08.2** El sistema crea un perfil de usuario con nombre, foto, email y plan (gratuito o pagado).

**RF-08.3** El usuario puede ver su perfil, estadísticas de cuidado y cerrar sesión.

---

## 4. Requisitos No Funcionales

---

### RNF-01 — Despliegue y distribución (Beta)

**RNF-01.1** La beta se distribuye como **Progressive Web App (PWA)**. Los testers acceden desde el navegador de su celular y pueden agregarla a su pantalla de inicio, sin necesidad de pasar por una app store.

**RNF-01.2** El hosting de la PWA usa **Firebase Hosting** en la fase beta, por su integración ya existente con el proyecto. Se evalúa migrar según costos en fases posteriores.

**RNF-01.3** La PWA debe funcionar como punto de partida para la versión de producción. Se mantiene la arquitectura web para facilitar iteraciones rápidas durante el testeo.

**RNF-01.4** El ciclo de despliegue en fase beta debe ser lo suficientemente ágil para publicar actualizaciones sin interrupciones significativas para los testers.

**RNF-01.5** En una fase posterior al testeo beta, se contempla portar la app a nativa (iOS/Android) usando la base de código existente.

---

### RNF-02 — Base de datos y almacenamiento

**RNF-02.1** La base de datos objetivo para producción es **Supabase (PostgreSQL)**. La migración desde Firestore debe planificarse antes de salir de la fase beta cerrada.

**RNF-02.2** El almacenamiento de imágenes debe migrarse a un servicio de menor costo que Firebase Storage. **Supabase Storage** es la opción preferida por integración con la base de datos. Se evalúan también Cloudflare R2 o Backblaze B2.

**RNF-02.3** La base de datos nombrada de Firestore (`ai-studio-e42563f0-...`) debe migrarse a una base `(default)` antes de producción, para habilitar Storage Rules con validación de membresía.

**RNF-02.4** El modelo de datos debe soportar múltiples usuarios por planta (dueño + cuidadores), jardines como entidad propia, e historias como registros independientes vinculados a plantas.

**RNF-02.5** Los datos históricos de cuidado y las historias de plantas deben almacenarse como registros independientes (no como array dentro del documento de planta), para soportar consultas y análisis a medida que el volumen crece.

---

### RNF-03 — Backend y API

**RNF-03.1** El servidor Express local (`server/index.ts`) debe migrar a un servicio desplegado antes de producción. Las opciones en orden de preferencia son: Cloud Functions (Firebase), Cloud Run, o un backend dedicado en Supabase Edge Functions.

**RNF-03.2** La clave de Gemini (`GEMINI_API_KEY`) **nunca** debe estar expuesta en el frontend ni en el bundle de producción. Siempre vive en el backend.

**RNF-03.3** Los endpoints de IA deben tener manejo de errores robusto: fallback a plan conservador local cuando Gemini no está disponible (429, 503), y mensajes de error legibles para el usuario.

**RNF-03.4** El backend debe separar los ambientes `dev` y `prod` con configuraciones y claves distintas.

---

### RNF-04 — Inteligencia artificial y predicción

**RNF-04.1** El motor de IA principal es **Google Gemini 2.5 Flash**. Todas las llamadas a IA pasan por el backend.

**RNF-04.2** Toda respuesta de Gemini pasa por funciones de normalización (`aiSchema.ts`) antes de llegar a la UI o a la base de datos. Las respuestas no normalizadas nunca se persisten.

**RNF-04.3** El catálogo estático de plantas es la fuente de verdad preferida. Cuando existe un match, se usa el plan curado sin llamar a Gemini.

**RNF-04.4** Los metadatos generados desde las historias (RF-04) deben almacenarse en un formato estructurado y estandarizado que permita alimentar algoritmos de predicción en el futuro, incluso si esos algoritmos no existen aún.

**RNF-04.5** El sistema de verificación de fotos (RF-05.5) debe dar retroalimentación en menos de 5 segundos para no interrumpir el flujo del usuario.

**RNF-04.6** El nivel de confianza del plan de cuidados debe ser visible para el usuario y estar vinculado a la cantidad y calidad de datos disponibles (especie identificada, variables de contexto capturadas, datos climáticos).

---

### RNF-05 — Rendimiento

**RNF-05.1** Las imágenes deben comprimirse en el cliente antes de enviarse al backend. El peso objetivo por imagen es menor a 1 MB.

**RNF-05.2** El tiempo de respuesta de la identificación de planta (foto → resultado) debe ser menor a 10 segundos en condiciones normales de red.

**RNF-05.3** La carga inicial de la PWA (first contentful paint) debe completarse en menos de 3 segundos en una conexión 4G estándar.

**RNF-05.4** El bundle de producción debe usar chunks separados para dependencias pesadas (Firebase, vendor, UI) para facilitar caché del navegador.

---

### RNF-06 — Seguridad y privacidad

**RNF-06.1** Todas las rutas excepto `/login` requieren autenticación. El acceso sin sesión redirige al login.

**RNF-06.2** Las reglas de base de datos deben garantizar que un usuario solo accede a plantas donde es `ownerId` o aparece en `caregiverIds`/`memberIds`.

**RNF-06.3** Las imágenes en Storage solo son accesibles a usuarios autenticados. En producción, la validación de membresía debe aplicarse también a nivel de Storage Rules.

**RNF-06.4** Los datos de cuidado usados para mejorar el sistema de predicción deben estar desvinculados de información personal del usuario. Solo se guardan datos de la planta (especie, condiciones, acciones), no quién las realizó.

**RNF-06.5** La app no comparte datos con terceros fuera de los servicios explícitamente declarados (Gemini, Firebase/Supabase, Open-Meteo).

---

### RNF-07 — Calidad y verificación

**RNF-07.1** Toda lógica de dominio crítica (normalización de IA, cálculo de frecuencia de riego, estado de salud) debe tener tests unitarios en Vitest.

**RNF-07.2** El comando `npm run check` (lint + build + tests) debe pasar antes de cada deploy a producción.

**RNF-07.3** Debe existir un smoke test manual documentado (`SMOKE_TEST.md`) que cubra los flujos críticos. Este checklist se recorre antes de cada entrega a testers.

**RNF-07.4** El sistema de verificación de fotos (RF-05.5) debe tener criterios claros y documentados para determinar si una foto cumple con lo solicitado.

**RNF-07.5** Los checkpoints de desarrollo deben tener criterios de aceptación verificables antes de considerarse cerrados.

---

### RNF-08 — Experiencia de usuario

**RNF-08.1** La app es **mobile-first**. Todos los flujos y pantallas deben estar diseñados y probados en viewport móvil (360px–430px de ancho).

**RNF-08.2** El idioma de la UI es **español**.

**RNF-08.3** Los errores comunes (Gemini no disponible, sin conexión, foto rechazada) deben tener mensajes claros y permitir al usuario continuar o reintentar sin perder el progreso.

**RNF-08.4** Los flujos de múltiples pasos (nueva planta, flujo de fotos) deben mostrar progreso visual claro para que el usuario sepa en qué paso está y cuántos faltan.

**RNF-08.5** El flujo de fotos inteligente (RF-05) debe guiar al usuario con instrucciones simples, sin asumir conocimientos técnicos de fotografía o botánica.

---

### RNF-09 — Escalabilidad

**RNF-09.1** El modelo de datos debe soportar, sin cambios estructurales, el crecimiento de un usuario con pocas plantas a jardines comunitarios con múltiples usuarios y decenas de plantas.

**RNF-09.2** El sistema de historias debe poder almacenar cientos de registros por planta sin degradar el rendimiento de la consulta de la ficha.

**RNF-09.3** La arquitectura del backend debe permitir escalar horizontalmente los endpoints de IA de forma independiente al resto de la API.

---

## 5. Flujos fuera de alcance (esta fase)

Los siguientes elementos están identificados como futuros pero **no forman parte del alcance de la beta**:

- Notificaciones push / recordatorios automáticos (se evalúa para la siguiente fase).
- Modo oscuro.
- Exportar historial como PDF.
- Hardware IoT (sensores de humedad/temperatura).
- Algoritmos de predicción en producción (los datos se preparan ahora, los algoritmos se implementan después).
- App nativa en App Store / Play Store.
- Panel de administración para curación del catálogo dinámico.
- Upgrade de plan de pago con pago real (solo se bloquea el límite; la UI de upgrade es informativa).

---

## 6. Criterios de aceptación de la beta

La beta se considera lista para el primer grupo de testers cuando un usuario externo puede, sin ayuda:

1. Entrar a la app con su cuenta Google desde el celular.
2. Registrar una planta desde foto y completar el flujo de fotos inteligente.
3. Entender qué identificó la app y qué tan segura es la recomendación.
4. Ver el plan de cuidados y el calendario de su planta.
5. Registrar un cuidado simple (riego, nota).
6. Crear una historia con seguimiento fotográfico.
7. Crear un jardín y agregar su planta.
8. Invitar a un cuidador a su planta o jardín.
9. Recuperarse de errores comunes (foto no aceptada, Gemini caído) sin quedar bloqueado.

---

*Documento generado el 2026-05-01. Actualizar al cerrar cada checkpoint que modifique el alcance.*
