# Ejecución del MVP

Este documento es el checklist operativo para convertir el demo actual en el MVP. Cada slice debe dejar una capacidad demostrable, tests y documentación suficiente para continuar sin ampliar el alcance accidentalmente.

## Alcance acordado

- Campaña single-player de 30-60 minutos.
- Dos o tres zonas conectadas.
- Tres arquetipos configurables.
- Objetivos, diálogos, checks, bloqueadores y consecuencias declarativos.
- Un NPC útil, un NPC condicionado por decisiones y un encuentro hostil corto.
- XP, dos hitos, loot e inventario básico.
- Guardado local versionado, carga, derrota y reinicio.
- Sin backend, cuentas, multijugador, economía online ni IA externa.

## Orden de implementación

### S0. Contrato de estado y reglas de transición

- [x] Definir comandos y estados de gameplay.
- [x] Separar estado de gameplay, presentación e historial de sesión.
- [x] Añadir snapshots y restauración determinista.
- [x] Rechazar comandos inválidos sin mutar el estado.
- [x] Cubrir transición normal, pausa, terminal y reset con tests.

**Criterio de salida:** la cripta actual puede reproducirse con la misma secuencia de comandos y produce el mismo estado final.

### S1. Estado serializable y límites

- [x] Crear envelope versionado para sesiones.
- [x] Validar tipos, rangos, cantidades y referencias básicas.
- [x] Rechazar payloads demasiado grandes, profundos o peligrosos.
- [x] Definir migración explícita desde el estado legacy del demo.
- [x] Cubrir round-trip, corrupción, límites y migración con tests.

**Criterio de salida:** un estado válido se serializa y recupera sin pérdida relevante; un estado inválido no entra al runtime.

### S2. Validador de contenido

- [x] Validar IDs, referencias y entidades renderizables del contrato actual.
- [x] Emitir diagnósticos con archivo, ruta, severidad y solución.
- [x] Añadir fixtures válidos e inválidos.
- [x] Bloquear la exportación y carga cuando el contenido sea inválido.

**Pendiente de ampliación:** ciclos y entidades de NPC, encuentros y loot se añadirán cuando esos contratos existan.

### S3. Mapa ampliado y transiciones

- [x] Definir dos zonas conectadas con entradas y salidas estables.
- [x] Añadir transición validada y retorno seguro en el estado.
- [x] Persistir zona visitada, punto de entrada y estado de gameplay.
- [x] Desmontar escenas sin recursos huérfanos.

**Pendiente de integración:** conectar el mapa al cargador y al montaje real de `GameScene`.

### S4. Authoring mínimo de campaña

- [x] Definir herramienta interna de exportación.
- [x] Generar JSON determinista y versionado.
- [ ] Cargar el contenido exportado en una escena real.

**Pendiente de integración:** exponer la herramienta como comando CLI cuando el contrato de campaña sea estable.

### S5. Personajes

- [x] Crear schema de personaje.
- [x] Implementar Vanguardia, Explorador y Canalizador.
- [x] Implementar creación y validación local.
- [x] Integrar atributos, HP, MP y habilidad inicial.

**Pendiente de integración:** pantallas de creación/selección y persistencia del personaje en perfiles locales.

### S6. Guardado y carga

- [ ] Crear perfiles locales separados.
- [ ] Añadir guardado manual, autosave y puntos seguros.
- [ ] Añadir carga atómica, recuperación y migraciones.
- [ ] Evitar duplicación de entidades y recompensas.

### S7. Objetivos, narrativa y bloqueadores

- [ ] Generalizar el runtime declarativo.
- [ ] Añadir rutas de éxito, fallo recuperable y decisión persistente.
- [ ] Mantener estado al cambiar de zona y cargar partida.

### S8. Progresión y XP

- [ ] Definir tabla versionada de experiencia.
- [ ] Implementar dos hitos.
- [ ] Hacer recompensas idempotentes.

### S9. Loot e inventario

- [ ] Implementar definiciones e instancias de objetos.
- [ ] Añadir apilado, capacidad, recoger, usar, equipar y descartar.
- [ ] Proteger recompensas con claves únicas.

### S10. NPCs y diálogos

- [ ] Añadir disponibilidad, diálogos y relaciones mínimas.
- [ ] Persistir consecuencias de conversaciones.

### S11. Encuentro, derrota y reset

- [ ] Implementar encuentro determinista de duración limitada.
- [ ] Añadir ataque, defensa, daño, retirada y derrota.
- [ ] Restaurar checkpoints sin duplicar recompensas.

