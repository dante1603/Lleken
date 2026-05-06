# Reglas de diseno de Lleken

Fecha: 2026-05-05

Estas reglas aplican a todas las pantallas de la app, especialmente a vistas moviles y tarjetas de cuidado.

## Scroll interno visible

- No deben aparecer barras de scroll internas visibles dentro de tarjetas, secciones, botones, carruseles o bloques de contenido.
- Si un grupo de botones o tarjetas no cabe en el ancho disponible, debe ajustarse automaticamente con grilla, wrap, cambio de densidad o reduccion controlada de padding/tamano.
- Nunca se debe dejar un boton, tarjeta o control cortado a medias como estado normal de la interfaz.
- El scroll vertical de la pagina completa es aceptable; el problema son los scrollbars internos y los cortes horizontales que hacen que la pantalla se sienta rota.

## Densidad movil

- En mobile, las acciones frecuentes deben usar botones compactos, iconos claros y texto corto.
- Evitar espacios muertos grandes en tarjetas operativas: si el bloque no aporta lectura o accion, debe comprimirse.
- Los bloques informativos largos deben convertirse en piezas escaneables: mini recuadros, icono/imagen, titulo breve y explicacion corta.
