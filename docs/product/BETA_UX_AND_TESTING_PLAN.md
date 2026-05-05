# Plan UX beta, jardines y feedback de testers

Fecha: 2026-05-05

Este documento anota decisiones y prioridades antes de ejecutar cambios grandes en el front. El objetivo es ordenar la siguiente etapa de Lleken: que la app se sienta mas util, menos rigida y preparada para testear jardines/grupos con usuarios reales.

## Diagnostico de producto

La app ya permite crear plantas y tiene Supabase corriendo con usuarios reales. El siguiente bloqueo no es solo tecnico: el front se esta sintiendo anticuado y algunas pantallas no responden al uso real.

Señales observadas:

- El flujo "crear planta" se siente rigido.
- Home aporta poco valor; al usar la app, el usuario tiende a ir directo a "Mis plantas".
- Cambiar de pantalla produce popping/recargas molestas.
- Ya existen 4 usuarios registrados, suficiente para probar grupos, compartir plantas y permisos.
- Falta un canal simple para que testers reporten bugs y mejoras desde la app.

## Principio guia

Lleken no deberia abrir como una app estatica de cards, sino como una herramienta diaria de cuidado.

La primera pantalla deberia responder:

- que necesita atencion hoy;
- que planta o jardin esta en riesgo;
- que cambio reciente importa;
- que accion rapida puedo tomar;
- que feedback/test debo reportar si algo falla.

## Rediseño de Home

Problema actual: Home no se percibe como la pantalla mas util.

Hipotesis: Home debe cambiar de "resumen decorativo" a "centro de accion".

### Home v2 utilitario

Despues de la primera pasada de UX-2, se decidio hacer una segunda iteracion antes de UX-3. La base visual se mantiene porque ya se siente limpia y amable, pero Home todavia debe tomar mejores decisiones por el usuario.

Objetivo de la iteracion:

- reducir cards estadisticas grandes;
- mostrar un resumen superior compacto;
- destacar una accion prioritaria;
- mostrar carga semanal con una visualizacion pequena;
- mover acciones rapidas a carrusel horizontal;
- mostrar 2 o 3 plantas prioritarias, no solo una;
- dejar actividad reciente mas resumida;
- usar datos existentes, sin nueva llamada de IA ni cambios de base de datos.

Estructura elegida:

1. Saludo + resumen inteligente: "1 accion para hoy - 3 plantas estables".
2. Accion prioritaria: planta concreta, razon y boton directo.
3. Semana de cuidados: mini timeline de 7 dias con carga por dia.
4. Acciones rapidas horizontales: agregar planta, registrar cuidado, seguimiento con foto, feedback.
5. Plantas prioritarias: carrusel/lista compacta de plantas con siguiente accion.
6. Actividad reciente: maximo 2 eventos o fallback a plantas creadas.

No hacer en esta iteracion:

- no redisenar toda la app;
- no convertir Home en dashboard pesado;
- no agregar IA real nueva si se puede derivar el insight desde riego, estado, seguimiento, clima guardado y plan;
- no implementar feedback persistente hasta UX-4.

### Home beta propuesta

Prioridades:

1. **Hoy necesita atencion**
   - riego vencido;
   - foto de seguimiento pendiente;
   - planta en riesgo;
   - diagnostico pendiente de confirmar;
   - recomendacion urgente.

2. **Acciones rapidas**
   - agregar planta;
   - registrar riego;
   - reportar problema en una planta;
   - tomar foto de seguimiento;
   - crear/abrir jardin.

3. **Mis espacios**
   - plantas individuales;
   - jardines compartidos;
   - plantas compartidas conmigo.

4. **Actividad reciente**
   - ultima planta creada;
   - ultimo riego;
   - diagnostico reciente;
   - comentario o reporte de tester si aplica.

5. **Feedback visible para beta**
   - boton fijo o accesible: "Reportar bug/mejora".

### Decision pendiente

Evaluar si la pestaña principal debe ser:

- `Home` como centro de accion;
- o `Mis plantas` como primera pantalla, con Home absorbido por una barra superior de tareas.

La evidencia actual favorece que "Mis plantas" sea muy importante, pero no necesariamente que Home desaparezca. Home debe ganarse su lugar mostrando tareas y alertas reales.

## Crear planta v2 en UX

Problema actual: el flujo asume un camino casi unico.

La nueva creacion debe aceptar entradas distintas:

- foto de planta;
- nombre manual;
- problema o sintoma;
- plaga sospechada;
- planta ubicada en jardin;
- borrador incompleto;
- seguimiento que termina creando una planta nueva;
- planta compartida o asignada a otra persona.

### Propuesta de entrada

En vez de un unico boton "Nueva planta", mostrar una entrada tipo:

```text
Que quieres hacer?

- Identificar una planta con foto
- Agregar planta manualmente
- Reportar problema en una planta
- Crear planta dentro de un jardin
- Continuar borrador
```

Para beta, no hace falta implementar todos a la vez. Lo importante es que el diseño del flujo ya acepte variaciones.

### Primer paso recomendado

Rediseñar la pantalla inicial de creacion para que no fuerce siempre "foto primero".

Orden beta:

1. Foto con IA.
2. Manual simple.
3. Problema/sintoma.
4. Jardin compartido.
5. Borrador.

## Jardines y grupos

La base ya tiene estructura para probar jardines y membresias. Con 4 usuarios registrados, ya hay masa minima para testear:

- dueño de jardin;
- cuidador;
- observador;
- planta compartida.

### Jardin v1

Un jardin no tiene que partir como una gran feature. Puede partir como:

- nombre del jardin;
- descripcion corta;
- miembros;
- lista de plantas;
- rol de cada usuario;
- acciones basicas por rol.

