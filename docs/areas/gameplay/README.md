# Área: Gameplay

## Objetivo

Convertir la escena 3D en una exploración con objetivo, límites, interacción y estados de victoria/fallo.

## Entregables

- Movimiento WASD con delta time.
- Límites y colisiones simples.
- Sistema de proximidad.
- Objetos interactivos con identificadores estables.
- Objetivo de la cripta.
- Flags de progreso.
- Reinicio de partida.
- Estados de exploración, resolución, victoria y fallo.

## Reglas

- El movimiento no modifica directamente la narrativa.
- La proximidad habilita acciones, pero no resuelve acciones automáticamente.
- Toda interacción pasa por un evento o comando explícito.
- El gameplay debe poder simularse sin renderizar.

## Tareas

- [ ] Extraer input a un controlador dedicado.
- [x] Ignorar WASD mientras el foco está en un elemento editable.
- [ ] Añadir pérdida de foco segura para teclas mantenidas.
- [x] Crear entidades interactivas iniciales `altar` y `torch`.
- [x] Crear sistema de proximidad y prompt contextual.
- [x] Añadir colisiones AABB simples para bloques del escenario.
- [x] Añadir acciones funcionales para `torch` y `exit_door`.
- [x] Permitir que el estado narrativo bloquee o libere el movimiento.
- [x] Exponer objetivos y checks bloqueantes del escenario.
- [x] Mantener la progresión disponible después de un fallo no terminal.
- [x] Definir flags y transiciones iniciales del altar.
- [x] Implementar condición de victoria.
- [x] Implementar ruta de fallo recuperable.
- [x] Añadir reinicio sin recargar la página.

## Criterios de aceptación

- El jugador se mueve a velocidad consistente aunque cambie el FPS.
- La posición queda dentro del área jugable y no atraviesa los límites definidos.
- Un objeto interactivo solo ofrece acciones cuando corresponde por distancia y estado.
- Reiniciar devuelve el estado del demo a su configuración inicial.
- La victoria y el fallo son estados observables y no solo mensajes de texto.
