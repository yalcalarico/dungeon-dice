# Auditoría del primer demo

**Fecha de auditoría:** 2026-09-08  
**Alcance:** `MASTER-PLAN.md`, `AGENTS.md`, documentación de arquitectura y áreas, README, scripts, código de `src/` y tests existentes.  
**Resultado:** no declarar el demo completo todavía.

## Evidencia de verificación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| `npm run lint` | Completado | `oxlint` termina sin errores. |
| `npm run build` | Completado con riesgo | TypeScript y Vite terminan; Vite advierte un chunk minificado de `776.53 kB` (>500 kB). |
| `npm test` | Completado | 10 archivos y 30 tests pasan. |
| Tests de navegador, WebGL y lifecycle visual | No ejecutados | No existe suite E2E ni checklist ejecutado en el repositorio. |
| Rendimiento objetivo | No demostrado | Hay FPS/frame time del loop, pero no medición documentada del hardware de referencia, draw calls, triángulos, memoria o bundle. |

## Matriz de cumplimiento

Estados: **Completado** = evidencia suficiente; **Parcial** = existe una base, pero no satisface el contrato; **Faltante** = no hay implementación o evidencia.

| Área / requisito | Estado | Evidencia factual |
|---|---|---|
| React 19, TypeScript estricto, Vite, Three.js | Completado | `package.json`, `tsconfig.json`, `src/main.tsx`; build correcto. |
| Escena procedural y cámara ortográfica | Parcial | `GameScene.ts` crea cripta, cámara, iluminación, niebla y seguimiento; no está separado `WorldBuilder` y parte del contenido permanece específico de la cripta. |
| Movimiento WASD con `deltaTime` y límites | Parcial | `GameScene.ts:256-257` usa `delta`; hay bounds y colisiones AABB, pero no hay test de movimiento ni prueba manual registrada. |
| Rotación por arrastre y zoom | Parcial | Implementados en `GameScene.ts:250-254`; no hay verificación de límites, resize ni pantallas pequeñas. |
| Ignorar teclado mientras se escribe | Faltante crítico | `GameScene.ts:247-249` escucha todo `keydown`; no filtra `input`, `textarea` ni elementos editables. |
| Limpieza de listeners y loop | Parcial | `destroy()` elimina listeners y cancela RAF (`GameScene.ts:76-93`), pero falta una prueba real de montaje/desmontaje repetido. |
| Liberación de geometrías, materiales y luces | Faltante crítico | Solo se disponen `ownedGeometries`/`ownedMaterials`; varias luces, materiales y geometrías creados en `buildWorld`, `block`, altar, antorchas y jugador no se registran. |
| Estado central React/Three.js | Parcial | `App` y `game-state` centralizan el estado narrativo; la escena conserva posición del jugador e interacción en Three.js y no emite eventos de movimiento al estado. |
| Reinicio sin recargar | Faltante | `resetSession` existe y tiene test, pero `App` no lo usa y el menú no muestra un botón de reinicio. |
| Ruta de éxito altar -> antorcha -> puerta | Parcial | La transición lógica tiene test y termina en `victory`; no se probó completa en navegador y la escena no cambia visualmente la puerta al abrirse. |
| Ruta de fallo significativa y recuperable | Parcial/bloqueada | El d20 natural 1 produce `failure` y permite reintento con HP; sin embargo el JSON declara `continue: true`, mientras `altar.ts:166` produce outcome terminal y solo ofrece `retry-altar`, no antorchas. La documentación exige continuar hacia las antorchas tras el fallo. |
| Acciones sugeridas contextuales | Parcial | El prompt depende de proximidad, pero `App` filtra por nombres hardcodeados (`App.tsx:93-97`) y no usa `availableActionIds` del objetivo. |
| Acciones escritas equivalentes | Parcial | El parser normaliza acentos y keywords; `transitionGameState` no recibe posición ni objetivo, así que puede ejecutar acciones espaciales desde cualquier lugar. |
| Acciones inválidas | Completado en lógica aislada | `altar.test.ts`/`game-state.integration.test.ts` comprueban respuesta; falta integración UI y prueba de que no mutan todo el estado relevante. |
| D20, modificadores y críticos | Parcial | `d20.ts` y tests cubren semillas, críticos y resolución; el check del altar usa `modifier: 0` fijo y no existe configuración real de atributos de personaje. |
| Flags, objetivos y checks observables | Parcial | El estado y panel existen; hay flags del altar/antorcha, pero `exitOpened` declarado en JSON no se aplica, y el runtime no interpreta genéricamente efectos u objetivos. |
| Contenido JSON validado | Parcial | `level-loader.ts` valida esquema y referencias, y el JSON carga; `altar.ts`, `GameScene.ts` y `App.tsx` siguen conteniendo reglas, posiciones, IDs y texto específicos. |
| Runtime declarativo reutilizable | Faltante | No hay evaluador genérico de requisitos/efectos, grafo narrativo, exportación, migraciones, catálogo visual ni segundo nivel. Esto es explícitamente pendiente en `docs/areas/content/README.md`. |
| Ambiente procedural | Parcial | Lluvia en pool, charcos y flicker de antorchas existen; reflejos aproximados no existen y no hay medición antes/después ni estados visuales de flags. |
| Calidad adaptativa | Parcial | `QualityController` tiene tests y cambia pixel ratio, sombras y lluvia; `puddles`/`reflections` no se aplican al renderer, no se valida el coste y no hay perfiles de hardware. |
| Objetivo de rendimiento | Faltante | El tracker solo calcula FPS/frame time. No registra draw calls, triángulos, memoria ni resultados reproducibles; tampoco se demuestra `<=16,7 ms`, `<100` draw calls o ~150.000 triángulos. |
| UI funcional y accesible | Parcial | Hay foco visible, Escape, menú, historial, objetivos y `lang` español; contraste, lector de pantalla, foco completo, 320 px y móvil no están validados. |
| Input libre en la demo | Faltante en producto | `App.css:47` oculta `.action-form`, por lo que el criterio de escribir acciones no está disponible en la interfaz aunque el reducer lo soporte. |
| Tests unitarios e integración | Parcial | Dados, parser, interacción, loader, estado, sesión y rendimiento tienen tests. Faltan tests de requisitos/efectos genéricos, fallo conforme a contrato, reset desde UI, acciones por proximidad y lifecycle/escena. |
| Assets externos y conexión | Completado | No se observan descargas ni `fetch`; los recursos son geometría/procedimiento local. `hero.png` y SVG de plantilla existen, pero no son usados por la escena. |
| README reproducible | Parcial | Incluye instalación y comandos; afirma que narrativa/estado/interacciones siguen en construcción y no documenta definición de hardware, QA manual, bundle ni limitaciones actuales. |

