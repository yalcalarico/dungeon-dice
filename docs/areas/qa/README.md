# Área: QA y pruebas

## Objetivo

Evitar regresiones en la lógica jugable, el ciclo de vida de Three.js y la experiencia web.

## Tests unitarios

- Dados y modificadores.
- Parser de acciones.
- Requisitos y efectos.
- Reducer del estado.
- Flags y condiciones narrativas.

## Tests de integración

- Acción sugerida actualiza el estado.
- Acción escrita válida produce el mismo efecto que su equivalente sugerida.
- Acción inválida no muta el estado.
- Una prueba cambia el resultado narrativo.
- La puerta completa la ruta de victoria.
- Reiniciar limpia flags y recursos.

## Checklist manual

- [ ] Montar y desmontar la escena repetidamente.
- [ ] Mantener WASD y cambiar foco al input.
- [ ] Rotar y hacer zoom en los límites.
- [ ] Redimensionar la ventana.
- [ ] Probar Safari y Chromium.
- [ ] Probar pantalla pequeña.
- [ ] Probar WebGL no disponible.
- [ ] Comprobar que no quedan listeners ni loops activos.
- [ ] Verificar teclado, foco y contraste.

## Tareas

- [ ] Añadir framework de tests cuando exista lógica aislada.
- [ ] Crear fixtures de estado inicial.
- [ ] Automatizar pruebas del reducer y parser.
- [ ] Añadir smoke test de build.
- [ ] Documentar matriz de navegadores.

## Slice implementado

- [x] Verificar que el núcleo de dados, narrativa y estado compila.
- [x] Verificar lint y build tras integrar el altar.
- [x] Verificar cleanup de listeners en la escena mediante revisión de lifecycle.
- [x] Verificar que el loader de nivel valida la configuración actual durante la compilación.
- [x] Integrar métricas de FPS y frame time al loop de render.
- [x] Probar transición inválida por objeto fuera de contexto en el estado.
- [x] Añadir Vitest y tests de dados, interacción, configuración, estado y calidad.
- [x] Añadir tests del tracker de rendimiento y de resolución narrativa directa.
- [x] Integrar la sesión real en `App` sin romper las transiciones existentes.
- [x] Cubrir creación/carga de personajes, recursos HP/MP y recompensas de experiencia.
- [x] Probar la ruta completa altar -> antorcha -> puerta en navegador.
- [x] Medir visualmente el coste de la lluvia con el overlay de rendimiento.
- [x] Verificar banner de éxito verde y cierre de outcomes.
- [x] Verificar checklist de objetivos en estados inicial, bloqueado y completado.
- [x] Verificar que un fallo del altar no bloquea antorcha ni salida.

## Criterios de aceptación

- Las reglas de dados, parser y reducer tienen tests automatizados.
- Cada módulo nuevo tiene cobertura unitaria y cada flujo entre módulos tiene cobertura de integración.
- Existe al menos un test de éxito y uno de fallo para la aventura.
- La build y el lint se ejecutan en el flujo de verificación.
- Se ha comprobado el cleanup de la escena y los listeners.
- Se documentan los riesgos que no puedan automatizarse.
