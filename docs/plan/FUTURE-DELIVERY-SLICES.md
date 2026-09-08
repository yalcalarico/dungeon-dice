# Slices de entrega futura

## 1. Cómo usar este roadmap

Cada slice produce una capacidad pequeña, demostrable y potencialmente integrable. Los slices deben implementarse en orden de dependencia, pero un slice no debe esperar a que esté terminado todo el MVP para poder probarse. La simulación y las reglas deben permanecer independientes de React y Three.js.

Los criterios de aceptación son condiciones de salida, no ideas de backlog. Todo slice que cambie un contrato de datos debe actualizar su esquema, migración o fixture y añadir tests. La integración visual debe incluir una prueba manual de montaje, desmontaje y reinicio.

## 2. Dependencias globales

```text
S0 contrato base
  -> S1 estado serializable
  -> S2 validación de contenido
  -> S3 mapa ampliado
  -> S4 authoring de campaña

S1 + S2
  -> S5 personajes
  -> S6 guardado y carga
  -> S7 objetivos, checks y bloqueadores

S5 + S7
  -> S8 progresión y XP
  -> S9 loot e inventario

S7 + S9
  -> S10 NPCs y diálogos
  -> S11 encuentros y derrota

S6 + S8 + S9 + S11
  -> S12 campaña integrada
  -> S13 onboarding, accesibilidad y balance
  -> S14 observabilidad y hardening

S12 + S13 + S14
  -> S15 entrega single-player del MVP

S15
  -> roadmap largo: backend, publicación, contenido comunitario y multiplayer
```

## 3. Slices del MVP

### S0. Contrato de estado y reglas de transición

**Dependencias:** demo actual.

**Entrega:** definir comandos, eventos, IDs estables, snapshots, estados de campaña, personaje, zona y resultado. Separar simulación, presentación y persistencia. Documentar qué puede reiniciarse y qué es irreversible.

**Criterios de aceptación:**

- Una secuencia de comandos produce el mismo estado final en dos ejecuciones.
- React y Three.js consumen el mismo estado sin modificarlo directamente.
- Existen estados explícitos para jugando, victoria, derrota, pausa, cargando y error.
- Los comandos inválidos no mutan el estado.
- Hay tests para transición normal, transición abortada y reset de snapshot.

### S1. Estado serializable y límites de seguridad

**Dependencias:** S0.

**Entrega:** definir esquema versionado para estado de sesión, límites de tamaño y validación sin ejecutar código ni interpretar rutas peligrosas.

**Criterios de aceptación:**

- Un estado válido se serializa y deserializa sin pérdida relevante.
- Un estado con cantidades negativas, referencias rotas, profundidad excesiva o campos desconocidos peligrosos se rechaza.
- El esquema tiene versión y una estrategia explícita de migración.
- Los datos de presentación no son necesarios para reconstruir el gameplay.

### S2. Validador de contenido y renderabilidad

**Dependencias:** S0, S1.

**Entrega:** schemas y validador para mapas, zonas, objetos, narrativa, objetivos, checks, bloqueadores, NPCs, encuentros, loot y renderabilidad.

**Criterios de aceptación:**

- Detecta IDs duplicados, referencias inexistentes y ciclos prohibidos.
- Detecta objetivos inalcanzables, bloqueadores sin salida, checks sin resultados y nodos narrativos inaccesibles.
- Detecta geometría, material, escala, colisión o metadatos visuales incompletos.
- Devuelve diagnósticos con archivo, ruta, ID, severidad y solución sugerida.
- Un fixture válido pasa; cada clase de error tiene al menos un fixture inválido.
- El build jugable falla antes de cargar contenido inválido.

### S3. Mapa ampliado y transiciones

**Dependencias:** S1, S2.

**Entrega:** dos o tres zonas conectadas, puntos de entrada, navegación, límites y estado persistente entre escenas.

**Criterios de aceptación:**

- El jugador puede cruzar zonas y volver sin perder objetivos ni NPCs.
- Cada zona tiene fallback de renderizado y puede desmontarse sin recursos huérfanos.
- Los objetos interactivos conservan IDs y estados después de una transición.
- La carga de la escena no bloquea la UI ni permite comandos durante un estado inconsistente.

### S4. Authoring mínimo de campaña

**Dependencias:** S2, S3.

**Entrega:** CLI o UI interna para generar, editar, exportar y validar JSON de una campaña pequeña. Debe incluir fixtures para mapa, objetos, narrativa, objetivos, checks, bloqueadores y renderabilidad.

**Criterios de aceptación:**

- Un autor puede crear una zona y un objetivo sin tocar componentes React.
- La exportación es determinista y contiene versión de esquema.
- Un error bloquea la exportación jugable y señala el recurso exacto.
- El contenido exportado se carga en una escena real y no solo en un test del validador.
- Se puede modificar un texto, dificultad o recompensa y observar el cambio después de regenerar.

### S5. Creación y carga de personajes

**Dependencias:** S1, S2.

**Entrega:** tres arquetipos configurables, creación, nombre, aspecto procedural, atributos iniciales, habilidad y selección de personaje local.