## Bloqueadores críticos

1. **La interacción espacial no es una regla del estado.** `transitionGameState` resuelve texto sin posición ni `targetId`; por tanto se puede encender la antorcha o abrir la salida desde cualquier lugar mediante texto. Esto contradice `MASTER-PLAN.md` y los criterios de gameplay/narrativa sobre proximidad y requisitos.
2. **La ruta de fallo no coincide con el contrato declarado.** El JSON declara fallo continuable (`onFailure.continue: true`), pero `resolveAltarAction` marca `failure` y devuelve solo reintento. La documentación del área exige que el jugador pueda continuar a las antorchas tras fallar; la implementación actual obliga a pagar HP y repetir la prueba.
3. **No existe reinicio jugable.** El sistema tiene `resetSession`, pero ningún control lo dispara. No se puede cumplir el criterio observable de reiniciar sin recargar.
4. **El cleanup visual no está completo.** `destroy()` no dispone todos los recursos creados. Montar/desmontar repetidamente puede retener GPU/CPU resources aunque los listeners y RAF sí se limpien.
5. **El rendimiento de entrega no está probado.** El overlay no equivale a una medición de aceptación y el bundle supera el umbral de advertencia de Vite. Faltan métricas mínimas y una referencia reproducible.
6. **La entrada libre requerida está oculta.** La funcionalidad del reducer no es accesible al jugador porque el formulario tiene `display: none`.

