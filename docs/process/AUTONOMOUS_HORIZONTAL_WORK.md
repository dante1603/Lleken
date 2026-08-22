# Trabajo autónomo horizontal

Este documento complementa `AGENTS.md` con una explicación operativa breve. `AGENTS.md` gobierna permisos; Notion gobierna intención, misiones y estado mutable.

## Propósito

Permitir que un agente avance sin esperar una orden puntual cuando Dante habilita trabajo autónomo, manteniendo control de riesgo y evitando que varios procesos compitan por la misma superficie.

## Flujo

1. Recuperar owner y estado fresco.
2. Revisar `main`, PRs abiertos y checks relevantes.
3. Elegir un frente acotado con utilidad demostrable.
4. Abrir una rama corta desde el baseline vigente.
5. Ejecutar y validar sólo ese seam.
6. Publicar rama/PR como estado candidato.
7. Devolver conocimiento durable al owner correspondiente.
8. Cambiar de frente o detenerse cuando el valor marginal sea bajo.

## Horizontal significa

- varias ramas/frentes independientes pueden coexistir;
- investigación, lectura, tests y auditoría pueden ocurrir en paralelo;
- la escritura sobre un mismo archivo/owner y la integración son seriales;
- si existe solapamiento con otro PR, el agente cambia de seam, revisa o deja handoff;
- no existe una rama autónoma permanente donde se acumulen cambios heterogéneos.

## No significa

- permiso de merge a `main`;
- permiso de deploy productivo;
- permiso de tocar secretos o configuración externa;
- permiso de hacer force-push, borrar trabajo ajeno o ejecutar migraciones destructivas;
- convertir cualquier idea en tarea;
- reescribir arquitectura o producto sin contrastar primero el owner canónico.

## Evidencia mínima

Cada frente relevante debe dejar rama, SHA, PR si existe, checks proporcionales, deuda/bloqueos y validación humana pendiente. Un PR no cambia el canon integrado hasta merge.
