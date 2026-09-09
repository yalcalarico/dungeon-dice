# Resume de sesión

Fecha: 2026-09-08
Proyecto: `dungeon-dice`
Branch: `feat/mvp-completion-slices`

## Estado Git y PR

- Branch publicado en `origin`.
- PR abierto contra `main`: https://github.com/yalcalarico/dungeon-dice/pull/4
- PR: `Feat: completar migración declarativa y campaña MVP`.
- Estado del PR: `OPEN`.
- Estado de merge: sin conflictos (`CLEAN`).
- No se hizo merge.
- Working tree limpio al crear este documento.

## Objetivo de este bloque

Completar la migración principal del MVP hacia contenido declarativo, consolidar la campaña single-player y corregir la regresión visual/interactiva que apareció después de la migración.

## Trabajo completado

### Contenido y campaña declarativa

- Añadido `src/content/crypt-of-lunargenta.json` como configuración de la Cripta.
- Añadido `src/content/ashen-courtyard.json` como segunda zona.
- Añadido `src/content/campaign-map.json` con mapa versionado, entradas, salidas y conexiones.
- Añadido `src/content/campaign.ts` como catálogo de niveles.
- `GameScene` construye zonas, objetos, NPCs, reliquias y enemigos desde configuración.
- `App` y `mvp/campaign.ts` consumen metadatos declarativos.
- Labels, keywords, dificultad, checks, objetivos, efectos, mensajes, recompensas y rutas se consumen desde datos cuando existe contrato.
- Se eliminaron labels, posiciones, stats, recompensas y diálogos de campaña hardcodeados en los principales puntos de producción.
- Se añadieron validación, exportación y carga de mapas JSON versionados.

### Runtime y reglas

- Añadido runtime genérico para requisitos y efectos.
- Añadidos objetivos, bloqueadores, rutas alternativas y consecuencias persistentes.
- Añadidos checkpoints, progresión, XP, inventario, diálogos y combate parametrizado.
- Añadida retirada explícita sin recompensas de victoria.
- Añadida validación/hardening de JSON, comandos, guardados y límites de entrada.
- Añadida persistencia y sincronización de estado de personaje, campaña y sesión.

### Interacción y escena

- Corregida la regresión de interacción causada por mezclar IDs físicos de objetos con IDs de entidades.
- La proximidad ahora publica los IDs declarados en JSON, por ejemplo `altar-main`, `iria-object`, `courtyard-relic-object` y `ash-sentinel-object`.
- La selección visual de enemigos mantiene su ID de entidad separado.
- Corregida la puerta de la Cripta que estaba fuera del mapa: pasó de `z: -7.06` a `z: -5.4`.
- Ajustados los límites de la Cripta para incluir las antorchas colocadas en el borde.
- Añadido test que verifica que los objetos de las zonas estén dentro de sus bounds jugables.

### Documentación y calidad

- Actualizados los documentos de contenido, personajes, rendimiento, QA y ejecución del MVP.
- Añadidos tests para balance, diálogos, runtime, loader, estado, sincronización, progresión, seguridad y configuración de niveles.
- No se incorporaron assets externos ni se añadió dependencia de red para jugar.

## Commits principales del bloque

- `60422b1` `feat: advance declarative campaign foundations`
- `d7e017f` `feat: add campaign routes and encounter retreat`
- `428e21b` `feat: add checkpoints and route outcomes`
- `75f8271` `feat: apply declarative spatial requirements`
- `5092464` `feat: validate campaign maps and unify character state`
- `a23e64c` `docs: track campaign completion progress`
- `a00b3ae` `feat: harden content, state and delivery contracts`
- `8f9e93f` `feat: complete route consequences and archetype balance`
- `7aff8e2` `docs: record content parametrization gaps`
- `2e17247` `feat: complete declarative campaign migration`
- `bd4150e` `feat: finalize declarative content runtime`
- `48c3d66` `fix: align declarative interaction IDs`
- `e2afadf` `fix: keep crypt interactions inside bounds`

## Verificaciones actuales

- `npm test`: 23 archivos, 89 tests pasando.
- `npm run lint`: correcto con Oxlint.
- `npm run build`: correcto con TypeScript y Vite.
- El build mantiene la advertencia conocida de Vite porque el chunk principal supera `500 kB`:
  - Aproximadamente `836.55 kB` minificado.
  - Aproximadamente `225.11 kB` gzip.
- No hay errores de compilación ni de lint conocidos.
- La suite automatizada no sustituye la verificación manual de navegador, WebGL, lifecycle y hardware real.

## Slices del MVP

En el roadmap del proyecto se usa el término **slice**. La solicitud mencionó “slides”; se interpreta como los slices de entrega documentados en `docs/plan/MVP-EXECUTION.md` y `docs/plan/FUTURE-DELIVERY-SLICES.md`.

### S0. Contrato de estado y reglas de transición

Estado: **completado en la base actual**.

- Comandos y estados definidos.
- Separación entre estado de gameplay, presentación e historial de sesión.
- Snapshots, restauración y reset.
- Rechazo de comandos inválidos.
- Tests de transiciones principales.

