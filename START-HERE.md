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
- `docs/current/`: descripción técnica actual cuando siga compatible con el checkout.
- Notion de Llekén: estado operativo, misiones y decisiones vigentes del proyecto.
- `docs/architecture/`: diseños futuros; no asumir que ya están implementados.

## Gate canónico

`npm run check` es la puerta local de calidad y debe coincidir con el baseline ejecutado por CI. Seguridad Snyk y construcción Docker son capas adicionales del pipeline, no reemplazos de ese gate.

## Antes de editar

1. leer `AGENTS.md`;
2. ejecutar el preflight Git indicado por la misión;
3. localizar las rutas/símbolos nombrados;
4. preservar cambios preexistentes;
5. detenerse ante contradicciones materiales entre misión y checkout.

## Documentación

Para navegar documentación histórica o académica usa `docs/INDEX.md`, pero no infieras estado técnico actual sólo desde archivos antiguos: contrástalo con el checkout y la misión vigente.
