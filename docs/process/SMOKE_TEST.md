# Lleken - Smoke Test Manual

Este manual describe las pruebas de humo (Smoke Tests) que deben ejecutarse manualmente antes de realizar un despliegue a producción. El objetivo es asegurar que las funcionalidades críticas (Core User Journeys) estén operativas.

## Entorno de Pruebas
1. Asegúrate de tener las variables de entorno configuradas correctamente en `.env.local` (Firebase, Gemini API, Weather API).
2. Levanta la aplicación localmente:
   ```bash
   npm run dev
   npm run dev:api
   ```
3. Alternativamente, usa el entorno de Staging si está disponible.

---

## 1. Autenticación y Carga Inicial
**Objetivo**: Validar que los usuarios puedan acceder a la plataforma.

* [ ] **Login con Google**: Al hacer clic en "Ingresar con Google" o método análogo, el sistema redirige al proveedor y devuelve al usuario autenticado a `/home`.
* [ ] **Carga Inicial del Dashboard**: En `/home`, se observa el saludo correcto ("Hola, [Nombre]") y los contadores (plantas, saludables, alertas) cargan sin mostrar `NaN` o quedarse trabados.

## 2. Journey Principal: Agregar Planta (IA + Ubicación)
**Objetivo**: Validar el flujo de creación de una nueva planta, que involucra integración de hardware (cámara) e IA.

* [ ] **Captura de Foto**: Desde `/home`, hacer clic en "Tomar foto" o "Agregar planta". La cámara debe abrirse (o permitir subir archivo en desktop).
* [ ] **Identificación IA**: Al capturar, la pantalla de "Analizando tu planta" debe completarse exitosamente y transicionar a la pantalla de ubicación sin errores `500`.
* [ ] **Ubicación y Clima**:
  * Probar "Usar ubicación actual": Debe detectar la ciudad (o coordenadas).
  * Probar "Escribir ciudad": Debe permitir elegir una ciudad manualmente.
* [ ] **Generación de Perfil**: Al confirmar, el sistema debe crear la planta y redirigir al perfil de la planta `/planta/:id`. Validar que aparezca un nombre y un plan de cuidados (Riego, Luz, etc.).

## 3. Journey Secundario: Calendario y Riego Dinámico
**Objetivo**: Validar que la lógica de cálculo dinámico de riego funcione según el clima.

* [ ] **Visualización de Calendario**: Navegar a la pestaña Calendario. Se deben ver tareas listadas en tarjetas.
* [ ] **Acción Rápida de Riego**: En `/plants` o `/calendar`, marcar una planta como regada ("Registrar riego").
* [ ] **Actualización Inmediata**: La tarea debe desaparecer del grupo "Vencidas/Hoy" y recalcularse para el futuro (ej. "en 5 días").

## 4. Journey Secundario: Seguimiento y Salud
**Objetivo**: Validar el flujo de actualización de estado mediante IA.

* [ ] **Seguimiento desde Perfil**: Entrar a una planta existente y pulsar "Seguimiento".
* [ ] **Análisis de Estado**: Tomar una foto nueva. La IA debe retornar un análisis ("Sano" o "Atención") y guardarlo en el historial.
* [ ] **Reflejo en Dashboard**: Si el estado cambió a "necesita_atencion", la pantalla `/home` debe reflejar 1 alerta nueva.

---

## Qué hacer si un Smoke Test falla

Si alguna de estas pruebas falla:
1. **Detener el despliegue**.
2. Revisar logs en consola del navegador y de la terminal (Worker API).
3. Verificar estado de créditos de la API de Gemini (Error `429 RESOURCE_EXHAUSTED`).
4. Abrir un ticket o Issue con prioridad `Bloqueante`.

*Documento actualizado en Fase C4.*
