# Roadmap de Lleken

Este documento deja persistido el plan de trabajo para volver la app completamente funcional entre sesiones.

## Objetivo

Lleken debe ser una app mobile-first para cuidar plantas con autenticacion Google, identificacion por foto con IA, clima local, planes de cuidado, historial, calendario, seguimiento por foto y soporte futuro para cuidadores y planes de pago.

## Requisitos funcionales

- Autenticar usuarios con Google y mantener `users/{uid}` sincronizado.
- Crear una planta desde camara o galeria.
- Identificar especie, estado de salud e informacion general con IA.
- Capturar ciudad o geolocalizacion para ajustar cuidados con clima real.
- Generar y guardar plan de riego, luz, alertas y seguimiento.
- Guardar fotos en Firebase Storage y referencias en Firestore.
- Listar plantas visibles para el usuario, propias y compartidas.
- Buscar, filtrar y ordenar plantas.
- Ver ficha de planta con foto, estado, clima, plan, alertas e historial.
- Registrar riego, cosecha, notas y foto de seguimiento.
- Analizar fotos de seguimiento con IA y actualizar estado/historial.
- Mostrar calendario de proximos cuidados.
- Mostrar perfil, estadisticas, plan y cierre de sesion.
- Preparar invitacion/gestion de cuidadores.
- Aplicar limite del plan gratis y preparar upgrade a pago.

## Requisitos no funcionales

- Seguridad: no exponer claves privadas, proteger reglas Firestore/Storage y validar permisos por usuario.
- Privacidad: proteger fotos, ubicacion y datos de plantas.
- Confiabilidad: manejar errores de IA, red, permisos, JSON invalido, geolocalizacion y Storage.
- Rendimiento: optimizar bundle, usar lazy loading y comprimir imagenes.
- Usabilidad: estados de carga/error claros, flujo movil fluido y textos consistentes.
- Mantenibilidad: separar IA, datos, validacion y UI; evitar logica duplicada.
- Testeabilidad: agregar pruebas unitarias y e2e para flujos criticos.
- Deploy: reglas Firebase, manifest PWA, dominios autorizados y checklist de release.

## Brechas actuales

- Gemini se llama desde el frontend con `GEMINI_API_KEY`; para produccion debe moverse a backend/Cloud Functions.
- La foto inicial de planta se estaba guardando como data URL en Firestore; debe vivir en Storage.
- El modelo soporta `memberIds`, pero el listado aun debe consultar plantas compartidas correctamente.
- El limite gratis esta documentado, pero aun no bloquea la creacion.
- Hay textos con mojibake que deben corregirse.
- Varias acciones de perfil/calendario son botones visuales sin flujo real.
- No hay suite de tests automatizados.
- El bundle de produccion supera el umbral recomendado por Vite.

## Pasos de ejecucion

### Paso 1 - Estabilizar datos del flujo nueva planta

- Guardar la foto inicial en Firebase Storage.
- Mantener en Firestore solo `fotoUrl` y `fotoPath`.
- Listar plantas por `memberIds` y conservar compatibilidad legacy con `userId`.
- Mejorar manejo de errores basicos en seleccion/compresion de imagen.
- Verificar con `npm run lint` y `npm run build`.

### Paso 2 - Proteger llamadas de IA

- Centralizar prompts, parseo JSON y errores en una capa de IA.
- Validar y normalizar respuestas JSON antes de guardarlas.
- Crear una capa backend para llamadas Gemini.
- Mover `GEMINI_API_KEY` fuera del bundle cliente.
- Definir endpoints para identificar planta, generar plan y analizar seguimiento.

### Paso 3 - Cerrar flujo nueva planta

- Revisar `nuevaplanta.html` cuando tenga contenido y trasladar referencias visuales utiles.
- Unificar pasos: foto, identificacion, ubicacion, confirmacion, guardado.
- Agregar retry, cancelar, volver y estados de carga consistentes.
- Confirmar datos antes de crear la ficha.

### Paso 4 - Completar ficha e historial

- Persistir checklist de humedad/plagas como acciones.
- Implementar historial completo y filtros por tipo.
- Permitir editar nombre, ubicacion y parametros de cuidado.
- Revisar acciones de cosecha/fertilizacion para que dependan del tipo de planta.

### Paso 5 - Calendario y recordatorios

- Convertir el calendario en vista interactiva por dia/semana.
- Crear tareas reales derivadas del plan.
- Permitir marcar tareas como realizadas.
- Preparar notificaciones web/PWA.

### Paso 6 - Cuidadores y permisos

- Implementar invitaciones por email o link.
- Gestionar `caregiverIds` y `memberIds` desde UI.
- Diferenciar permisos de dueno y cuidador.
- Probar reglas Firestore para cada rol.

### Paso 7 - Plan gratis y pagos

- Bloquear creacion al superar limite gratis.
- Mostrar estado del plan y CTA de upgrade.
- Definir integracion de pagos o administracion manual inicial.

### Paso 8 - Calidad, PWA y deploy

- Corregir textos/encoding.
- Agregar tests unitarios y e2e.
- Dividir bundle con lazy routes.
- Completar manifest e iconos PWA.
- Crear checklist de deploy Firebase y smoke test.

## Verificacion recurrente

Antes de cerrar cada paso:

- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.
- Probar manualmente el flujo afectado en localhost.
- Revisar que no se hayan revertido cambios no relacionados.
