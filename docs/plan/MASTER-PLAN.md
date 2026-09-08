# Plan maestro de Dungeon Dice: primer demo

## 1. Visión

Dungeon Dice será una aventura web narrativa en 3D, inspirada en el formato de fantasía d20 y construida con Three.js en el navegador. El jugador explora una zona pequeña pero atmosférica, propone acciones, recibe opciones contextuales y resuelve situaciones mediante dados.

El primer objetivo es un demo autocontenido y jugable de principio a fin. No se implementará todavía una campaña completa, multijugador ni un sistema de reglas exhaustivo. Las etapas posteriores están registradas en el [roadmap de evolución futura](./LONG-TERM-ROADMAP.md).

## 2. Experiencia objetivo

El jugador debe poder:

- Explorar una cripta con WASD.
- Mover una cámara ortográfica con seguimiento suave.
- Rotar la cámara arrastrando.
- Hacer zoom con la rueda.
- Ver un mundo procedural con iluminación, humedad y movimiento ambiental.
- Acercarse a elementos interactivos.
- Elegir acciones sugeridas.
- Escribir acciones libres en lenguaje natural limitado.
- Resolver pruebas con un D20 y modificadores.
- Ver consecuencias persistentes en el mundo y en la narrativa.
- Completar una pequeña aventura con éxito o quedar en una ruta de fallo.

## 3. Alcance del primer demo

### Incluido

- Una cripta procedural.
- Un personaje controlable.
- Altar, antorchas y puerta bloqueada.
- Una secuencia narrativa ramificada.
- Acciones sugeridas contextuales.
- Parser determinista para acciones escritas.
- Pruebas d20 con atributos y dificultad.
- Flags persistentes de la aventura.
- Estados de victoria y fallo.
- Ambiente vivo: fuego, lluvia o humedad, partículas y animaciones sutiles.
- Arte creado con geometría, materiales y shaders propios.
- Objetivo de 60 FPS en el hardware de referencia.

### Fuera de alcance inicial

- Multijugador.
- Backend o cuentas.
- Generación infinita de mazmorras.
- IA generativa necesaria para jugar.
- Combate complejo con múltiples enemigos.
- Inventario extenso.
- Editor de niveles.
- Sistema completo de clases y progresión.
- Assets descargados de terceros.

## 4. Fases de construcción

### Fase 0: contrato del demo

Definir la escena, objetivo, estados de victoria/fallo, acciones válidas y reglas mínimas. Resultado: especificación cerrada del primer escenario.

### Fase 1: base técnica

Separar ciclo de vida, input, cámara, loop y recursos de Three.js. Corregir listeners, dispose y manejo de resize. Resultado: escena estable que puede montarse y desmontarse sin fugas.

### Fase 2: estado del juego

Crear `GameState`, eventos y reducer. React y Three.js deben leer una fuente de verdad común. Resultado: el mundo puede recordar acciones y flags.

### Fase 3: narrativa

Crear nodos, condiciones, acciones, respuestas, parser y efectos. Resultado: el jugador puede completar una secuencia narrativa usando botones o texto.

### Fase 4: dados

Crear lanzamientos, modificadores, dificultades, resultados críticos y presentación visual. Resultado: las pruebas producen consecuencias verificables.

### Fase 5: interacción 3D

Añadir raycast, proximidad, resaltado, prompt contextual y objetos interactivos. Resultado: la exploración conecta físicamente con la narrativa.

### Fase 6: escena y atmósfera

Mejorar módulos low-poly/voxel-ish, suelo húmedo, reflejos aproximados, iluminación y comportamientos ambientales. Resultado: el escenario comunica profundidad y vida.

### Fase 7: rendimiento

Medir FPS, draw calls, triángulos, memoria y tiempos de frame. Añadir instancing, calidad adaptativa y límites de efectos. Resultado: rendimiento estable en dispositivos objetivo.

### Fase 8: QA y entrega

Cubrir lógica con tests, probar navegadores, validar accesibilidad, documentar ejecución y completar la definición de demo. Resultado: build reproducible y demo presentable.

## 5. Dependencias entre fases

1. La fase 1 precede a cualquier sistema persistente de gameplay.
2. La fase 2 precede a narrativa, dados e interacción.
3. La narrativa y dados deben existir antes de pulir el contenido visual.
4. La medición de rendimiento debe empezar antes de añadir efectos costosos.
5. QA debe acompañar cada fase, no ejecutarse únicamente al final.

## 6. Definition of Done del demo

- `npm run build` termina sin errores.
- `npm run lint` termina sin errores.
- Hay tests para dados, parser y transiciones principales.
- El jugador puede completar una ruta de éxito.
- Existe al menos una ruta de fallo significativa.
- Las acciones escritas inválidas reciben una respuesta útil.
- Las decisiones alteran el estado y el texto posterior.
- La escena se desmonta sin listeners ni animaciones huérfanas.
- El rendimiento se mide y cumple el presupuesto definido.
- No se usan assets descargados.
- El README permite ejecutar y entender el proyecto desde cero.

## 7. Prioridad de trabajo

La prioridad es, en orden: jugabilidad completa, estabilidad, rendimiento medido, legibilidad de la arquitectura y después calidad visual. No se debe ampliar el mapa o añadir decoración para ocultar un sistema de juego incompleto.

## 8. Relación con el roadmap futuro

Este documento termina cuando el demo cumple su definición de terminado. No pretende describir cuentas, persistencia online, creación de personajes, inventario, combate completo ni multiplayer. Esos sistemas se mantienen documentados en `LONG-TERM-ROADMAP.md` para orientar decisiones actuales sin ampliar el alcance del demo.

## 9. Progreso del vertical slice

- Interacción espacial inicial: completada para altar, antorchas y puerta.
- Ruta del demo: altar -> prueba d20 -> antorcha -> puerta -> victoria.
- Ambiente procedural inicial: lluvia en pool y luces de antorcha animadas.
- Objetivos y checks bloqueantes: visibles en la UI y derivados del estado narrativo.
- Fundación de configuración JSON: schema, nivel inicial y loader validado integrados parcialmente.
- Overlay de rendimiento: FPS y frame time del loop real visibles en desarrollo.
- Tests automatizados: 5 archivos y 11 casos para dados, interacción, configuración, estado y calidad.
- Runtime de contenido: labels, keywords, dificultad y coste de reintento consumidos desde JSON.
- Sesión: transiciones reales de `App` envueltas en un estado de sesión con historial de estados.
- Arte procedural: columnas y capiteles low-poly compartidos añadidos con coste controlado.
- Accesibilidad: menú funcional, foco, Escape y documento en español.
- Pendiente antes de cerrar el demo: fallo recuperable, tests automatizados, medición de rendimiento y estados visuales completos de objetos.

La parametrización JSON no es requisito para cerrar la primera cripta, pero sí es requisito antes de construir varios niveles. Está especificada en [Contenido parametrizable](../areas/content/README.md) y debe comenzar con una migración equivalente del nivel actual.

La planificación del siguiente MVP está en [`MVP-SPEC.md`](./MVP-SPEC.md), y su descomposición futura en [`FUTURE-DELIVERY-SLICES.md`](./FUTURE-DELIVERY-SLICES.md). La auditoría de cierre vigente está en [`DEMO-AUDIT.md`](./DEMO-AUDIT.md).
