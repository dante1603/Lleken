# Contrato para agentes

Este archivo gobierna la operacion tecnica dentro del repositorio. La intencion, prioridad, alcance y decisiones vigentes de Llekén provienen de la mision entregada por Dante/Anam y del canon actual en Notion; la carpeta `docs/` del repositorio contiene material tecnico e historico y no debe usarse por defecto para inferir prioridades o decisiones actuales.

## Antes de editar

- Ejecuta `git status --short`, identifica la rama y revisa `git log -1 --oneline`.
- Localiza las rutas y simbolos nombrados por la mision.
- Lee solo la documentacion tecnica necesaria para ejecutar el cambio.
- Preserva cualquier cambio preexistente.
- Verifica que las premisas de la mision coincidan con el checkout real.
- Si existe una contradiccion material, reportala y detiene solo la parte afectada; no redisenes silenciosamente producto o arquitectura.

El codigo, tests, configuracion y despliegue observables son evidencia de implementacion actual. La documentacion historica del repo sirve como contexto hasta que haya sido revalidada.

## Alcance

- Implementa la salida demostrable solicitada y evita ampliar la mision.
- No hagas refactors transversales, limpieza de deuda ajena, cambios visuales no solicitados, formateo masivo ni adiciones de paquetes por iniciativa propia.
- No cambies claims de producto, semantica de confianza, contratos de datos o fronteras de seguridad fuera del alcance explicito.
- No conviertas fallbacks, heuristicas o inferencias de IA en hechos confirmados.

## Git y trabajo cloud

En una tarea cloud autorizada puedes:

- editar el checkout aislado;
- ejecutar tests, lint, build y diagnosticos;
- crear commits de la tarea;
- crear o actualizar una rama de mision;
- preparar o actualizar un pull request hacia `main`.

No puedes sin autorizacion explicita:

- hacer push directo a `main`;
- fusionar un PR;
- hacer force-push, reescribir historia o borrar ramas ajenas;
- desplegar produccion;
- modificar secretos o credenciales;
- ejecutar migraciones destructivas o borrar datos;
- cambiar configuracion externa de Supabase, Vercel, Google OAuth u otros servicios salvo que la mision lo autorice expresamente.

La rama debe representar la mision (`feat/ID-descripcion`, `fix/ID-descripcion`, `refactor/ID-descripcion`, `test/ID-descripcion` o equivalente), no el modelo de IA que la ejecuta.

## Verificacion

El gate automatico base actual es:

```bash
npm run check
```

Este comando ejecuta TypeScript/lint, build y tests segun los scripts del proyecto. Para cambios de UX, autenticacion, camara, flujos mobile o integraciones desplegadas, la validacion cloud no sustituye el smoke manual en preview o produccion desde el dispositivo de Dante.

No expongas secretos en logs, commits, fixtures, capturas ni respuestas.

## Retorno

Entrega un retorno compacto con:

1. cambio realizado;
2. archivos/APIs/dependencias modificados;
3. verificaciones ejecutadas y resultado exacto;
4. validacion manual que aun requiere Dante;
5. deuda, contradicciones o supuestos reales;
6. rama/commit/PR cuando corresponda.

No declares deploy, browser, autenticacion, integracion externa o aceptacion manual sin evidencia de esa misma ejecucion.
