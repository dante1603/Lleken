# Equipo Lleken

Fecha de actualizacion: 2026-05-01

Este documento define roles, responsabilidades y forma de trabajo del equipo segun la postulacion Innova Sostenible 2026 y el plan de negocios entregado como fuente.

## Integrantes y roles

### Dante - Project Manager / Product Owner / Creador

Responsabilidades:

- Liderar vision de producto, narrativa, pitch y prioridades.
- Traducir la realidad del huerto PAC en requerimientos concretos.
- Tomar decisiones finales de producto, UX y marca.
- Mantener coherencia entre app, postulacion, negocio y roadmap tecnico.
- Validar que cada sprint termine en algo visible, usable o decidible.

Contexto:

- Tiene conexion directa con el territorio donde nace la idea: el huerto comunitario de Pedro Aguirre Cerda.
- Construyo el prototipo actual completo hasta C4: foto, identificacion IA, plan de cuidados, calendario y seguimiento.
- Combina diseno, animacion e IA aplicada para visualizar productos completos y comunicarlos con claridad.

### Matyas - Backend / Despliegue / Infraestructura

Responsabilidades:

- Backend Express y futura migracion a Cloud Functions o Cloud Run.
- Firebase, Firestore, Storage, reglas y seguridad.
- Endpoints de IA.
- Despliegue y estabilidad del sistema.
- Performance, pruebas tecnicas y deuda critica.
- Convertir el prototipo local en un producto desplegable.

Nota:

- Mantener Firebase como base actual mientras se estabiliza el prototipo; cualquier migracion mayor debe tratarse como decision tecnica separada y justificada.

### Aikia - Marketing / UX-UI / Desarrollo web

Responsabilidades:

- Comunicacion de marca.
- Landing page y presencia publica.
- Redes sociales.
- Investigacion de usuarios.
- Textos de interfaz y piezas de validacion.
- Diseno visual de pantallas.
- Propuesta comercial y apoyo al modelo de negocio.

Contexto:

- Traduce la propuesta de valor de Lleken a mensajes y pantallas que usuarios, mentores y posibles aliados puedan entender antes de probar el producto.
- Puede construir e iterar prototipos web con autonomia creciente usando herramientas de IA.
- Estado actual 2026-05-01: esta trabajando en la landing page de Lleken, el primer logo oficial y apoyo visual/comunicacional para el diagrama de casos de uso.

### Nicolas - UX-UI / Desarrollador de apoyo / QA

Responsabilidades:

- Apoyar diseno de componentes.
- Maquetar pantallas.
- Revisar consistencia visual.
- Ejecutar QA manual del flujo principal.
- Detectar fricciones de uso en mobile.
- Documentar flujos y apoyar bugs pequenos.

Contexto:

- Cursa primer ano y esta aprendiendo a programar con herramientas de IA.
- Su rol actual prioriza energia, disponibilidad, aprendizaje rapido y capacidad de absorber feedback.
- Es un buen puente inicial entre diseno, frontend y pruebas manuales.

## Forma de trabajo

Todos los integrantes trabajan con desarrollo asistido por IA en distintos niveles. Eso permite iterar rapido, pero no reemplaza revision, criterios de terminado ni pruebas.

Para usar IA sin perderse en la documentacion, cada integrante puede iniciar su chat con el protocolo de `AI_MEMBER_ONBOARDING.md`. La fuente semanal de tareas es `WEEKLY_TASKS.md`, que separa tareas asignadas de tareas disponibles para tomar. La guia estatica del sistema vive en `TASK_SYSTEM.md`.

Reglas base:

- Un sprint tiene maximo un objetivo principal.
- Toda tarea tiene responsable unico.
- Las ideas nuevas van al backlog, no interrumpen el sprint.
- Cada feature debe tener criterio de terminado.
- Cada decision importante queda escrita en el repo.
- Lo visual y lo tecnico se revisan juntos.
- Dante decide prioridad final, pero el equipo puede cuestionar alcance y riesgos.

## Prioridad actual del equipo

Durante mayo de 2026, despues de enviar la postulacion al concurso, la prioridad del equipo es:

1. Convertir el prototipo actual en una beta pequena testeable.
2. Documentar con diagramas el estado actual antes de escalar.
3. Preparar validacion con el huerto PAC y un grupo reducido de testers.
4. Evitar prometer features futuras como si ya estuvieran listas.
5. Mantener Drive como lectura/organizacion externa y el repo como verdad tecnica.

## Backlog inicial sugerido

### Sprint documental D1 - Diagramas del estado actual

Objetivo: explicar el sistema completo antes de escalarlo.

Responsables sugeridos:

- Dante: validar narrativa, alcance y prioridad.
- Matyas: validar arquitectura, backend y datos.
- Aikia: validar claridad visual/comercial.
- Nicolas: validar navegacion, consistencia UI y fricciones de uso.

### Sprint beta - Flujo individual estable

Objetivo: que un tester externo pueda crear una planta, ver calendario y hacer seguimiento sin quedar bloqueado.

### Sprint C5 - Cuidadores basicos

Objetivo: permitir que dos cuentas Google cuiden una misma planta.

Nota: C5 es importante, pero no debe desplazar la estabilidad del prototipo beta si el flujo individual todavia tiene fricciones.