### S12. Campaña integrada

- [ ] Integrar onboarding, zonas, NPCs, encuentro, loot y final.
- [ ] Validar una ruta principal y una decisión alternativa.
- [ ] Completar la campaña con los tres arquetipos.

### S13. UX, accesibilidad y balance

- [ ] Explicar controles, checks, objetivos, inventario, guardado y derrota.
- [ ] Verificar navegación por teclado y foco.
- [ ] Medir primera interacción, recompensa, derrota y finalización.

### S14. Observabilidad y hardening

- [ ] Añadir diagnóstico local de carga, validación y rendimiento.
- [ ] Revisar límites de JSON, guardados y comandos.
- [ ] Mantener telemetría desactivada por defecto si requiere envío.

### S15. Entrega del MVP

- [ ] Completar QA de montaje, desmontaje, resize, carga, derrota y reset.
- [ ] Validar contenido desde entorno limpio.
- [ ] Medir rendimiento en hardware objetivo.
- [ ] Ejecutar `npm run lint`, `npm test` y `npm run build`.

## Estado actual

- [x] Demo vertical jugable.
- [x] Proximidad y objetivos del demo.
- [x] Reset e integración visual de estados.
- [x] S0. Contrato de estado y reglas de transición.
- [x] S1. Estado serializable y límites.
- [x] S2. Validador de contenido.
- [ ] S3. Mapa ampliado y transiciones (fundación implementada).
- [ ] S4. Authoring mínimo de campaña (fundación implementada).
- [ ] S5. Personajes (fundación implementada).
- [ ] S6-S10. Parciales; ver el avance detallado más abajo.
- [ ] S11-S15. Parciales; S11 ya tiene retirada y reset básicos.

## Avance de slices posteriores

Se implementaron los siguientes sub-slices verificables sin declarar completos sus slices de producto:

- [x] **S6:** validar y normalizar sesiones MVP al cargar, migrar campos antiguos del encuentro y conservar el guardado válido si falla una escritura.
- [x] **S6:** validar y normalizar sesiones MVP al cargar, migrar campos antiguos del encuentro, conservar el guardado válido si falla una escritura y añadir guardado manual.
- [x] **S7:** evitar que un check resuelto vuelva a aplicar efectos, conservar zonas visitadas y añadir evaluador genérico de requisitos/efectos.
- [x] **S8:** usar una tabla versionada de XP, hacer idempotentes los milestones y sincronizar nivel/recompensas del personaje.
- [x] **S9:** mantener cantidades de inventario coherentes, mostrar capacidad, proteger objetos de misión y añadir equipamiento base.
- [x] **S10:** añadir diálogo de Iria como datos dependientes de zona y confianza, con progresión limitada y persistente.
- [x] **S11:** añadir retirada explícita sin recompensas y una decisión de ruta persistente alrededor de Iria.

S6-S10 siguen parciales: faltan guardado manual y checkpoints, runtime declarativo general, tabla de progresión configurable, equipamiento y diálogos definidos desde contenido.

## Integración visual MVP - estado de esta pasada

- [x] Crear y cargar personajes desde perfiles locales.
- [x] Guardar automáticamente personaje y sesión de campaña en `localStorage` versionado por clave.
- [x] Mostrar arquetipo, nivel, XP, mochila y acciones de campaña en la UI.
- [x] Hacer visible una segunda zona y su transición.
- [x] Añadir NPC con relación mínima y una reliquia con recompensa.
- [x] Añadir inventario básico con objeto de misión y consumible.
- [x] Añadir encuentro determinista, daño, victoria, derrota y reintento.
- [x] Añadir onboarding, foco visible, feedback de errores y `prefers-reduced-motion`.
- [x] Completar QA manual de navegador, lifecycle, responsive y estados visuales.
- [x] Instrumentar FPS, frame time, frames lentos, draw calls, triángulos, geometrías y texturas en desarrollo.
- [ ] Unificar completamente el personaje con `GameState` y checks d20 del altar.
- [ ] Cargar/desmontar `GameScene` desde JSON por zona sin decoración hardcoded.
- [ ] Implementar guardado manual, autosave por checkpoint y recuperación atómica del estado completo.
- [ ] Añadir runtime declarativo genérico para NPCs, loot, encuentros y narrativa.
- [x] Completar QA de navegador y lifecycle.
- [ ] Completar balance de los tres arquetipos y medición en hardware objetivo.