### S1. Estado serializable y límites

Estado: **completado en la base actual**.

- Envelope versionado.
- Validación de tipos, rangos, cantidades y referencias.
- Límites de tamaño/profundidad.
- Migración desde estado legacy.
- Tests de round-trip, corrupción, límites y migración.

### S2. Validador de contenido

Estado: **completado para el contrato actual; ampliable**.

- Validación de IDs, referencias y entidades renderizables.
- Diagnósticos de archivo, ruta, severidad y solución.
- Fixtures válidos e inválidos.
- Bloqueo de carga de contenido inválido.

Pendiente: extender de forma completa los contratos de NPCs, encuentros, loot, ciclos narrativos y catálogo visual.

### S3. Mapa ampliado y transiciones

Estado: **parcial avanzado**.

Completado:

- Dos zonas declarativas conectadas.
- Entradas, salidas y conexiones versionadas.
- Transiciones y persistencia de zona visitada.
- Montaje de zonas desde configuración en `GameScene`.

Pendiente:

- QA manual de cambio de zona, desmontaje y reinicio repetidos.
- Evidencia de que no quedan recursos huérfanos en todas las rutas.

### S4. Authoring mínimo de campaña

Estado: **parcial**.

Completado:

- Exportación interna.
- JSON determinista y versionado.
- Loader y validación.
- Contenido exportado cargado en la escena real.

Pendiente:

- Exponer la herramienta como CLI estable.
- Añadir fixtures y flujo de edición completo para todos los contratos.

### S5. Personajes

Estado: **parcial avanzado**.

Completado:

- Tres arquetipos: Vanguardia, Explorador y Canalizador.
- Fuente de atributos unificada.
- HP, MP, nivel, XP y habilidad inicial.
- Validación y creación local.

Pendiente:

- Pantallas completas de creación/selección.
- Perfil local de personaje separado y flujo completo de carga.
- Balance verificado de los tres arquetipos en hardware y campaña real.

### S6. Guardado y carga

Estado: **parcial avanzado**.

Completado:

- Sesión versionada y persistencia local.
- Validación y normalización al cargar.
- Migración de campos antiguos.
- Guardado manual y conservación del guardado válido si falla una escritura.
- Checkpoints básicos.

Pendiente:

- Perfiles locales separados.
- Autosave por checkpoint completamente integrado.
- Guardado atómico del estado completo.
- Recuperación y migraciones cubiertas de extremo a extremo.
- Prueba de no duplicación de entidades/recompensas en todos los flujos.

### S7. Objetivos, narrativa, checks y bloqueadores

Estado: **parcial avanzado**.

Completado:

- Evaluador genérico de requisitos y efectos.
- Objetivos, checks y consecuencias persistentes.
- Rutas de éxito, fallo recuperable y decisiones persistentes.
- Estado conservado entre zonas.

Pendiente:

- Generalizar todos los flujos de NPC, loot, encuentros y narrativa sin reglas específicas restantes.
- Asegurar que la proximidad y los requisitos espaciales formen parte del comando/estado, no solo de la capa visual.
- Cubrir todos los casos con tests de integración UI/estado.

### S8. Progresión, XP y milestones

Estado: **parcial avanzado**.

Completado:

- Tabla versionada de XP.
- Milestones idempotentes.
- Sincronización de nivel y recompensas.

Pendiente:

- Dos hitos completos verificables en la campaña.
- Balance de los tres arquetipos y prueba de que todos alcanzan los hitos.
- UI completa que explique origen de XP y próximo hito.

### S9. Loot e inventario

Estado: **parcial avanzado**.

Completado:

- Cantidades coherentes y capacidad.
- Objeto de misión y consumible.
- Equipamiento base.
- Protección de recompensas con claves únicas.

Pendiente:

- Contrato completo de definiciones/instancias de objetos.
- Recoger, inspeccionar, usar, equipar y descartar totalmente declarativos.
- Navegación por teclado y anuncios accesibles de cambios.

### S10. NPCs y diálogos

Estado: **parcial avanzado**.

Completado:

- Diálogo de Iria dependiente de zona, confianza y progreso.
- Consecuencias persistentes.
- NPCs representados desde configuración en la escena.

Pendiente:

- Disponibilidad y diálogo genéricos para cualquier NPC del catálogo.
- Diagnóstico completo de NPCs ausentes o mal referenciados.
- Integración total con todas las rutas de campaña.

### S11. Encuentro, derrota y reset

Estado: **parcial avanzado**.

Completado:

- Encuentro determinista corto.
- Daño, victoria, derrota y retirada.
- Reset y checkpoints básicos.
- Retirada sin recompensa de victoria.

Pendiente:

- Garantizar limpieza completa de listeners, loops y entidades generadas.
- Cubrir derrota, reintento y restauración con pruebas de integración visual.
- Verificar que nunca se dupliquen recompensas después de recargar o reintentar.

### S12. Campaña integrada

Estado: **parcial avanzado**.

Completado:

- Dos zonas y transiciones.
- Onboarding, NPC, reliquia, inventario y encuentro.
- Ruta `relic` y ruta `direct` con consecuencias distintas.
- Progresión y final de campaña declarativos en gran parte.

