# Área: Arte y pipeline visual

## Objetivo

Construir una identidad visual voxel-ish/low-poly para la cripta, con recursos reproducibles, buen contraste para la lectura de juego y un coste compatible con navegador. El área cubre la producción visual y sus contratos; no convierte a Three.js en la fuente de verdad del gameplay.

La prioridad es mejorar la escena actual sin ampliar innecesariamente el mapa: primero legibilidad, estabilidad y rendimiento; después variedad y acabado.

## Alcance

- Geometría modular para suelos, paredes, esquinas, puertas, columnas, altares, antorchas y decoración.
- Materiales compartidos para piedra, metal, madera, musgo, agua y suelo mojado.
- Iluminación atmosférica cálida/fría, sombras limitadas, niebla y contraste suficiente para interactivos.
- Charcos y reflejos aproximados de suelo mojado, con degradación por nivel de calidad.
- Catálogo visual estable que pueda ser referenciado por niveles JSON.
- Reglas de autoría, licencias, medición y empaquetado para navegador.

Quedan fuera de esta área la generación infinita, un editor completo de niveles y la incorporación de assets externos al primer demo.

## Tipos de recursos permitidos

Cada recurso debe registrar su origen, autor, licencia, versión y uso previsto.

### Procedural

Geometría, colores, variaciones, ruido, partículas, charcos, detalles repetidos y animaciones generados por código determinista o por parámetros de escena. No requieren un archivo artístico externo, pero sí límites de complejidad y una semilla cuando el resultado deba reproducirse. La variación ambiental no debe cambiar el estado del juego.

### Creado por el proyecto

Modelos, texturas, iconos, paletas, shaders y efectos producidos por el equipo para este repositorio. Deben guardarse con su fuente editable o parámetros de generación cuando sea razonable, y quedar bajo la licencia elegida por el proyecto. La autoría debe quedar documentada junto al recurso.

### Asset externo futuro

Solo podrá incorporarse después de una decisión explícita del proyecto y una revisión de licencia. Debe permitir redistribución dentro de la aplicación, modificación si el pipeline la necesita y uso comercial si ese es el objetivo del proyecto. Se conservarán licencia, atribución, URL o comprobante de origen, versión y cambios realizados. No se usarán recursos con licencia ambigua, restricciones de uso en juegos, obligación incompatible de publicar el código o contenido que dependa de una descarga en tiempo de ejecución.

No se descargan ni incorporan assets de terceros para cerrar el primer demo. El código tampoco debe descargar recursos implícitamente.

## Dirección visual

- Siluetas simples y modulares, con facetas visibles y bordes legibles desde cámara isométrica.
- Paleta base de piedra fría, musgo apagado, bronce y acentos de fuego cálido.
- Diferencia clara entre suelo transitable, obstáculos, interactivos y elementos decorativos.
- Detalle concentrado cerca de la cámara y de los puntos narrativos, no distribuido uniformemente.
- Imperfección controlada mediante variación de color, escala y orientación, evitando ruido que oculte los affordances.

## Materiales e iluminación

- Mantener materiales compartidos por familia y evitar crear una instancia por objeto repetido.
- Usar roughness, normalidad o variación procedural de baja frecuencia para separar piedra, metal, madera y musgo.
- Tratar el suelo mojado como una combinación de roughness menor, reflejo tenue, zonas de charco y respuesta diferenciada a la luz; no depender de un único efecto especular.
- Mantener los charcos como una capa limitada sobre el suelo, con bordes y profundidad visual sin geometría innecesaria.
- Usar una luz principal legible, luces cálidas locales para antorchas y relleno/niebla moderados. Las luces con sombras serán pocas y justificadas.
- Probar reflejos aproximados frente a una referencia seca: deben comunicar humedad sin exigir reflejos perfectos ni duplicar toda la escena.
- Definir fallback por calidad: desactivar o simplificar reflejos, partículas, niebla y sombras antes de comprometer la lectura del nivel.

## Kit modular de mazmorra

El kit debe trabajar con una unidad de cuadrícula documentada y piezas que encajen sin correcciones manuales. Cada pieza tendrá un ID estable y, cuando aplique, puntos de conexión o reglas de orientación.

Familias iniciales:

- Suelo: baldosa, borde, zanja, charco y transición.
- Pared: tramo, esquina interior/exterior, pilar, arco y remate.
- Acceso: puerta bloqueada, marco, pasillo y umbral.
- Gameplay: altar, antorcha, marcador de objetivo y elementos de estado.
- Decoración: escombros, cadenas, placas, musgo y variaciones de roca.

Las variantes deben compartir geometrías y materiales cuando sea posible. Un módulo visual no debe contener reglas narrativas; expone metadatos e IDs para que el runtime los vincule con interacción y configuración.

## Autoría de mapas

El primer nivel puede seguir siendo construido por código, pero la autoría debe converger a datos:

1. Definir límites, cuadrícula, módulos, transformaciones y etiquetas visuales.
2. Validar conexiones, solapes, orientación, accesibilidad espacial y referencias a objetos.
3. Asociar cada objeto interactivo a un ID estable, separado de su texto visible.
4. Probar el mapa con cámara isométrica, navegación y estados de humedad/iluminación.
5. Exportar la descripción sin incluir funciones ni código ejecutable.

La sección visual futura de un nivel JSON debe declarar, como mínimo, `kit`, `module`, `position`, `rotation`, `variant`, `materialPreset`, `qualityTier` y, cuando corresponda, `interactiveObjectId`. El runtime valida estos valores contra un catálogo permitido y Three.js solo los interpreta. Un cambio de posición o variante no debe requerir editar `GameScene.ts`.