**Criterios de aceptación:**

- Los tres arquetipos se diferencian en al menos dos reglas verificables.
- Datos incompletos o fuera de rango no crean personajes.
- Crear una partida produce un personaje único dentro del perfil seleccionado.
- Cargar un personaje muestra sus datos y permite continuar en la zona correcta.
- El flujo funciona con teclado, foco visible y etiquetas accesibles.

### S6. Guardado local, carga y migración

**Dependencias:** S1, S3, S5.

**Entrega:** perfiles locales, guardado manual, autosave, carga atómica, versionado, migración, abandono y recuperación.

**Criterios de aceptación:**

- Se puede cerrar y abrir el navegador y continuar desde el último punto seguro.
- Un guardado corrupto no sobrescribe el último guardado válido.
- Una migración conocida conserva personaje, objetivos, inventario y ubicación.
- Cargar dos veces no duplica entidades ni recompensas.
- La UI distingue guardado en progreso, éxito, error y ausencia de partida.

### S7. Objetivos, narrativa, checks y bloqueadores

**Dependencias:** S2, S3, S5.

**Entrega:** runtime declarativo de objetivos, diálogos, checks d20, condiciones, efectos y puertas de progreso.

**Criterios de aceptación:**

- Un objetivo puede estar pendiente, activo, completado, fallido o abandonado.
- Un bloqueador comunica requisito y ofrece una ruta de resolución válida.
- Un check aplica resultado, modificador, coste y consecuencias una sola vez.
- El estado se conserva al cambiar de zona y cargar partida.
- Hay una ruta de éxito, una ruta de fallo recuperable y una decisión con consecuencia posterior.

### S8. Progresión, XP y milestones

**Dependencias:** S5, S7, S6.

**Entrega:** tabla de XP, hitos, nivel, mejoras y recompensas de progresión definidos por contenido.

**Criterios de aceptación:**

- Los eventos definidos otorgan XP de forma idempotente.
- Repetir un check, recargar o reintentar no duplica XP.
- La pantalla de progreso explica origen, cantidad y próximo hito.
- Los tres arquetipos pueden alcanzar los hitos de la campaña.
- Cambiar la tabla versionada no invalida silenciosamente un personaje ya creado.

### S9. Loot e inventario foundation

**Dependencias:** S2, S6, S8.

**Entrega:** definiciones e instancias de objetos, apilado, capacidad, recoger, inspeccionar, usar, equipar, descartar y recompensas transaccionales.

**Criterios de aceptación:**

- Las cantidades nunca son negativas y los límites se aplican igual en UI y simulación.
- Una recompensa tiene clave única y no se entrega dos veces por recarga o reintento.
- Un consumible usado cambia el estado y se guarda.
- Un objeto de misión no puede descartarse si una condición lo necesita.
- El inventario es navegable por teclado y anuncia cambios relevantes.

### S10. NPCs y diálogos con estado

**Dependencias:** S4, S7, S6.

**Entrega:** NPCs declarativos, disponibilidad, diálogo, relación mínima y efectos persistentes.

**Criterios de aceptación:**

- Un NPC ofrece diálogo distinto según al menos un flag u objetivo.
- Una conversación puede iniciar y terminar sin dejar el estado bloqueado.
- Sus cambios sobreviven a una transición y a una carga.
- Un NPC ausente o mal referenciado produce diagnóstico de contenido, no un crash.

### S11. Encuentro, derrota y reset

**Dependencias:** S7, S8, S9.

**Entrega:** encuentro hostil corto, fases o turnos, acciones, IA simple, victoria, retirada, derrota y restauración.

**Criterios de aceptación:**

- Las acciones de combate usan el mismo estado, dados y comandos que el resto del juego.
- Victoria, retirada y derrota son resultados distintos y verificables.
- La derrota ofrece reintentar, volver al checkpoint o cargar.
- El reset elimina efectos temporales, acciones pendientes y entidades generadas del encuentro.
- Ni derrota ni interrupción conceden recompensas de victoria.
- Todos los listeners y loops del encuentro se limpian al salir.

### S12. Campaña integrada y rutas de recompensa

**Dependencias:** S3, S4, S6, S8, S9, S10, S11.

**Entrega:** campaña de 2 o 3 zonas con onboarding, objetivos, NPCs, un encuentro, loot, progresión, ruta alternativa y final.

**Criterios de aceptación:**

- Un jugador nuevo puede completar la ruta sin herramientas de desarrollo.
- Existe al menos una decisión que cambia un NPC, bloqueador, recompensa o final posterior.
- Cada arquetipo tiene una solución viable a la ruta principal.
- La campaña se puede reiniciar completamente sin residuos de la partida anterior.
- Un playthrough de éxito y uno de derrota quedan cubiertos por pruebas de integración o checklist reproducible.

### S13. Onboarding, accesibilidad y balance

**Dependencias:** S12.

**Entrega:** tutorial contextual, ayuda, feedback de reglas, navegación accesible, configuración básica y primera pasada de balance.

**Criterios de aceptación:**