### Casos de prueba con 4 usuarios

1. Usuario A crea jardin.
2. Usuario A agrega una planta al jardin.
3. Usuario A invita usuario B como cuidador.
4. Usuario B ve el jardin y registra riego.
5. Usuario C entra como observador y solo puede mirar.
6. Usuario D no pertenece al jardin y no puede verlo.

### Decisiones UX pendientes

- Si una planta puede vivir fuera de jardin y luego moverse a jardin.
- Si compartir planta individual sigue existiendo junto a compartir jardin.
- Si el calendario muestra tareas por planta, por jardin o ambos.
- Si el owner puede asignar tareas a cuidadores.

## Compartir plantas

Compartir planta individual sigue siendo util aunque existan jardines.

Uso esperado:

- "Cuida mi planta mientras viajo".
- "Comparte esta planta con alguien de la casa".
- "Pide ayuda a un tester/experto".

Uso de jardin:

- "Este conjunto de plantas pertenece a un espacio comun".
- "Varias personas cuidan el mismo lugar".
- "Queremos ver actividad e impacto del grupo".

No conviene reemplazar uno por el otro. Deben convivir:

- planta individual compartida;
- jardin con muchas plantas.

## Feedback de testers

Debe existir una herramienta interna simple para reportar bugs y mejoras desde la app.

### Boton beta

Agregar un boton visible:

```text
Reportar bug/mejora
```

Puede estar en:

- perfil;
- home;
- menu flotante pequeño;
- pantalla de error;
- despues de crear planta.

### Datos minimos del reporte

Formulario:

- tipo: bug, mejora, confusion, dato incorrecto, otro;
- descripcion;
- pantalla actual;
- planta relacionada opcional;
- severidad: baja, media, alta;
- permiso para contactar al tester;
- metadata automatica: usuario, fecha, ruta, navegador si es posible.

### Donde guardar

Opcion recomendada para beta:

- tabla Supabase `tester_feedback`.

Campos sugeridos:

```sql
tester_feedback (
  id uuid primary key,
  user_id uuid,
  type text,
  severity text,
  route text,
  plant_id uuid,
  garden_id uuid,
  description text,
  browser_context jsonb,
  status text,
  created_at timestamptz
)
```

Estados:

- new;
- triaged;
- planned;
- fixed;
- closed.

### Notificacion al equipo

Primera version:

- guardar en Supabase;
- crear una vista/admin simple o consulta;
- revisar semanalmente.

Despues:

- email;
- Slack/Discord;
- Google Sheet exportable;
- dashboard interno.

## Popping y rendimiento percibido

El popping al cambiar de pantalla afecta directamente la sensacion de calidad.

Plan:

1. Crear cache compartida de plantas y jardines.
2. Mostrar datos cacheados de inmediato.
3. Refrescar en segundo plano.
4. Evitar loaders de pantalla completa si ya hay datos.
5. Prefetch de rutas frecuentes: plantas, calendario, perfil, crear planta.
6. Mantener borradores de creacion fuera de `location.state` solamente.

Este frente debe ir antes o junto al rediseño de Home, porque una Home mas util depende de datos disponibles sin parpadeo.

## Orden recomendado de ejecucion

### UX-1: Estado compartido y anti-popping

Objetivo: que navegar entre Home, Mis plantas, Calendario y Perfil se sienta fluido.

Alcance:

- cache de plantas visibles;
- cache de planta actual;
- loaders menos invasivos;
- reutilizar datos existentes mientras refresca.

Verificacion:

- navegar entre 4 pantallas sin ver recarga completa innecesaria;
- `npm run check` pasa.

### UX-2: Home como centro de accion

Objetivo: que Home sea util y no una pantalla de paso.

Alcance:

- tareas de hoy;
- acciones rapidas;
- resumen de plantas/jardines;
- actividad reciente;
- acceso a feedback beta.

### UX-3: Crear planta menos rigido

Objetivo: permitir distintas entradas sin implementar todos los casos complejos todavia.

Alcance:

- entrada inicial con opciones;
- mantener flujo foto actual;
- preparar manual/problema como caminos controlados;
- usar tipos compartidos del flujo.

### UX-4: Feedback de testers

Objetivo: recibir bugs/mejoras desde la app.

Alcance:

- tabla `tester_feedback`;
- boton visible;
- formulario simple;
- pantalla o consulta de revision.

### UX-5: Jardines v1

Objetivo: probar grupos con los 4 usuarios actuales.

Alcance:

- crear jardin;
- listar jardines propios/compartidos;
- agregar planta a jardin;
- invitar/gestionar miembro simple;
- probar roles owner/caregiver/viewer.

### UX-6: Compartir planta individual

Objetivo: validar cuidado compartido fuera de jardines.

Alcance:

- invitar cuidador a una planta;
- ver plantas compartidas conmigo;
- permisos basicos de cuidado.

## No hacer todavia

- No rediseñar toda la app visualmente sin resolver utilidad.
- No construir jardines completos con metricas, mapa e impacto antes de probar roles basicos.
- No depender solo de reportes verbales de testers.
- No meter pagos antes de entender uso real.
- No convertir la app en una landing page; debe abrir como herramienta.

## Criterio de exito de la beta

La beta mejora si:

- el usuario sabe que hacer al abrir la app;
- crear planta no se siente como un tunel obligatorio;
- un tester puede reportar problemas sin salir de la app;
- 2 o mas usuarios pueden cuidar/ver una planta o jardin sin romper permisos;
- el front se siente mas fluido al navegar;
- el equipo recibe feedback accionable, no solo impresiones sueltas.
