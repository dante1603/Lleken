# Auditoria general para la refundacion de Lleken

Fecha: 2026-07-10.
Alcance: revision documental y estatica del repositorio. No incluye cambios de codigo ni prueba autenticada en navegador.

## Resumen ejecutivo

El proyecto tiene una base tecnica aprovechable, pero la experiencia, la navegacion y la mayor parte de la documentacion activa siguen organizadas alrededor de una planta individual y de la IA como puerta de entrada.

La nueva direccion no exige desechar todo. Supabase ya contiene conceptos de jardines, membresias, roles y eventos que pueden sostener una primera vertical colaborativa. Sin embargo, el frontend no ofrece rutas de jardines, miembros o asignacion de trabajo, y las tareas actuales se calculan en cliente desde cada planta. Existe por tanto una brecha clara entre schema preparado y producto real.

Antes de rediseñar pantallas conviene recuperar localhost, acordar el dominio colaborativo minimo y construir una vertical pequeña de trabajo compartido.

## Hallazgos comprobados

### 1. El producto visible sigue centrado en plantas individuales

- `src/App.tsx` expone Home, lista de plantas, calendario, ficha, identificacion, seguimiento y especies.
- No existen rutas de espacios/jardines, miembros, sectores ni administracion de tareas compartidas.
- `Home.tsx` y `Calendar.tsx` derivan tareas recorriendo plantas cargadas.

Impacto: una organizacion con muchas plantas debe pensar y operar planta por planta.

### 2. La IA esta integrada como flujo principal

El recorrido de nueva planta se divide en camara, identificacion, ubicacion y generacion de perfil. Existen endpoints separados para identificar, generar cuidados y analizar seguimientos.

Impacto: la arquitectura de navegacion comunica que la IA es el producto, aunque las necesidades nuevas sean coordinacion, asignacion y trazabilidad.

### 3. La base colaborativa existe solo parcialmente

La migracion inicial incluye:

- `gardens`;
- `garden_members` con roles `owner`, `caregiver`, `viewer`;
- `plants.garden_id`;
- `plant_members`;
- eventos y politicas RLS que consideran membresias.

En el frontend, `garden_id` se lee de forma limitada y los arreglos de miembros/cuidadores se completan con valores locales simplificados. No hay cliente funcional para administrar jardines o membresias.

Impacto: existe una buena semilla de datos, pero no debe confundirse con una feature terminada ni con un modelo validado para escala.

### 4. El bloqueo de localhost no nace de una URL productiva fijada en el codigo

`AuthContext.tsx` envia a Supabase OAuth:

```ts
redirectTo: `${window.location.origin}/home`
```

En localhost eso produce `http://localhost:3000/home`. Si Supabase no encuentra esa URL en su allow list, usa el Site URL configurado, que normalmente es el dominio productivo. Esta conducta coincide con el problema descrito.

Tambien se observo:

- Vite corre en puerto `3000`;
- `.env.local` declara `APP_URL="http://localhost:3001"`;
- no se encontro un consumidor actual de `APP_URL` en `src/` o `server/`.

Diagnostico probable: falta autorizar localhost en Supabase Auth; la discrepancia de puerto es deuda de configuracion adicional.

### 5. La documentacion activa quedo atras del cambio de producto

- El brief operativo estaba fechado 2026-06-03.
- `APP_OVERVIEW.md`, `README.md`, Beta 1 y el roadmap anterior describen foto + IA + cuidado individual como centro.
- El backlog activo priorizaba anti-popping, Home individual, nueva planta y confianza en IA.
- Algunos documentos muestran caracteres mal decodificados, lo que reduce legibilidad y confianza.

Impacto: un agente nuevo continuaria optimizando la direccion anterior.

### 6. La verificacion automatica es pequeña para el alcance

El comando principal es `npm run check` (TypeScript, build y Vitest). Solo se identificaron pruebas unitarias en librerias de IA y plantas; no hay evidencia en esta auditoria de pruebas de autenticacion, RLS o flujos colaborativos.

Impacto: la nueva vertical multiusuario necesitara pruebas de permisos y recorridos reales, no solo build exitoso.

## Riesgos de una reescritura impulsiva

- reemplazar schema antes de validar como trabaja un grupo;
- convertir `garden` en un contenedor generico que no represente otros espacios;
- construir analitica e IA antes de resolver tareas, autoria y estados;
- conservar nombres y permisos heredados solo porque ya existen;
- mezclar datos locales de desarrollo con el piloto real;
- intentar migrar toda la interfaz en un solo corte.

## Recomendacion

Mantener el repositorio y hacer una refundacion incremental:

1. habilitar y verificar el bucle local;
2. adoptar la nueva vision como canon documental;
3. especificar el dominio colaborativo y revisar el schema heredado;
4. validar un prototipo navegable sin IA;
5. implementar una sola vertical multiusuario completa;
6. ampliar a sectores, lotes y acciones masivas;
7. reintroducir IA solo donde reduzca trabajo demostrado.

## Verificacion pendiente

- Confirmar en Supabase Dashboard la configuracion actual de Site URL y Redirect URLs.
- Ejecutar login Google desde `http://localhost:3000` despues del ajuste.
- Probar que produccion sigue regresando a su propio dominio.
- Confirmar que las migraciones del repo coinciden con el schema aplicado en Supabase.
- Ejecutar `npm run check` cuando comiencen cambios de codigo; no era necesario para este corte documental.