## Gaps De QA Manual

El checklist de `docs/areas/qa/README.md` permanece sin marcar para todos los escenarios visuales. Deben ejecutarse y registrar evidencia de:

- Montar y desmontar la escena repetidamente, incluyendo Strict Mode, observando listeners, RAF, memoria y recursos WebGL.
- Completar una ruta de éxito desde el navegador usando proximidad real: altar, tirada, antorcha y puerta.
- Forzar fallo, comprobar el flujo recuperable definido, pagar o no pagar el coste según la regla final y completar la aventura.
- Intentar todas las acciones desde fuera de rango y confirmar que no cambian flags ni recursos.
- Mantener WASD mientras el input tiene foco; escribir una acción sin mover al personaje.
- Probar acciones sugeridas y texto libre con mayúsculas, acentos, sinónimos, entradas vacías e instrucciones imposibles.
- Verificar reset desde la UI y que flags, HP, MP, historial, objetivos y resultados vuelvan al estado inicial.
- Comprobar estados visuales de altar, antorcha encendida, puerta abierta, victoria y fallo.
- Redimensionar, rotar, hacer zoom en sus límites y probar ancho mínimo de 320 px.
- Probar Safari y Chromium, pantalla pequeña, foco de teclado, lector de pantalla, contraste y navegación sin ratón.
- Probar ausencia de WebGL y documentar fallback legible en lugar de una excepción de `WebGLRenderer`.
- Confirmar que ningún botón visible carece de acción real y que los banners de outcome se cierran correctamente.

## Riesgos de rendimiento y estabilidad

- La escena crea muchos `BoxGeometry` y materiales individuales en `block()`; no todos se comparten ni se disponen. El instancing de columnas es una excepción localizada.
- Hay cuatro luces de antorcha con sombras y una luz direccional con mapa de sombras 1024, sin perfil real en GPU integrada.
- La lluvia, niebla, clearcoat, material físico, charcos y sombras se combinan sin medición antes/después.
- El controlador puede seleccionar configuraciones que anuncian quitar charcos/reflejos, pero `GameScene` no aplica esos campos; `reflections` no tiene implementación.
- `PerformanceTracker` calcula FPS medio y frame time, pero no cuenta draw calls, triángulos, memoria ni frames sostenidos por encima de 33 ms como métrica reportable.
- `GameScene` actualiza la posición de lluvia y flicker en cada frame; el coste de esa combinación no está documentado.
- El chunk principal de producción es `776.53 kB` minificado (`208.67 kB` gzip), con advertencia de Vite y sin carga diferida de Three.js/escena.
- `Math.random()` se usa para la fase de las antorchas. No afecta gameplay, pero impide una captura visual reproducible y contradice la expectativa de procedural reproducible cuando se requiera.
- No hay fallback para WebGL ni manejo de error al crear `WebGLRenderer`.

## Contenido hardcodeado restante

El JSON es una fundación válida, pero el runtime no es todavía declarativo. Permanecen hardcodeados:

- Las fases, flags, IDs y reglas del altar en `src/narrative/altar.ts`.
- La transición específica de altar, antorcha y puerta en `src/state/game-state.ts` y `src/narrative/altar.ts`.
- El filtrado por `altar`, `torch-*`, `exit-door` y IDs de acciones en `src/App.tsx:89-101`.
- Posiciones, dimensiones, materiales y composición visual específica en `GameScene.ts`.
- Reglas de movimiento, colliders y construcción de objetos en `GameScene.ts`.
- Textos iniciales, mensajes de éxito/fallo y mensajes de puerta en código, no en JSON.
- El ID runtime `altar` no coincide con el ID JSON `altar-main`.
- La validación permite declarar `requires`, `effects`, `onSuccess` y `onFailure`, pero el runtime no los interpreta genéricamente.
- El objetivo `exitOpened` existe en JSON, pero la victoria se deriva del phase y no de ejecutar el efecto configurado.
- No existe modelo de personaje: HP/MP, atributos, modificadores y recompensas están fijados en `game-state.ts` o ausentes.

## Criterios exactos para declarar el demo completo

Todos deben cumplirse, con evidencia en tests o en un checklist manual versionado:

1. `npm run lint`, `npm run build` y `npm test` pasan sin errores; las advertencias del bundle quedan resueltas o justificadas con tamaño gzip, impacto y decisión documentada.
2. Una persona puede iniciar el proyecto desde el README sin red durante la partida y completar la ruta de éxito en navegador.
3. La ruta de éxito requiere proximidad real a altar, antorcha y puerta; una acción escrita fuera de rango no cambia flags, HP, objetivos ni phase.
4. Existe una ruta de fallo reproducible que cumple exactamente la política elegida y documentada: o continúa a las antorchas, o es terminal con recuperación explícita. El JSON, runtime, UI y tests deben coincidir.
5. Hay al menos un test automatizado de éxito, uno de fallo, uno de acción escrita equivalente a sugerida, uno de acción inválida sin mutación, uno de proximidad/requisito y uno de reset completo.
6. La entrada libre es visible y utilizable; las teclas WASD no actúan mientras el foco está en un elemento editable y las teclas mantenidas se limpian de forma segura.
7. Un control visible reinicia la partida sin recargar y restaura flags, HP/MP, historial, objetivos, checks, phase, movimiento y resultado del dado.
8. `destroy()` libera todos los listeners, RAF, geometrías, materiales, luces, pools y renderer; el montaje/desmontaje repetido queda comprobado manualmente o con una prueba de lifecycle adecuada.
9. La antorcha encendida, puerta abierta, éxito, fallo y victoria tienen estados visuales observables, o se documenta explícitamente que el estado es solo UI y se ajustan los criterios.
10. El modo desarrollo registra de forma reproducible FPS medio/mínimo, frame time, frames >33 ms, draw calls, triángulos, memoria y bundle durante exploración, zoom y rotación.
11. En hardware de referencia y una GPU integrada, la escena cumple `frame time <=16,7 ms` sostenido, alerta >33 ms, `<100` draw calls y aproximadamente `<=150.000` triángulos, o registra una excepción con degradación visual definida que conserva jugabilidad.
12. La calidad adaptativa realmente aplica sus settings y conserva jugabilidad; la lluvia, sombras, charcos y cualquier reflejo tienen coste antes/después documentado.
13. El JSON cargado es la fuente de labels, keywords, posiciones, requisitos, checks, efectos y transiciones de la cripta, o se marca formalmente el alcance de una sola cripta y se eliminan afirmaciones de parametrización no cumplidas.
14. Se ejecuta el checklist manual en Safari y Chromium, pantalla de 320 px, foco/contraste/lector de pantalla, resize, límites de cámara, WebGL ausente y cleanup.
15. Se confirma que no hay assets externos descargados ni descargas implícitas y que el contenido procedural usado en el demo está identificado.

## Recomendaciones por horizonte

### MVP para cerrar el primer demo

- Corregir proximidad y requisitos como comandos/estado, incluyendo objetivo estable y validación de `availableActionIds`.
- Decidir y alinear el fallo recuperable entre JSON, runtime, UI y tests.
- Mostrar entrada libre y añadir reset funcional.
- Completar la liberación de recursos y el fallback de WebGL.
- Añadir tests de los bloqueadores y ejecutar el checklist manual de QA.
- Medir el presupuesto real en un dispositivo de referencia; reducir luces de sombra, recursos no compartidos y bundle si no cumple.
- Añadir estados visuales mínimos de antorcha, puerta y resultado final.

