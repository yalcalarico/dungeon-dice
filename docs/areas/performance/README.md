# Área: Rendimiento

## Objetivo

Mantener una experiencia fluida superior a 60 FPS en el hardware de referencia sin sacrificar la identidad visual.

## Presupuesto inicial

- Objetivo: 60 FPS.
- Frame time objetivo: <= 16,7 ms.
- Alerta: cualquier frame sostenido por encima de 33 ms.
- Menos de 100 draw calls en la escena inicial.
- Máximo aproximado de 150.000 triángulos visibles.
- Pixel ratio limitado y adaptable.

## Medición

Registrar FPS medio, mínimo, frame time, frames por encima de 33 ms, draw calls, triángulos, geometrías y texturas durante exploración, zoom y rotación. El panel de desarrollo muestra estas métricas cada 500 ms y `GameScene.getPerformanceSnapshot()` las expone para diagnósticos.

## Tareas

- [x] Añadir overlay de diagnóstico en desarrollo.
- [x] Crear controlador de calidad adaptativa con histéresis.
- [x] Registrar frames por encima de 33 ms en la ventana deslizante.
- [x] Exponer draw calls, triángulos, geometrías y texturas del renderer.
- [ ] Medir escritorio y portátil con GPU integrada.
- [ ] Compartir geometrías y materiales.
- [ ] Evaluar instancing para bloques repetidos.
- [ ] Limitar luces con sombras.
- [x] Añadir niveles de calidad.
- [ ] Reducir o desactivar reflejos caros según dispositivo.
- [ ] Verificar tamaño de bundle.
- [ ] Considerar carga diferida de la escena 3D.
- [ ] Registrar resultados reproducibles por navegador.

**Medición actual:** `npm run build` produce un chunk principal de `817.51 kB` minificado (`219.47 kB` gzip) y Vite emite una advertencia por superar `500 kB`. La carga diferida queda pendiente como optimización posterior.

## Checklist de entrega reproducible

- [ ] Ejecutar `npm ci`, `npm run build` y anotar versión de Node, navegador, sistema operativo y commit.
- [ ] Servir la aplicación con `npm run dev` o `npm run preview`, con DevTools cerradas durante la medición.
- [ ] Registrar durante 60 segundos cada escenario: reposo, exploración WASD, zoom y rotación de cámara.
- [ ] Anotar FPS medio/mínimo, frame time, frames sobre 33 ms, draw calls, triángulos, geometrías y texturas del panel de desarrollo.
- [ ] Repetir en el hardware de referencia y en un portátil con GPU integrada, indicando modelo de GPU y pixel ratio.
- [ ] Guardar una captura o transcripción de cada medición y comparar contra el presupuesto de esta área.
- [ ] Repetir tras activar cada nivel de calidad y verificar que la jugabilidad no cambia.

Las mediciones de FPS, consumo térmico, drivers y compatibilidad WebGL requieren hardware real; no se consideran cubiertas por Vitest, lint o build.

## Criterios de aceptación

- Existe una medición reproducible de FPS y frame time en modo desarrollo.
- La escena objetivo alcanza 60 FPS en el dispositivo de referencia durante exploración.
- Los efectos nuevos incluyen una medición antes y después.
- La calidad puede reducirse sin romper la jugabilidad cuando el rendimiento cae.
- El bundle y sus advertencias quedan documentados antes de la entrega.
- Las mediciones incluyen entorno, duración, escenarios y evidencia reproducible.
