# Roadmap de evolución del producto

## Propósito

Este documento registra lo que deberá construirse después del primer demo para convertir Dungeon Dice en un juego web de aventura narrativa más completo. No sustituye al [plan maestro del demo](./MASTER-PLAN.md): el demo sigue siendo la prioridad inmediata y este roadmap evita perder de vista las siguientes etapas.

Las etapas son orientativas. No se considera comprometida una funcionalidad hasta que exista una especificación propia, criterios de aceptación y una decisión sobre su coste técnico.

## 1. Diferencia entre demo y producto

### Demo inicial

- Una cripta.
- Un personaje controlable.
- Narrativa determinista.
- D20 y pruebas simples.
- Interacciones limitadas.
- Sin cuentas, backend ni multiplayer.
- Estado únicamente local durante la sesión.

### Producto futuro

- Personajes creados por jugadores.
- Progresión y guardado persistente.
- Inventario y equipamiento.
- Más reglas de RPG y combate.
- Múltiples zonas y aventuras.
- Cooperativo online.
- Backend autoritativo.
- Herramientas de creación y publicación de contenido.
- Operación, seguridad y observabilidad.

## 2. Orden general de evolución

```text
Demo jugable
  -> Fundación single-player
  -> Vertical slice ampliado
  -> Sistemas RPG persistentes
  -> Herramientas y contenido
  -> Multiplayer cooperativo
  -> Operación y expansión
```

No se debe construir multiplayer sobre una base de gameplay que todavía no tenga estado determinista, comandos claros y separación entre simulación y renderizado.

## 3. Etapa A: completar y validar el demo

Esta etapa corresponde al `MASTER-PLAN.md`.

### Objetivos

- Completar una aventura de principio a fin.
- Validar que la narrativa, exploración y dados son divertidos juntos.
- Medir rendimiento y estabilidad.
- Comprobar que los jugadores entienden las acciones disponibles.

### Salida de la etapa

- Demo jugable.
- Métricas básicas de rendimiento.
- Feedback de usuarios.
- Lista de problemas de diseño y tecnología.
- Decisión informada sobre qué sistemas merecen crecer.

## 4. Etapa B: fundación single-player

Antes de añadir funcionalidades grandes, el demo debe convertirse en una base sostenible.

### Sistemas

- Guardado local y carga de partida.
- Reinicio, abandono y recuperación de partidas.
- Configuración de controles, audio y calidad gráfica.
- Pantallas de inicio, pausa y resultado.
- Sistema de perfiles locales.
- Versionado y migración del estado guardado.
- Registro de errores y diagnóstico en desarrollo.

### Diseño técnico

- Comandos de gameplay serializables.
- Estado determinista y reproducible.
- Separación entre simulación, presentación y persistencia.
- Identificadores estables para entidades, objetos y contenido.
- Esquema de datos versionado desde el inicio del guardado.

### Salida de la etapa

El jugador puede cerrar y volver a abrir el juego sin perder el progreso, y una partida puede reproducirse o depurarse a partir de sus comandos y resultados.

## 5. Etapa C: vertical slice ampliado

Construir una porción pequeña que represente el producto futuro, no simplemente añadir más contenido al demo.

### Contenido

- Dos o tres zonas conectadas.
- Varias escenas narrativas.
- Más de un objetivo por zona.
- NPCs básicos.
- Al menos un encuentro hostil.
- Una recompensa persistente.
- Una misión con rutas alternativas.

### Sistemas

- Diálogo con estados.
- Objetivos y misiones.
- Recompensas.
- Primeras decisiones con consecuencias entre zonas.
- Transiciones entre escenas.
- Estado de mundo compartido entre áreas.

### Salida de la etapa

Existe una experiencia corta que demuestra exploración, narrativa, conflicto, recompensa y continuidad.

## 6. Etapa D: creación y progresión de personajes

Esta etapa amplía la identidad del jugador sin exigir todavía todas las reglas de un RPG completo.

### Creación de personajes

- Nombre.
- Apariencia procedural o por piezas.
- Origen o trasfondo.
- Atributos iniciales.
- Arquetipo o clase inicial.
- Selección de habilidades iniciales.
- Validación de combinaciones.
- Vista previa del personaje.

La especificación operativa de atributos, HP/MP, creación, carga, experiencia y milestones está en [Personajes y progresión](../areas/characters/README.md).

### Progresión

- Experiencia.
- Niveles.
- Mejoras de atributos.
- Habilidades desbloqueables.
- Hitos narrativos.
- Recompensas cosméticas.
- Reglas claras para evitar combinaciones rotas.

### Decisiones pendientes

- Sistema propio inspirado en d20 o compatibilidad con reglas licenciadas.
- Progresión por niveles, hitos o ambas.
- Personalización cosmética puramente visual o con impacto limitado.

La decisión de reglas debe documentarse antes de copiar nombres, textos o estructuras protegidas de terceros.

## 7. Etapa E: inventario y equipamiento

### Inventario

- Objetos apilables.
- Peso o capacidad, si aporta valor.
- Categorías.
- Filtros y ordenamiento.
- Inspección de objeto.
- Uso, consumo, descarte y transferencia.
- Persistencia y validación de cantidades.

### Equipamiento

- Ranuras de equipo.
- Armas o herramientas.
- Armadura o protección.
- Accesorios.
- Estadísticas derivadas.
- Comparación entre objetos.
- Reglas de requisitos.

