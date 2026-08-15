# Roadmap de refundacion del producto

Fecha: 2026-07-10.
Documento guia: `PRODUCT_VISION_COLLABORATIVE_CARE.md`.

## Objetivo

Reorientar la aplicacion existente desde el cuidado individual centrado en IA hacia la coordinacion de personas que cuidan conjuntos amplios de plantas, reutilizando solo las piezas heredadas que apoyen esa direccion.

## Regla de ejecucion

Cada fase debe producir una capacidad demostrable. No se inicia una reconstruccion total ni una migracion masiva antes de validar el flujo de colaboracion mas pequeno.

## Fase 0 - recuperar un ciclo de desarrollo rapido

Resultado esperado: cualquier integrante autorizado puede iniciar la app, autenticarse y recorrerla en `http://localhost:3000` sin ser enviado al dominio productivo.

- registrar `http://localhost:3000/home` en las Redirect URLs de Supabase Auth;
- mantener el Site URL productivo para produccion;
- corregir la discrepancia `APP_URL` 3001/3000 o eliminar la variable si se confirma que no tiene consumidores;
- documentar prueba local y prueba productiva;
- definir datos de prueba separados o una politica explicita para no contaminar datos reales.

Esta fase es bloqueante para iterar con seguridad.

## Fase 1 - diseñar el dominio colaborativo minimo

Resultado esperado: especificacion acordada de espacio, sector/grupo, miembro, tarea, incidencia y evento de cuidado.

- contrastar el modelo deseado con `gardens`, `garden_members`, `plants`, `plant_members` y `plant_events` ya existentes;
- decidir que tablas se conservan, renombran conceptualmente, extienden o dejan como compatibilidad;
- definir permisos por rol;
- diseñar tareas asignables y acciones masivas;
- crear el ER propuesto antes de migraciones.

## Fase 2 - prototipo navegable del trabajo diario

Resultado esperado: flujo mobile-first validable sin depender de IA.

Pantallas minimas:

1. Mis espacios.
2. Panel de un espacio.
3. Tareas del equipo.
4. Sectores o grupos.
5. Actividad e incidencias.
6. Miembros y roles basicos.

El prototipo debe probar primero jerarquia, lenguaje y velocidad de registro. Puede usar datos locales controlados antes de cerrar el schema.

## Fase 3 - vertical colaborativa persistente

Resultado esperado: dos o mas usuarios coordinan trabajo real en un espacio compartido.

- crear/abrir espacio;
- gestionar membresia basica;
- crear, tomar/asignar y completar tarea;
- registrar evento con autoria;
- mostrar cambios al resto del equipo;
- validar RLS para coordinador, cuidador y observador.

## Fase 4 - escala de conjuntos

Resultado esperado: operar decenas o cientos de plantas sin recorrer fichas una por una.

- sectores y agrupaciones;
- filtros y acciones masivas;
- prioridades e incidencias agregadas;
- plantillas de tareas recurrentes;
- vistas de carga y cobertura del espacio.

## Fase 5 - inteligencia asistiva

Resultado esperado: automatizacion que reduce trabajo sin convertirse en el producto.

- resumen de actividad;
- sugerencias explicables de prioridad;
- clasificacion de incidencias;
- identificacion por foto bajo demanda;
- propuestas de tareas confirmadas por personas.

Cada funcion debe demostrar mejora respecto del flujo manual y contar con salida segura cuando falle.

## Piezas heredadas con potencial de reutilizacion

- Supabase Auth, Postgres, Storage y RLS.
- Tablas `gardens` y `garden_members` como punto de partida, no como diseño final confirmado.
- `plants.garden_id`, `plant_members` y `plant_events`.
- Registro de fotos y eventos.
- Contexto compartido y patrones de carga del frontend.
- Identificacion, clima y conocimiento botanico como servicios secundarios.

## Piezas que no deben dirigir la nueva arquitectura

- el flujo obligatorio foto -> identificacion -> ubicacion -> perfil;
- Home construida exclusivamente desde tareas derivadas de plantas individuales;
- calendario generado solo desde atributos de cada planta;
- IA como propuesta de valor principal;
- documentos Beta 1 de cuidado individual como backlog activo.

## Decisiones que requieren validacion de producto

- termino visible: espacio, jardin, huerto, proyecto u organizacion;
- si los sectores contienen plantas individualizadas, conteos por especie o ambos;
- si una tarea pertenece a espacio, sector, grupo, planta o combinaciones;
- diferencia entre coordinador y propietario tecnico;
- tratamiento de voluntarios ocasionales;
- evidencia minima para completar tareas masivas;
- modo de operacion con conectividad deficiente.

