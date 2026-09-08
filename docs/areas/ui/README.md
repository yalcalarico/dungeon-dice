# Área: UI y UX

## Objetivo

Hacer evidente qué puede hacer el jugador, qué ocurrió y qué debe hacer después sin ocultar el mundo 3D.

## Componentes

- `NarrativePanel`.
- `ActionInput`.
- `ActionSuggestions`.
- `DiceWidget`.
- `CharacterPanel`.
- `InteractionPrompt`.
- `ObjectiveBanner`.
- `GameMenu`.

## Reglas

- Los botones deben tener comportamiento real o no existir.
- Las acciones deben anunciar requisitos y resultados.
- El foco del teclado debe ser visible.
- Los textos narrativos deben poder leerse con lector de pantalla.
- La UI debe funcionar a 320 px de ancho como mínimo.

## Tareas

- [ ] Separar componentes desde `App.tsx`.
- [ ] Conectar UI al estado central.
- [x] Implementar menú funcional y accesible.
- [x] Añadir feedback de éxito, fallo, victoria y tirada.
- [x] Añadir prompt contextual para objetos 3D.
- [x] Añadir checklist de objetivos y pruebas bloqueantes.
- [x] Diferenciar visualmente interacción, éxito y fallo.
- [x] Añadir historial lateral con timestamps y toggle de visibilidad.
- [x] Ocultar temporalmente el input libre mientras se construyen las opciones contextuales.
- [ ] Revisar contraste y foco.
- [x] Cambiar `lang` del documento a español.
- [ ] Diseñar controles táctiles opcionales.
- [ ] Validar responsive en escritorio y móvil.

## Criterios de aceptación

- Cada botón visible ejecuta una acción real y proporciona feedback.
- El jugador entiende la acción disponible, el resultado de la tirada y el objetivo actual.
- La interfaz mantiene foco visible y nombres accesibles.
- La UI sigue siendo utilizable en una pantalla de 320 px de ancho.
- Escribir en el input no mueve al personaje.
