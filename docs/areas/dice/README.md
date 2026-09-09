# Área: Dados y reglas de pruebas

## Objetivo

Proporcionar un sistema d20 determinista, aislado del navegador y de Three.js, que pueda ser utilizado por narrativa, gameplay y futuro combate.

## Alcance actual

- Tirada de D20.
- Modificador.
- Total.
- Dificultad.
- Éxito y fallo.
- 1 natural y 20 natural.
- Roller con semilla para reproducibilidad y roller aleatorio para partida.
- Primera prueba de investigación del altar.

## Tareas

- [x] Crear tipos de tirada y prueba.
- [x] Crear roller determinista con semilla.
- [x] Resolver éxito, fallo y resultados críticos.
- [x] Integrar una prueba narrativa real.
- [x] Integrar reintentos con coste de recurso y resolución posterior.
- [x] Añadir presentación detallada del resultado y dificultad.
- [x] Añadir animación y estado visual de lanzamiento.
- [x] Añadir configuración de atributos del personaje.
- [ ] Añadir tests automatizados de distribución y casos extremos.
- [x] Preparar extensión para combate.

La extensión de combate usa Fuerza para ataques del jugador, Destreza para su CA, CA 14 para el Centinela, críticos naturales y daño variable de 1d6 más modificador. El enemigo tira con bonificador +4 y puede fallar contra la CA del personaje.

## Criterios de aceptación

- La misma semilla produce la misma secuencia de resultados.
- Las reglas pueden ejecutarse sin DOM, React ni Three.js.
- Una prueba modifica el estado del juego solo mediante una transición explícita.
- Un 20 natural tiene éxito y un 1 natural falla según las reglas definidas.
- El resultado visible explica tirada, modificador, dificultad y consecuencia.
