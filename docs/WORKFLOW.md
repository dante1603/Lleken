# Flujo de trabajo de Lleken

Este documento define como avanzar sin mezclar demasiados frentes a la vez. La idea es que cada cambio tenga un objetivo pequeno, una verificacion clara y un punto donde podamos decidir si seguimos, corregimos o congelamos.

## Regla principal

Trabajar en ciclos cortos:

1. Elegir un checkpoint activo.
2. Tocar solo los archivos necesarios para ese checkpoint.
3. Verificar con comandos y prueba manual.
4. Registrar resultado, deuda y siguiente paso.

Si aparece una idea nueva durante el checkpoint, se anota en `docs/CHECKPOINTS.md` y no se mezcla salvo que desbloquee el trabajo actual.

## Definicion de listo

Un checkpoint esta listo cuando cumple todo esto:

- `npm run lint` pasa.
- `npm run build` pasa.
- El flujo afectado fue probado manualmente en localhost.
- Los errores esperables tienen estado visual o mensaje util.
- No quedan cambios accidentales fuera del alcance.
- La documentacion del checkpoint queda actualizada.

## Tipos de trabajo

- Producto: flujos visibles para el usuario.
- Datos: Firestore, Storage, tipos y permisos.
- IA: prompts, endpoints, normalizacion y manejo de errores.
- Calidad: tests, build, rendimiento, PWA y limpieza.
- Documentacion: decisiones, pasos manuales y checklist.

No conviene abrir mas de dos tipos de trabajo en el mismo checkpoint.

## Verificacion recurrente

Comandos base:

```bash
npm run lint
npm run build
```

Servicios locales:

```bash
npm run dev:api
npm run dev
```

Prueba manual minima:

- Abrir `http://localhost:3000`.
- Iniciar sesion.
- Recorrer el flujo tocado.
- Revisar consola del navegador y terminales.
- Confirmar que Firestore/Storage guardan lo esperado cuando aplique.

## Politica de cambios

- Antes de tocar codigo, mirar `git status --short`.
- No corregir archivos no relacionados solo porque se vieron durante el recorrido.
- Preferir cambios pequenos y reversibles.
- Al terminar un checkpoint, dejar un resumen corto de que cambio, que se probo y que queda pendiente.