## LOD, instancing y presupuesto

Aplicar LOD solo donde la medición demuestre beneficio: versiones simplificadas para decoración lejana y ocultación o agrupación de elementos fuera de cámara. Los elementos interactivos y los módulos que definan navegación deben conservar una silueta estable.

Usar instancing para bloques, rocas, escombros, partículas y otras repeticiones con la misma geometría/material. Agrupar por material y calidad, no por conveniencia de autoría. Evitar allocations, cambios de material y creación de recursos dentro del loop de render.

Presupuesto inicial alineado con el demo:

- Objetivo de 60 FPS y frame time de hasta 16,7 ms.
- Menos de 100 draw calls en la escena inicial.
- Aproximadamente 150.000 triángulos visibles como máximo inicial.
- Pixel ratio limitado y adaptable.
- Cero descargas de recursos durante la partida.

Registrar FPS medio/mínimo, frame time, draw calls, triángulos, memoria y tamaño de bundle en escritorio y portátil con GPU integrada. Cada nuevo efecto debe comparar antes y después; una mejora visual no se acepta si rompe el presupuesto sin una degradación de calidad definida.

## Pipeline hacia JSON

El flujo previsto es:

1. Crear o generar un recurso y registrar origen, licencia, dimensiones, escala, material, variantes y coste estimado.
2. Publicarlo en un catálogo visual versionado con IDs estables y niveles de calidad.
3. Componer un mapa con módulos y metadatos, sin reglas narrativas embebidas.
4. Exportar la composición a JSON y validar schema, referencias, cuadrícula, bounds y catálogo.
5. Cargar el JSON en el runtime, resolver únicamente recursos permitidos y producir errores concretos si falta alguno.
6. Ejecutar una prueba visual y de rendimiento; guardar la configuración y sus métricas junto con la versión del catálogo.

El JSON describe intención visual y espacial. El catálogo describe cómo resolverla. El código ejecuta la resolución y el renderizado; no debe aceptar rutas arbitrarias, scripts, shaders remotos ni funciones serializadas desde el nivel.

## Fases y entregables

### Fase 1: contrato visual y medición

Tareas:

- [ ] Documentar cuadrícula, escala, cámara de referencia, paleta y jerarquía visual.
- [ ] Inventariar recursos actuales y marcar si son procedurales o creados por el proyecto.
- [ ] Fijar escena de prueba, hardware de referencia y captura reproducible.
- [ ] Medir draw calls, triángulos, frame time, memoria y coste de reflejos.

Entregables: contrato visual breve, inventario de recursos y línea base de rendimiento.

### Fase 2: kit modular y materiales

Tareas:

- [ ] Separar constructores de módulos del montaje de la escena.
- [ ] Completar piezas mínimas de suelo, pared, acceso, altar, antorcha y decoración.
- [ ] Unificar materiales compartidos y presets de roughness/variación.
- [ ] Añadir estados visuales para humedad e hitos de gameplay sin acoplar reglas al arte.

Entregables: kit mínimo encajable, catálogo de materiales y cripta visualmente consistente.

### Fase 3: luz, humedad y reflejos

Tareas:

- [ ] Ajustar luz principal, luces locales, sombras y niebla para lectura isométrica.
- [ ] Comparar suelo seco, mojado y con charcos en una escena controlada.
- [ ] Implementar reflejo aproximado medible y fallback sin reflejos caros.
- [ ] Limitar pools de lluvia, partículas, ondas y humo a presupuestos explícitos.

Entregables: presets de calidad, referencia visual y medición antes/después.

### Fase 4: composición parametrizable

Tareas:

- [ ] Definir catálogo visual versionado con IDs, variantes y metadatos de coste.
- [ ] Añadir sección visual a la configuración JSON y validación de referencias.
- [ ] Migrar la cripta actual a una composición equivalente sin perder IDs interactivos.
- [ ] Probar un segundo mapa pequeño usando solo datos, cuando el área de contenido lo habilite.

Entregables: ejemplo JSON validado, loader de catálogo y composición reproducible.

### Fase 5: optimización y cierre

Tareas:

- [ ] Aplicar instancing y LOD donde los perfiles lo justifiquen.
- [ ] Definir escalones de calidad para escritorio y GPU integrada.
- [ ] Verificar limpieza de geometrías, materiales, luces, pools y reflejos al destruir la escena.
- [ ] Revisar licencias y registrar cualquier recurso aprobado.

Entregables: informe de rendimiento, matriz de calidad, checklist de licencias y criterio de cierre.

## Criterios de aceptación

- La cripta mantiene una lectura clara de navegación e interacción con cámara isométrica.
- El kit modular encaja en la cuadrícula y permite construir la escena inicial sin piezas especiales ocultas.
- Los recursos están clasificados como procedurales, creados por el proyecto o externos futuros, con su procedencia documentada.
- El suelo mojado, los charcos y los reflejos aproximados son visibles y tienen fallback de calidad medido.
- Los módulos repetidos reutilizan geometría/materiales y usan instancing cuando la medición lo justifica.
- La escena inicial cumple el presupuesto de menos de 100 draw calls, aproximadamente 150.000 triángulos visibles y 16,7 ms objetivo en el hardware de referencia, o documenta una excepción con degradación funcional.
- La escena puede montarse y destruirse sin loops, listeners ni recursos visuales huérfanos.
- Una configuración JSON puede referenciar módulos por IDs estables y falla con errores concretos ante recursos, licencias o referencias no permitidas.
- No hay descargas implícitas ni assets externos sin revisión de licencia.
- Cada efecto visual nuevo incluye una comparación de coste y un nivel de calidad que preserve la jugabilidad.
