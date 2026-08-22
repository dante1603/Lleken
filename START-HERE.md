# Llekén — entrada al checkout actual

Este archivo es un mapa de entrada, no una fuente de estado mutable.

## Arranque

```bash
npm ci
npm run check
npm run dev
```

## Autoridades

- `AGENTS.md`: contrato ejecutable para agentes, permisos, preflight y retorno.
- código + tests + checkout: realidad técnica presente.
- Notion de Llekén: estado operativo, misiones y decisiones vigentes del proyecto.
- `docs/current/`: snapshots técnicos; comprobar fecha y compatibilidad con el checkout antes de tratarlos como actuales.
- `docs/architecture/`: diseños futuros; no asumir que ya están implementados.

## Gate canónico

`npm run check` es la puerta local de calidad y debe coincidir con el baseline ejecutado por CI. Seguridad Snyk y construcción Docker son capas adicionales del pipeline, no reemplazos de ese gate.

## Antes de editar

1. leer `AGENTS.md`;
2. ejecutar su preflight Git sobre el checkout real;
3. localizar las rutas/símbolos del frente;
4. preservar cambios preexistentes;
5. detenerse ante contradicciones materiales entre intención/canon y checkout.

## Modos de ejecución

- **Patch:** dirección localizada; verificar, editar y probar.
- **Implementation:** dirección resuelta, varias piezas; implementar sin reabrir la decisión de producto.
- **Experimento dirigido:** hipótesis conocidas, resultado incierto; comparar variantes con una medición común.
- **Exploration:** sólo cuando todavía no puede reducirse la incertidumbre a hipótesis implementables.

## Documentación

Para navegar documentación histórica o académica usa `docs/INDEX.md`, pero no infieras estado técnico actual sólo desde archivos antiguos: contrástalo con el checkout y el owner vigente.
