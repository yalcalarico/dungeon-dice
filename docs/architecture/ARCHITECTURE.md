# Arquitectura

## Principios

- El estado del juego es la fuente de verdad.
- React controla la interfaz y los flujos de usuario.
- Three.js controla la representación y las animaciones visuales.
- La lógica de juego debe poder probarse sin WebGL.
- Las acciones producen eventos y efectos explícitos.
- Los datos narrativos deben estar separados del código de presentación.
- La escena debe poder reiniciarse y destruirse de forma segura.

## Flujo principal

```text
Input de usuario
  -> ActionParser / InteractionSystem
  -> NarrativeEngine
  -> DiceSystem, si corresponde
  -> GameReducer
  -> GameState
  -> React UI + adaptador Three.js
```

## Capas

### Aplicación

Coordina React, ciclo de vida y suscripciones al estado. No contiene reglas narrativas ni construcción directa de geometría.

### Estado

Contiene `GameState`, acciones, eventos, reducer y selectores. No debe importar Three.js.

### Gameplay

Contiene movimiento, proximidad, interacción, objetivos y reglas de la aventura.

### Narrativa

Contiene nodos, condiciones, parser, respuestas y efectos. Debe funcionar con datos serializables.

### Contenido

Los niveles deben cargarse desde configuraciones versionadas y validadas. La lógica del runtime interpreta IDs, requisitos, checks, efectos y transiciones; no debe contener reglas exclusivas de una escena concreta. La especificación está en [Contenido parametrizable](../areas/content/README.md).

### Renderizado

Contiene escena, cámara, mundo, entidades visuales, materiales, iluminación y efectos.

### UI

Presenta el estado y emite intenciones. No muta directamente objetos del mundo.

## Contratos mínimos

```ts
type GameEvent =
  | { type: 'ACTION_SUBMITTED'; input: string }
  | { type: 'DICE_ROLLED'; checkId: string; result: DiceResult }
  | { type: 'PLAYER_MOVED'; x: number; z: number }
  | { type: 'INTERACTION_REQUESTED'; targetId: string }
```

Los nombres son una dirección inicial; deben mantenerse explícitos y evitar funciones genéricas que escondan cambios de estado.

## Integración React/Three.js

React debe enviar cambios de estado al adaptador visual. Three.js no debe llamar directamente a `setState` para resolver gameplay. Los mensajes ambientales pueden publicarse como eventos o callbacks controlados y deben limpiarse al destruir la escena.

## Estructura objetivo

```text
src/
  app/
  game/
    entities/
    systems/
  narrative/
  dice/
  state/
  rendering/
  ui/
  styles/
```

## Contrato de datos

Un nivel futuro debe poder exportarse como JSON y contener al menos escena, objetos, interacciones, objetivos, checks, acciones, efectos, políticas de movimiento y condiciones de victoria. El JSON no puede ejecutar código; cualquier comportamiento permitido debe pertenecer a un catálogo de comandos validado.
