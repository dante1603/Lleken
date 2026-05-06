# Diagrama de casos de uso - estado actual

Fecha: 2026-05-01

Objetivo: mostrar quien interactua con Lleken y que casos de uso existen hoy, separando lo funcional de lo preparado pero no terminado.

## Lectura rapida

Actores principales:

- Visitante: persona sin sesion iniciada.
- Usuario autenticado: persona que entra con Google.
- Dueno de planta: usuario que crea una planta.
- Cuidador: rol preparado en datos, pendiente de UI completa.
- Tester beta: persona del grupo pequeno de validacion.
- Institucion: municipalidad, ONG, colegio o empresa RSE que puede financiar/gestionar huertos.
- Servicios externos: Gemini, Open-Meteo y Firebase.

## Diagrama

```mermaid
flowchart LR
  Visitante["Visitante"]
  Usuario["Usuario autenticado"]
  Dueno["Dueno de planta"]
  Cuidador["Cuidador\n(pendiente UI)"]
  Tester["Tester beta"]
  Institucion["Institucion\nB2B/B2G futuro"]

  Firebase["Firebase\nAuth / Firestore / Storage"]
  Gemini["Gemini\nIA"]
  Meteo["Open-Meteo\nclima y ubicacion"]

  subgraph App["Lleken"]
    Login["Iniciar sesion con Google"]
    Home["Ver inicio y resumen"]
    Crear["Crear planta desde foto"]
    Identificar["Identificar especie y estado"]
    Ubicacion["Confirmar ubicacion"]
    Plan["Generar plan de cuidados"]
    Guardar["Guardar planta y foto"]
    Listar["Ver listado de plantas"]
    Ficha["Ver ficha de planta"]
    Calendario["Ver calendario de cuidados"]
    Riego["Registrar riego"]
    Nota["Registrar nota"]
    Seguimiento["Hacer seguimiento por foto"]
    Refresh["Actualizar planta desde foto\ncon vista previa"]
    Perfil["Ver perfil y plan"]
    UsoIA["Ver uso/costo estimado IA"]
    Invitar["Invitar cuidador\n(pendiente)"]
    Compartidas["Ver plantas compartidas\n(pendiente de verificacion)"]
    Huerto["Gestionar huerto comunitario\n(futuro)"]
    Impacto["Ver metricas de impacto\n(futuro)"]
    Sensores["Integrar sensores IoT\n(fase 2)"]
    Eliminar["Eliminar planta"]
  end

  Visitante --> Login
  Login --> Firebase

  Usuario --> Home
  Usuario --> Crear
  Usuario --> Listar
  Usuario --> Calendario
  Usuario --> Perfil

  Tester --> Crear
  Tester --> Seguimiento
  Tester --> Calendario

  Dueno --> Crear
  Dueno --> Ficha
  Dueno --> Riego
  Dueno --> Nota
  Dueno --> Seguimiento
  Dueno --> Refresh
  Dueno --> Eliminar
  Dueno -. futuro .-> Invitar

  Cuidador -. futuro .-> Compartidas
  Cuidador -. futuro .-> Riego
  Cuidador -. futuro .-> Seguimiento

  Institucion -. futuro .-> Huerto
  Institucion -. futuro .-> Impacto
  Institucion -. fase 2 .-> Sensores

  Crear --> Identificar
  Identificar --> Gemini
  Crear --> Ubicacion
  Ubicacion --> Meteo
  Ubicacion --> Plan
  Plan --> Gemini
  Plan --> Guardar
  Guardar --> Firebase

  Listar --> Firebase
  Ficha --> Firebase
  Calendario --> Firebase
  Riego --> Firebase
  Nota --> Firebase
  Seguimiento --> Gemini
  Seguimiento --> Firebase
  Refresh --> Gemini
  Refresh --> Firebase
  Perfil --> Firebase
  UsoIA --> Gemini
```

## Casos de uso actuales

| Actor | Caso de uso | Estado |
|---|---|---|
| Visitante | Iniciar sesion con Google | funcional |
| Usuario autenticado | Ver inicio, listado, calendario y perfil | funcional |
| Dueno | Crear planta desde foto | funcional |
| Dueno | Confirmar ubicacion con sugerencias/geolocalizacion | funcional |
| Dueno | Generar plan con clima real o fallback controlado | funcional |
| Dueno | Guardar foto en Storage y datos en Firestore | funcional |
| Dueno | Ver ficha de planta | funcional |
| Dueno | Registrar riego y notas | funcional |
| Dueno | Hacer seguimiento por foto | funcional |
| Dueno | Actualizar planta desde foto con vista previa | funcional |
| Dueno | Eliminar planta | funcional, debe revisarse con reglas |
| Usuario autenticado | Ver uso/costo estimado de Gemini | tecnico, no necesariamente UI final |
| Cuidador | Ver y cuidar planta compartida | pendiente |
| Dueno | Invitar cuidador | pendiente |
| Tester beta | Probar flujo completo y reportar fricciones | objetivo del mes |
| Institucion | Gestionar o financiar huertos comunitarios | futuro |
| Institucion | Ver metricas de impacto ambiental/social | futuro |
| Equipo / piloto PAC | Validar uso real en huerto comunitario | objetivo de validacion |

## Notas de alcance

- El rol cuidador existe como intencion en campos `caregiverIds` y `memberIds`, pero aun no debe presentarse como feature terminada.
- El prototipo beta debe enfocarse primero en el flujo individual de planta, calendario y seguimiento, sin perder de vista que PAC valida el caso comunitario.
- Cuidadores es el siguiente gran bloque funcional, pero no conviene mezclarlo con diagramas del estado actual sin marcarlo como pendiente.
- Instituciones, metricas B2B/B2G y sensores IoT son parte de la vision/negocio, no del prototipo actual.