Pendiente:

- Playthrough completo reproducible con los tres arquetipos.
- Checklist manual de éxito y derrota desde navegador.
- Eliminar los últimos flujos específicos que aún dependan de reglas hardcoded.

### S13. Onboarding, accesibilidad y balance

Estado: **parcial**.

Completado:

- Menú, foco visible, Escape y feedback básico.
- Soporte de `prefers-reduced-motion`.
- Balance inicial de arquetipos en reglas.

Pendiente:

- Auditoría WCAG completa.
- Navegación completa por teclado y foco en todos los flujos.
- Validación a 320 px, Safari, Chromium y lector de pantalla.
- Medición de primera interacción, recompensa, derrota y finalización.
- Balance validado mediante sesiones reproducibles.

### S14. Observabilidad y hardening

Estado: **parcial avanzado**.

Completado:

- Diagnósticos locales de FPS, frame time, frames lentos, draw calls, triángulos, geometrías y texturas.
- Límites y validación de JSON, comandos y guardados.
- Telemetría de red no requerida.

Pendiente:

- Medición reproducible en hardware de referencia y GPU integrada.
- Aplicar realmente todos los presets de calidad, incluidos charcos/reflejos y efectos costosos.
- Documentar métricas de memoria, bundle y perfiles comparables.

### S15. Entrega single-player del MVP

Estado: **no cerrado**.

Completado:

- `npm run lint`, `npm test` y `npm run build` pasan.
- Build reproducible sin red para jugar.
- Documentación base y PR creado.

Pendiente:

- QA manual final versionado y reproducible.
- Montaje, desmontaje, resize, cambio de zona, guardado, carga, derrota y reset en navegador.
- Validación desde entorno limpio.
- Medición de rendimiento en hardware objetivo.
- Lista final de riesgos y decisión sobre el warning de bundle.

## Pendientes técnicos prioritarios

1. Ejecutar y registrar QA manual de navegador, incluyendo Safari, Chromium, pantalla pequeña, resize, foco, lector de pantalla y ausencia de WebGL.
2. Verificar montaje/desmontaje repetido y liberar todos los listeners, RAF, geometrías, materiales, luces, pools y renderer.
3. Confirmar que todas las acciones requieren proximidad y requisitos del estado, no solo validación visual.
4. Mostrar y probar el input libre de acciones si sigue siendo requisito del producto.
5. Completar reset desde UI restaurando flags, HP/MP, historial, objetivos, checks, fase, movimiento y dado.
6. Completar estados visuales de antorcha encendida, puerta abierta, victoria y fallo.
7. Medir draw calls, triángulos, memoria, frame time y bundle en hardware objetivo.
8. Aplicar y medir presets de calidad adaptativa.
9. Terminar la generalización declarativa de NPCs, loot, encuentros, narrativa y un segundo nivel completamente configurable.
10. Añadir CLI de authoring y catálogo visual versionado si se mantiene dentro del alcance del MVP.

## Slices futuros después del MVP

Estos no forman parte del cierre inmediato y todavía no deben implementarse sin decisión explícita:

- **L1. Backend autoritativo y sincronización de perfiles:** cuentas opcionales, perfiles remotos, guardado sincronizado y validación de comandos en servidor.
- **L2. Publicación y catálogo de contenido:** paquetes versionados, revisión, integridad, compatibilidad y rollback.
- **L3. Editor visual de niveles y narrativa:** edición visual de zonas, conexiones, diálogos, objetivos, checks y renderabilidad.
- **L4. RPG avanzado y economía controlada:** habilidades, estados, equipamiento, crafting o comerciantes con balance y autoridad de servidor.
- **L5. Cooperativo pequeño:** sesiones de 2 a 4 jugadores, sincronización, reconexión y salida segura.
- **L6. Operación, moderación y privacidad:** monitorización, backups, retención, controles y soporte operativo.
- **L7. Expansión de campañas y contenido comunitario:** más campañas, editor público y catálogo curado.

## No comprometer todavía

- Multiplayer masivo, mundo persistente y matchmaking.
- Generación infinita de mapas o narrativa.
- Tienda, ranking o economía competitiva.
- IA generativa necesaria para crear o jugar contenido.
- Editor público sin validación, firma y moderación.

## Riesgos conocidos

- El bundle principal supera el umbral de advertencia de Vite.
- Three.js y la escena no tienen todavía una estrategia completa de code splitting.
- El rendimiento real en hardware de referencia todavía no está demostrado.
- El catálogo visual y algunos flujos de contenido aún no son completamente genéricos.
- La auditoría histórica de `docs/plan/DEMO-AUDIT.md` contiene estados anteriores a los últimos commits; debe contrastarse con el código actual antes de usarla como checklist final.

## Próxima sesión recomendada

1. Revisar el PR #4 y resolver comentarios o checks de CI.
2. Ejecutar el checklist manual final en navegador.
3. Registrar resultados de rendimiento y lifecycle.
4. Corregir bloqueadores que aparezcan en QA.
5. Actualizar este archivo y los documentos de planificación antes del merge.