### Nice-to-have después del MVP

- Separar `WorldBuilder` de `GameScene` y compartir geometrías/materiales donde el perfil lo justifique.
- Extraer componentes UI de `App.tsx`, mejorar contraste y soporte responsive/táctil.
- Aplicar realmente presets de charcos/reflejos y usar semilla para variación visual reproducible.
- Añadir cobertura de contenido, más sinónimos y validación de grafo.
- Code splitting o carga diferida de la escena Three.js.

### Largo plazo, fuera del primer demo

- Runtime completamente genérico y segundo nivel JSON.
- Creación, carga, persistencia y progresión de personajes.
- Inventario, combate, NPCs y múltiples zonas.
- Guardado local versionado, backend, cuentas y multiplayer.
- Herramientas de autoría, catálogo visual versionado y exportación/importación.

## Dictamen

La base técnica es compilable, testeable en lógica y suficiente para demostrar una parte del vertical slice. No es todavía un demo cerrado según la definición del plan: los bloqueadores de proximidad, fallo, reset, cleanup, input libre y medición de rendimiento deben resolverse y verificarse antes de declarar la entrega completa.

## Actualización posterior a la auditoría

La auditoría inicial se realizó antes de los últimos cierres técnicos. Desde entonces:

- El reset jugable ya está conectado al menú y reinicia estado, escena y overlays sin recargar.
- Se añadieron tests de renderizabilidad de la configuración y la suite actual pasa con 10 archivos y 30 tests.
- El MVP posterior y sus slices están documentados en `MVP-SPEC.md` y `FUTURE-DELIVERY-SLICES.md`.
- HP y MP ya son valores del estado y sus barras son derivadas.

Siguen abiertos para declarar el demo completo: test manual de navegador/lifecycle, cleanup exhaustivo de todos los recursos de Three.js, reglas espaciales dentro del estado, medición reproducible de draw calls/triángulos/memoria, estados visuales de antorcha/puerta y parametrización genérica de todos los flujos.

## Actualización final de integración

Desde la actualización anterior también se incorporó:

- Validación de `targetId` en las transiciones: altar, antorcha y puerta no pueden resolverse desde otro objeto.
- Reset visual de posición, cámara, interacción y estado de mundo.
- Filtro de WASD cuando el foco está en elementos editables.
- Estado visual de antorchas y puerta derivado de flags del juego.
- Cleanup recursivo de geometrías y materiales presentes en la escena.
- Test de integración para una acción con objeto incorrecto.

El demo queda listo para QA manual final; las métricas de hardware y la migración declarativa completa siguen siendo trabajo posterior de validación/infraestructura, no se consideran falsamente completadas por compilar.

## Confirmación posterior de QA

El propietario confirmó el 2026-09-08 que el QA manual fue ejecutado satisfactoriamente. Quedan cubiertos navegador, lifecycle, controles, responsive, foco, estados visuales, ruta de éxito, ruta de fallo y reset. La evidencia se registró en `docs/areas/qa/README.md`.

## Instrumentación posterior de rendimiento

El diagnóstico de desarrollo ahora expone FPS medio, frame time, frames por encima de 33 ms, draw calls, triángulos, geometrías y texturas. Estas métricas mejoran la observabilidad, pero no sustituyen todavía una medición reproducible en hardware de referencia y GPU integrada.

El trabajo restante para declarar el MVP completo se concentra en:

- Medir y documentar rendimiento en dispositivos de referencia.
- Aplicar y comprobar todos los presets de calidad, incluidos efectos costosos.
- Generalizar el runtime declarativo y crear un segundo nivel desde JSON.
- Completar guardado atómico, migraciones, progresión y balance.