- El jugador entiende movimiento, interacción, check, objetivo, inventario, guardado y derrota antes de necesitarlos.
- Todo flujo crítico funciona sin ratón y con foco visible.
- No se comunica información esencial solo con color, sonido o animación.
- Se registran y revisan tiempo hasta primera interacción, primera recompensa y primera derrota.
- Las tres clases superan la campaña en pruebas de balance internas sin una opción claramente dominante.

### S14. Telemetría local, diagnóstico y hardening

**Dependencias:** S1, S2, S6, S12.

**Entrega:** eventos opt-in o locales, límites de payload, logs de diagnóstico, detección de errores de contenido y revisión de fronteras de seguridad.

**Criterios de aceptación:**

- La telemetría está desactivada por defecto cuando implica envío y no incluye texto libre ni nombres.
- Los eventos no alteran el resultado de una partida y toleran fallos de instrumentación.
- Se registran errores de carga, migración, validación, renderizado y rendimiento con contexto técnico mínimo.
- JSON, guardados y comandos tienen límites de tamaño, profundidad y cantidad.
- No se ejecuta código ni markup no confiable desde contenido.

### S15. Entrega single-player del MVP

**Dependencias:** S12, S13, S14.

**Entrega:** build reproducible, campaña incluida, checklist de QA, documentación de ejecución y definición de soporte de navegador.

**Criterios de aceptación:**

- `npm run lint`, `npm test` y `npm run build` pasan en limpio.
- El contenido distribuido pasa el validador desde un entorno limpio.
- Se verifica montaje, desmontaje, resize, cambio de zona, guardado, carga, derrota y reinicio.
- Se mide el presupuesto de rendimiento en el hardware objetivo y no se aceptan regresiones sin decisión registrada.
- El juego funciona sin red y no exige cuenta.
- Existe una lista de riesgos conocidos y ninguna funcionalidad obligatoria queda simulada únicamente con texto.

## 4. Roadmap largo después del MVP

### L1. Backend autoritativo y sincronización de perfiles

**Dependencias:** S15, historial de comandos, esquema de estado versionado.

**Entrega:** cuentas opcionales, perfiles remotos, guardado sincronizado y validación de comandos en servidor.

**Aceptación:** el servidor rechaza inventarios, tiradas, posiciones y recompensas no válidos; migraciones y recuperación están probadas; los datos públicos, privados y administrativos están separados.

### L2. Publicación y catálogo de contenido

**Dependencias:** S2, S4, S15, L1.

**Entrega:** paquetes de contenido versionados, revisión, firma o integridad, compatibilidad y rollback.

**Aceptación:** una versión inválida no se publica; una campaña puede instalarse, actualizarse y revertirse sin perder partidas compatibles; el cliente no ejecuta contenido como código.

### L3. Editor visual de niveles y narrativa

**Dependencias:** S4, L2.

**Entrega:** colocación visual, preview, edición de conexiones, diálogos, objetivos, checks, bloqueadores y renderabilidad.

**Aceptación:** el editor genera el mismo contrato JSON que la CLI; todas las referencias se validan antes de exportar; existe preview de cada zona y diagnóstico de entidades no renderizables.

### L4. RPG avanzado y economía controlada

**Dependencias:** S8, S9, S11, L1.

**Entrega:** más habilidades, estados, equipamiento, crafting o comerciantes solo si los datos de balance y la autoridad del servidor lo soportan.

**Aceptación:** cada regla tiene tests, límites de frecuencia y protección contra duplicación; se pueden recalcular estadísticas; la economía no depende de valores enviados por el cliente.

### L5. Cooperativo pequeño

**Dependencias:** L1, L4, comandos deterministas, resolución autoritativa.

**Entrega:** sesiones de 2 a 4 jugadores, invitación, sincronización, turnos compartidos, reconexión y salida segura.

**Aceptación:** todos observan el mismo resultado de tiradas y narrativa; acciones simultáneas se resuelven de forma definida; abandonar o reconectar no duplica recompensas ni bloquea la sesión.

### L6. Operación, moderación y privacidad

**Dependencias:** L1, L2, L5.

**Entrega:** monitorización, alertas, backups, retención, controles de contenido, reportes y soporte operativo.

**Aceptación:** se puede detectar y recuperar un fallo de servicio; existe política de privacidad; contenido reportado puede aislarse; los datos personales tienen límites de acceso y retención.

### L7. Expansión de campañas y contenido comunitario

**Dependencias:** L2, L3, L6.

**Entrega:** más campañas, eventos opcionales, editor público y catálogo curado.

**Aceptación:** los paquetes pasan validación, revisión de seguridad, compatibilidad y moderación; una campaña defectuosa no impide iniciar las demás; las recompensas no pueden crear ventajas no autorizadas.

## 5. No comprometer todavía

- Multiplayer masivo, mundo persistente y matchmaking.
- Generación infinita de mapas o narrativa.
- Tienda, ranking y economía con valor competitivo.
- IA generativa necesaria para crear o jugar contenido.
- Editor público sin validación, firma y moderación.

Estas ideas solo se retoman cuando las dependencias anteriores estén satisfechas y exista una decisión explícita de producto, seguridad y coste operativo.
