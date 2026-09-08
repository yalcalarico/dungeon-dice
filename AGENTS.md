# Lineamientos para agentes y colaboradores

## Objetivo del repositorio

Construir un demo web jugable de aventura narrativa 3D con Three.js, cámara isométrica, dados d20 y arte procedural voxel-ish. El primer demo debe ser pequeño, completo y medible.

## Stack obligatorio

- React 19.
- TypeScript con `strict` y comprobación de tipos.
- Vite.
- Three.js para renderizado.
- CSS existente salvo que una decisión documentada justifique otra solución.
- Oxlint y TypeScript antes de considerar una tarea terminada.

## Principios de implementación

- Preferir cambios pequeños, explícitos y fáciles de revisar.
- No introducir dependencias sin necesidad concreta.
- No descargar ni incorporar assets de terceros.
- No esconder lógica de gameplay dentro de componentes visuales.
- No acoplar reglas narrativas a Three.js.
- No usar IA externa como requisito para el primer demo.
- Reutilizar geometrías y materiales para controlar draw calls.
- Mantener la escena destruible y reiniciable.
- Usar `deltaTime` para movimiento y animaciones.
- Evitar allocations innecesarias dentro del render loop.
- Añadir comentarios solo para decisiones no obvias.

## Arquitectura

- React controla UI y estado de aplicación.
- Un estado central controla gameplay.
- Three.js representa el estado, pero no es la fuente de verdad.
- La narrativa usa datos declarativos y comandos verificables.
- Los dados son un sistema aislado y testeable sin navegador.
- Los objetos interactivos tienen IDs estables y metadatos.

## Rendimiento

- Objetivo de 60 FPS y frame time de 16,7 ms.
- Medir antes de optimizar.
- Limitar sombras dinámicas, partículas y reflejos.
- Compartir recursos y usar instancing para repeticiones.
- Añadir calidad adaptativa si los efectos superan el presupuesto.
- No aceptar una mejora visual que degrade significativamente el rendimiento sin medirla.

## Input y accesibilidad

- El teclado no debe controlar el juego mientras el usuario escribe.
- Todo listener añadido debe eliminarse en el cleanup correspondiente.
- Todo botón visible debe tener una acción real.
- Los controles deben tener nombres accesibles y foco visible.
- La interfaz debe seguir siendo utilizable en pantallas pequeñas.

## Flujo de trabajo

1. Leer `docs/plan/MASTER-PLAN.md` y el README del área correspondiente.
2. Identificar la tarea y sus criterios de aceptación.
3. Revisar el estado actual antes de editar.
4. Implementar el cambio mínimo completo.
5. Ejecutar `npm run lint` y `npm run build`.
6. Ejecutar `npm test` y añadir tests para toda lógica nueva.
7. Actualizar documentación si cambia un contrato o decisión.
8. Informar archivos modificados, verificaciones y riesgos restantes.

## Flujo Git y Pull Requests

- El primer bootstrap del repositorio puede publicarse directamente en `main` cuando el propietario lo autorice explícitamente.
- Después del bootstrap, cada cambio debe comenzar desde `main` en un branch nuevo y descriptivo.
- Nunca hacer push directo a `main` para cambios posteriores.
- Cada branch de trabajo debe publicarse en el remoto y acompañarse de un Pull Request contra `main`.
- El agente no debe hacer merge del Pull Request: el merge requiere aprobación explícita del propietario.
- Antes de crear un Pull Request se deben revisar `git status`, `git diff`, los commits incluidos, el branch base y las verificaciones de `lint`, tests y build.
- No hacer force-push, reset destructivo ni amend salvo petición explícita.

## Reglas de documentación

- La documentación se mantiene en español.
- Los nombres de código permanecen en inglés si ya siguen esa convención.
- Cada nueva área debe tener README, alcance, reglas, tareas y criterios de aceptación.
- No marcar tareas como terminadas solo porque el código compila.
- Las decisiones de arquitectura deben registrarse cerca del área afectada.
- Cada módulo nuevo debe incluir tests unitarios para sus reglas y al menos un test de integración cuando cruce estado, narrativa, configuración, renderizado o UI.
- Los cambios visuales o de lifecycle que no puedan cubrirse con Vitest deben incluir un caso en el checklist manual de QA.

## Criterios de no aceptación

No considerar terminada una tarea que:

- Deje listeners o loops sin limpiar.
- Rompa `npm run lint` o `npm run build`.
- Introduzca assets descargados.
- Añada gameplay que solo modifique texto sin cambiar estado.
- Añada efectos visuales sin comprobar su coste.
- Requiera conexión de red para jugar el primer demo.
