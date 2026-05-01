# Diagramas de Lleken

Este directorio contiene los diagramas fuente del proyecto. La regla es simple: primero se actualiza el diagrama en Markdown/Mermaid dentro del repo; despues se exporta a PDF cuando necesite compartirse.

## Orden recomendado

1. `casos-de-uso.md` - quien hace que en la app.
2. `user-flow.md` - como navega una persona por las pantallas.
3. `componentes.md` - bloques logicos del sistema y dependencias.
4. `seq-nueva-planta.md` - secuencia completa de crear una planta.
5. `seq-seguimiento.md` - secuencia completa de seguimiento por foto.
6. `er-actual.md` - datos tal como existen hoy.
7. `er-propuesto.md` - datos despues de preparar crecimiento.
8. `estados-planta.md` - cambios de estado de una planta.
9. `clases-dominio.md` - tipos principales de TypeScript y responsabilidades.

## Estado

| Diagrama | Archivo | Estado |
|---|---|---|
| Casos de uso | `casos-de-uso.md` | actualizado con PAC/B2B-B2G |
| Flujo de usuario | `user-flow.md` | pendiente |
| Componentes | `componentes.md` | pendiente |
| Secuencia nueva planta | `seq-nueva-planta.md` | pendiente |
| Secuencia seguimiento | `seq-seguimiento.md` | pendiente |
| ER actual | `er-actual.md` | pendiente |
| ER propuesto | `er-propuesto.md` | pendiente |
| Estados de planta | `estados-planta.md` | pendiente |
| Clases / dominio | `clases-dominio.md` | pendiente |

## Convenciones

- Usar Mermaid cuando sea suficiente.
- Marcar claramente que es actual y que es futuro.
- No dibujar features como existentes si solo estan preparadas en modelo.
- Mantener cada diagrama en un archivo pequeno y revisable.
- Si un diagrama cambia una decision de arquitectura, enlazarlo desde `../PLAN_ARQUITECTURA.md`.
