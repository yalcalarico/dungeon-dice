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

Registrar FPS medio, mínimo, frame time, draw calls, triángulos y memoria durante exploración, zoom y rotación.

## Tareas

- [x] Añadir overlay de diagnóstico en desarrollo.
- [x] Crear controlador de calidad adaptativa con histéresis.
- [ ] Medir escritorio y portátil con GPU integrada.
- [ ] Compartir geometrías y materiales.
- [ ] Evaluar instancing para bloques repetidos.
- [ ] Limitar luces con sombras.
- [ ] Añadir niveles de calidad.
- [ ] Reducir o desactivar reflejos caros según dispositivo.
- [ ] Verificar tamaño de bundle.
- [ ] Considerar carga diferida de la escena 3D.
- [ ] Registrar resultados reproducibles por navegador.

## Criterios de aceptación

- Existe una medición reproducible de FPS y frame time en modo desarrollo.
- La escena objetivo alcanza 60 FPS en el dispositivo de referencia durante exploración.
- Los efectos nuevos incluyen una medición antes y después.
- La calidad puede reducirse sin romper la jugabilidad cuando el rendimiento cae.
- El bundle y sus advertencias quedan documentados antes de la entrega.
