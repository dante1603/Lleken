# Vision de producto - cuidado colaborativo a escala

Fecha: 2026-07-10.
Estado: direccion canonica para la nueva etapa de Lleken.

## Definicion breve

Lleken es una herramienta para coordinar grupos de personas que cuidan conjuntos amplios de plantas en espacios compartidos.

El nucleo no es identificar una planta individual ni conversar con una IA. El nucleo es que un equipo pueda saber:

- que espacios y conjuntos de plantas tiene a cargo;
- que necesita atencion;
- quien puede o debe actuar;
- que acciones ya se realizaron;
- que problemas siguen abiertos;
- como evoluciona el cuidado colectivo en el tiempo.

La IA es una tecnologia de apoyo. Puede ayudar a identificar, resumir, priorizar o detectar riesgos, pero no define la navegacion ni reemplaza el registro verificable de personas, tareas y cuidados.

## Problema principal

Cuando muchas personas cuidan muchas plantas, la dificultad deja de ser recordar la ficha de una planta. El problema pasa a ser coordinacion:

- el trabajo se reparte informalmente y queda sin responsable;
- distintas personas repiten una tarea o suponen que otra ya la hizo;
- los problemas se descubren tarde;
- la evidencia queda dispersa en mensajes, fotos o memoria personal;
- no existe una vista comun del estado del espacio;
- administrar planta por planta no escala.

## Unidad principal del producto

La unidad principal es el **espacio de cuidado**: un huerto, jardin, vivero, area verde, sede, patio, invernadero u otro conjunto administrable.

Dentro de un espacio existen:

- sectores o grupos de plantas;
- miembros y roles;
- tareas y responsabilidades;
- eventos de cuidado y evidencia;
- incidencias o alertas;
- plantas individuales cuando el detalle sea necesario.

Una planta sigue siendo una entidad util, pero deja de ser el punto de entrada obligatorio para toda accion.

## Usuarios y roles iniciales

- **Coordinador:** configura el espacio, incorpora miembros, define prioridades y revisa el avance.
- **Cuidador:** consulta y ejecuta tareas, registra acciones y reporta problemas.
- **Observador:** consulta el estado y la actividad sin modificar el cuidado.

Los nombres y permisos definitivos se validaran con usuarios. La primera version debe mantener un modelo simple y auditable.

## Flujo central propuesto

1. Una persona entra a uno de sus espacios de cuidado.
2. Ve el estado operativo: pendientes, atrasos, incidencias y actividad reciente.
3. Filtra por sector, grupo, prioridad o responsable.
4. Toma o recibe una tarea.
5. Registra el cuidado con una accion breve y evidencia opcional.
6. El equipo ve inmediatamente lo realizado y lo que sigue pendiente.
7. Si existe incertidumbre, solicita apoyo humano o tecnologico, incluida IA.

## Capacidades esenciales

### 1. Espacios y sectores

- crear y describir espacios;
- dividirlos en sectores o grupos manejables;
- asociar plantas de forma individual o masiva;
- consultar estado agregado sin abrir cada ficha.

### 2. Personas y permisos

- incorporar miembros;
- asignar roles simples;
- saber quien puede ver, coordinar o registrar cuidados;
- conservar autoria y fecha de cada accion.

### 3. Trabajo de cuidado

- crear tareas puntuales o recurrentes;
- asignarlas a una persona o dejarlas disponibles al equipo;
- priorizar, completar, reabrir y comentar;
- registrar acciones masivas cuando se atiende un sector completo.

### 4. Estado e incidencias

- reportar problemas por espacio, sector, grupo o planta;
- adjuntar fotos y observaciones;
- distinguir pendiente, en atencion y resuelto;
- mostrar riesgos y atrasos en una vista operativa.

### 5. Historial y aprendizaje

- mantener una bitacora comun;
- entender carga de trabajo y continuidad;
- detectar patrones sin convertir metricas en vigilancia individual;
- reutilizar experiencias exitosas del propio espacio.

## Papel de la IA

La IA puede:

- resumir actividad extensa;
- sugerir prioridades con razones visibles;
- agrupar reportes parecidos;
- ayudar a identificar una especie o problema desde una foto;
- proponer una tarea que una persona debe confirmar;
- transformar notas libres en registros estructurados.

La IA no debe:

- ser requisito para crear un espacio, una tarea o un registro;
- ocultar quien decidio o ejecuto una accion;
- marcar cuidados como realizados sin confirmacion humana;
- presentar diagnosticos inciertos como hechos;
- obligar al usuario a recorrer un flujo de foto para operar.

## Principios de producto

1. **El conjunto antes que la ficha.** La vista agregada debe resolver la mayoria de las decisiones diarias.
2. **Coordinacion antes que recomendacion.** Primero debe quedar claro que ocurre, quien actua y que falta.
3. **Registro rapido en terreno.** Las acciones frecuentes deben requerir pocos pasos y funcionar bien en movil.
4. **Detalle progresivo.** Espacio -> sector -> grupo -> planta, solo cuando haga falta profundizar.
5. **Responsabilidad visible.** Toda accion importante tiene estado, fecha y autoria.
6. **IA explicable y opcional.** Toda sugerencia automatica muestra su razon y puede ser ignorada o corregida.
7. **Desarrollo local primero.** El equipo debe poder probar en localhost sin contaminar produccion ni depender del dominio real.

## Alcance de la primera validacion

La primera version validable debe permitir:

- iniciar sesion en local y produccion;
- crear o abrir un espacio;
- ver miembros y roles;
- organizar al menos un sector o grupo;
- ver una bandeja comun de tareas;
- tomar/asignar y completar una tarea;
- registrar una accion de cuidado con autoria;
- reportar una incidencia;
- consultar actividad reciente del equipo.

No necesita inicialmente:

- automatizacion IoT;
- pagos;
- gamificacion;
- analitica institucional avanzada;
- un asistente conversacional central;
- diagnostico autonomo;
- modelar cada planta del espacio con el mismo nivel de detalle.

## Criterio de exito

Lleken aporta valor cuando un grupo puede coordinar una jornada o semana de cuidado con menos mensajes externos, menos trabajo duplicado y mayor claridad sobre lo pendiente, aunque no utilice ninguna funcion de IA.