### Economía futura

- Moneda.
- Comerciantes.
- Recompensas.
- Precios definidos por contenido, no por lógica visual.
- Protección contra duplicación si existe backend.

## 8. Etapa F: combate y reglas RPG

El combate solo debe añadirse cuando el modelo de acciones y dados del demo sea estable.

### Alcance inicial

- Turnos o iniciativa claramente definidos.
- Acciones de movimiento.
- Ataque y defensa.
- Daño y estados.
- Cobertura o distancia si son necesarias.
- Enemigos con comportamientos simples.
- Victoria, derrota y retirada.
- Recompensas post-combate.

### Evolución posterior

- Habilidades con coste.
- Efectos temporales.
- Resistencias.
- Interacciones con el escenario.
- IA de enemigos.
- Encuentros configurables.

El combate debe compartir el mismo sistema de comandos, dados y estado que la narrativa, no crear una lógica paralela incompatible.

## 9. Etapa G: contenido y herramientas internas

Cuando haya más de una aventura, los datos no deben depender de editar componentes React.

### Datos y authoring

- Definiciones de zonas.
- Nodos narrativos.
- Misiones.
- NPCs.
- Enemigos.
- Objetos.
- Tablas de recompensas.
- Encuentros.
- Condiciones y efectos.

### Herramientas futuras

- Validación de referencias.
- Editor interno de narrativa.
- Vista previa de escenas.
- Herramienta para colocar objetos.
- Exportación de contenido versionado.
- Tests automáticos de contenido.
- Detector de nodos inaccesibles o finales imposibles.

## 10. Etapa H: backend y persistencia online

No es necesario para el demo, pero será necesario para cuentas, sincronización y multiplayer.

### Componentes

- Servicio de autenticación.
- Perfiles de jugador.
- Guardado de personajes.
- Inventario persistente.
- Progreso de aventuras.
- Catálogo de contenido.
- Servicio de sesiones.
- Base de datos.
- Registro de eventos importantes.

### Reglas de seguridad

- El cliente nunca debe ser autoridad final sobre inventario, tiradas competitivas o recompensas.
- Validar comandos en servidor.
- No confiar en posiciones, cantidades ni resultados enviados por el navegador.
- Separar datos públicos, privados y administrativos.
- Definir límites de frecuencia y tamaño de mensajes.
- Diseñar migraciones de datos desde el primer esquema persistente.

## 11. Etapa I: multiplayer cooperativo

El primer objetivo multiplayer recomendado es cooperativo para grupos pequeños, no un mundo persistente masivo.

### Alcance inicial

- Grupo de 2 a 4 jugadores.
- Lobby o invitación.
- Un jugador anfitrión o sesión administrada por servidor.
- Entrada y salida segura de jugadores.
- Estado sincronizado de posiciones.
- Acciones narrativas compartidas.
- Turnos o bloqueo de resolución para evitar conflictos.
- Tiradas autoritativas.
- Reconexion básica.
- Fin de sesión controlado.

### Problemas que deben resolverse antes

- Qué jugador decide una acción narrativa grupal.
- Cómo se resuelven dos acciones simultáneas.
- Si todos ven la misma tirada.
- Qué ocurre si un jugador abandona durante una prueba.
- Quién puede avanzar una escena.
- Cómo se sincroniza una animación sin convertirla en fuente de verdad.

### Evolución posterior

- Roles de grupo.
- Partidas privadas.
- Matchmaking.
- Chat o comunicación contextual.
- Espectadores.
- Campañas compartidas.
- Moderación y reportes.

## 12. Etapa J: operación y producto online

Cuando exista backend y contenido persistente habrá que añadir:

- Monitorización de errores.
- Métricas de rendimiento del cliente y servidor.
- Trazas de sesiones.
- Alertas.
- Backups y recuperación.
- Versionado de protocolos.
- Despliegues graduales.
- Feature flags.
- Gestión de contenido.
- Moderación.
- Política de privacidad.
- Términos de uso.
- Accesibilidad y soporte de navegadores.

## 13. Backlog futuro no prioritario

Estas ideas quedan registradas, pero no deben competir con la ruta principal:

- Campañas generadas proceduralmente.
- Director o narrador colaborativo.
- Modos de desafío.
- Logros.
- Cosméticos.
- Ranking.
- Eventos temporales.
- Modo espectador.
- Editor público de aventuras.
- Exportación de partidas.
- Audio reactivo avanzado.
- Soporte de gamepad.
- Aplicación instalable tipo PWA.

## 14. Dependencias críticas

```text
Estado determinista
  -> guardado local
  -> persistencia online
  -> sincronización multiplayer

Comandos explícitos
  -> validación local
  -> replay/debug
  -> autoridad de servidor

Contenido declarativo
  -> más aventuras
  -> herramientas internas
  -> publicación y versionado

Dados aislados
  -> narrativa
  -> combate
  -> resolución autoritativa multiplayer
```

## 15. Qué no construir todavía

Hasta completar y validar el demo no se debe implementar:

- Login.
- Base de datos.
- Matchmaking.
- Chat.
- Tienda.
- Economía online.
- Creación compleja de personajes.
- Inventario completo.
- Mundo persistente.

Registrar estas ideas aquí es suficiente por ahora. La implementación prematura aumentaría el coste y dificultaría validar si el núcleo de exploración narrativa funciona.
