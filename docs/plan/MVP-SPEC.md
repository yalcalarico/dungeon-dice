# Especificación del MVP posterior al demo

## 1. Propósito

Este documento define el siguiente MVP de Dungeon Dice después del primer demo. El objetivo es convertir la cripta inicial en una experiencia single-player corta, rejugable y persistente: un mapa mayor, una campaña pequeña, personajes con identidad y progresión, encuentros, recompensas y guardado local.

El MVP debe demostrar que el núcleo de exploración narrativa puede sostener más de un nivel sin depender de lógica específica dentro de componentes React. El estado de juego continúa siendo la fuente de verdad; Three.js solo lo representa. No requiere red, cuentas, servidor, contenido generado por IA ni multijugador.

## 2. Resultado esperado

Un jugador nuevo puede:

- Iniciar una partida y completar un onboarding breve.
- Crear un personaje usando uno de tres arquetipos iniciales.
- Guardar, cerrar y cargar la partida sin perder progreso.
- Explorar un mapa mayor formado por varias zonas conectadas.
- Seguir objetivos y resolver narrativa, checks y bloqueadores declarados en JSON.
- Hablar con NPCs y superar al menos un encuentro hostil.
- Recibir loot, consultarlo en un inventario básico y conservarlo tras cargar.
- Ganar experiencia, alcanzar hitos y observar consecuencias persistentes.
- Llegar a un final de campaña, ser derrotado y reiniciar o recuperar el estado de forma comprensible.

La experiencia objetivo es una campaña de aproximadamente 30-60 minutos en la primera versión, con una segunda ruta o decisión relevante. La duración no debe conseguirse mediante repetición artificial ni grind obligatorio.

## 3. Must-have MVP (alcance obligatorio)

### 3.1 Mapa y exploración

- Un mapa mayor que el demo, dividido en 2 o 3 zonas conectadas.
- Transiciones explícitas entre zonas, con estado de mundo compartido.
- Puntos de entrada y salida estables, límites de navegación y retorno seguro.
- Objetos interactivos con IDs estables y metadatos declarativos.
- Carga de contenido desde JSON validado, sin referencias obligatorias a componentes React.
- Renderizado procedural reutilizable, con presupuesto medido de FPS, memoria y draw calls.

### 3.2 Módulo de authoring y contrato de contenido

El módulo de authoring es una herramienta de desarrollo local para crear, editar, exportar y validar JSON. No es todavía un editor público ni un CMS online.

Debe representar y validar como mínimo:

- Mapas, zonas, conexiones y puntos de aparición.
- Objetos interactivos, IDs, etiquetas, posición, estado inicial y acciones.
- Nodos narrativos, elecciones, condiciones y efectos.
- Objetivos, estados, dependencias y recompensas.
- Checks d20, atributos, dificultad, modificadores, resultados y costes.
- Bloqueadores, requisitos, mensajes de diagnóstico y rutas de resolución.
- NPCs, diálogos, relaciones y disponibilidad por estado.
- Encuentros, participantes, condiciones de inicio, victoria, derrota y retirada.
- Objetos de loot, tablas de recompensa y cantidades.
- Metadatos de renderabilidad: geometría, material, escala, colisión, iluminación y fallback.

La validación debe detectar IDs duplicados, referencias inexistentes, ciclos no permitidos, objetivos imposibles, bloqueadores sin resolución, nodos inaccesibles, checks sin resultado, recompensas inválidas y entidades no renderizables. Los errores deben incluir archivo, ID y mensaje accionable. Un contenido inválido no puede entrar en el build jugable.

El authoring debe generar JSON determinista y versionado, con un esquema explícito y una validación ejecutable fuera del navegador. La herramienta puede ser CLI o una UI interna, pero su contrato y sus errores no deben depender de Three.js.

### 3.3 Personajes

El MVP incluye tres arquetipos iniciales, con nombres propios y reglas simples:

- **Vanguardia**: mayor supervivencia y bonificaciones para proteger o resistir.
- **Explorador**: movilidad, percepción y ventajas en exploración o precisión.
- **Canalizador**: menor resistencia, pero recursos y modificadores para checks narrativos o efectos.

Los arquetipos son datos configurables, no ramas de código. Cada uno debe tener atributos iniciales, recursos, una habilidad inicial, límites claros y una descripción accesible. El jugador puede introducir nombre y elegir un aspecto procedural o una combinación de piezas disponibles.

La creación debe rechazar nombres inválidos, combinaciones fuera de rango y datos incompletos. La carga debe seleccionar un personaje local válido, mostrar su nivel, experiencia, inventario y ubicación, y permitir continuar sin crear duplicados involuntarios.

### 3.4 Progresión y experiencia

- Experiencia obtenida por objetivos, encuentros y hitos definidos por contenido.
- Niveles o hitos con una tabla versionada y visible.
- Al menos dos hitos de progresión dentro de la campaña.
- Recompensas de progreso idempotentes: repetir una carga, reintentar o volver a leer un evento no duplica XP ni loot.
- Una regla explícita para experiencia de objetivos repetibles y no repetibles.
- Balance inicial documentado con rangos de dificultad, daño, salud, XP y recompensa.

El MVP no necesita árbol de talentos, multiclase, crafting ni estadísticas exhaustivas.

### 3.5 Loot e inventario foundation

- Ítems con ID de definición y, cuando sea necesario, ID de instancia.
- Categorías mínimas: consumible, equipo y objeto de misión.
- Cantidades, apilado, capacidad fija o regla de límite simple.
- Ver, inspeccionar, usar consumibles, equipar una selección mínima, descartar y recoger.
- Reglas de requisitos y mensajes para usos inválidos.
- Persistencia en guardado y validación de cantidades no negativas.
- Recompensas transaccionales: cada entrega registra una clave única para impedir duplicación.

No se incluye economía completa, comercio, fabricación ni equipamiento con docenas de ranuras.

### 3.6 NPCs y encuentros

- NPCs con identidad, ubicación, estado de disponibilidad, diálogo y consecuencias.
- Al menos un NPC útil y uno cuya relación o información cambie con una decisión.
- Un encuentro hostil de reglas deterministas y duración limitada.
- Turnos o fases visibles, acciones básicas, ataque/defensa, daño, derrota, retirada y recompensa.
- Reutilización del sistema de comandos, dados, condiciones y efectos de narrativa.
- La IA del encuentro debe tener comportamiento simple, acotado y testeable.

El combate complejo, los estados avanzados y los enemigos con planificación profunda quedan fuera del MVP.

### 3.7 Guardado, carga y recuperación

- Perfiles locales claramente separados.
- Guardado manual y autosave en puntos seguros y después de transiciones relevantes.
- Estado versionado con migraciones explícitas.
- Carga atómica: un fallo no debe dejar un guardado parcialmente escrito.
- Validación al cargar, reparación limitada de datos recuperables y mensaje claro si el archivo no puede usarse.
- Reinicio de zona, reinicio de encuentro y abandono de partida con confirmación.
- Estado de campaña, personaje, inventario, objetivos, NPCs, recompensas entregadas y semilla relevante.
- Sincronización entre estado de gameplay, UI y representación 3D después de cargar.

El guardado local no es una frontera de seguridad: el cliente puede ser modificado por el usuario. El MVP no promete integridad competitiva ni respaldo remoto.

### 3.8 Derrota, muerte y reset

La derrota debe ser un estado de juego, no solo un cambio de texto.

- Estado explícito de incapacitado o derrotado con causa y contexto.
- Pantalla de resultado con opciones: reintentar encuentro, volver al último punto seguro o cargar un guardado anterior.
- Limpieza de efectos temporales y comandos pendientes al reiniciar.
- Conservación o pérdida de recursos definida por contenido y mostrada antes de confirmar.
- No otorgar XP, loot ni objetivos de victoria por una resolución abortada o revertida.
- Reiniciar una escena debe restaurar exactamente un snapshot válido, sin duplicar NPCs, objetos ni recompensas.
- La victoria y la derrota deben tener rutas de salida accesibles mediante teclado y lector de pantalla.

## 4. Nice-to-have del MVP

Estas capacidades pueden entrar si no ponen en riesgo el alcance obligatorio:

- Tres o más finales de campaña con resumen de decisiones.
- Más de un encuentro hostil o un encuentro opcional.
- Preview visual del mapa en el authoring.
- Exportación/importación manual de partidas locales.
- Comparación simple de equipo y filtros de inventario.
- Apariencia procedural con más piezas y recolor.
- Controles remapeables, volumen separado y calidad gráfica seleccionable.
- Glosario de reglas, registro de eventos y ayuda contextual.
- Telemetría local opt-in para medir embudos de onboarding, abandono, derrotas y rendimiento.
- Herramientas de replay o inspección de comandos para depuración.

Si una funcionalidad nice-to-have obliga a introducir backend, cuentas, assets externos o una segunda autoridad de estado, se pospone.

## 5. Fuera del MVP y roadmap largo

Quedan fuera de esta entrega:

- Backend, cuentas, sincronización online y recuperación remota.
- Multijugador, chat, matchmaking o sesiones compartidas.
- Editor público, publicación por usuarios y contenido descargable.
- Economía online, tienda, ranking o recompensas con valor competitivo.
- Mundo abierto, generación infinita y campaña procedural completa.
- Árbol de habilidades grande, clases avanzadas, crafting y simulación social profunda.
- Moderación de contenido de usuarios.

El roadmap largo debe abordar estas capacidades solo después de que el estado determinista, el contrato de contenido, el guardado y la separación de autoridad estén probados.

## 6. Requisitos transversales

### Onboarding y UX

- Explicar movimiento, interacción, checks, objetivos, inventario, derrota y guardado sin exigir lectura externa.
- Ofrecer una ruta segura de primeros minutos con feedback de causa y consecuencia.
- No ocultar una acción obligatoria detrás de una affordance no visible.
- Mantener foco visible, navegación por teclado, nombres accesibles, contraste suficiente, textos escalables y alternativa a información basada solo en color.
- Respetar la regla del proyecto: el teclado no controla el juego mientras se escribe.

### Balance y claridad

- Definir presupuestos de salud, daño, dificultad, XP y valor de loot antes de añadir contenido.
- Probar rutas de éxito, fallo, retirada, reintento, carga y repetición.
- Revisar que cada bloqueo tenga una solución razonable y que las clases puedan completar la campaña.
- Medir tiempo hasta primera interacción, primera recompensa, primera derrota y finalización.

### Telemetría y privacidad

- En single-player, la telemetría es opcional, local o anónima y debe estar desactivada por defecto si requiere envío.
- No registrar nombres, texto libre, contenido de guardados ni datos que identifiquen al jugador sin consentimiento.
- Registrar solo eventos agregables como inicio, abandono, error de contenido, duración, resultado y rendimiento.
- La instrumentación no puede cambiar reglas ni bloquear el juego.

### Seguridad y límites de autoridad

- Validar todo JSON, comandos y guardados en sus fronteras.
- No ejecutar código contenido en JSON ni permitir rutas arbitrarias, HTML no confiable o scripts de contenido.
- Limitar tamaño, profundidad, cantidades y número de entidades para evitar bloqueos accidentales.
- Tratar el cliente y el guardado local como no confiables si posteriormente se añade un servidor.
- Diseñar recompensas, IDs e historial de comandos para poder mover la autoridad al servidor sin reescribir el gameplay.

### Calidad técnica

- Tests unitarios para dados, reglas de progreso, inventario, recompensas idempotentes, reset y validación de contenido.
- Al menos un test de integración que cruce contenido, estado, narrativa y guardado.
- Pruebas manuales de ciclo de vida de Three.js, carga, derrota, cambio de zona y responsive UI.
- `npm run lint`, `npm test` y `npm run build` deben pasar.
- Medir rendimiento en el hardware objetivo antes de aceptar efectos o geometría adicional.

## 7. Definition of Done

El MVP está terminado cuando:

- La campaña de 2 o 3 zonas puede iniciarse, completarse y volver a jugarse.
- Los tres arquetipos son válidos, diferenciados y capaces de completar la ruta principal.
- Un autor puede modificar el JSON y obtener diagnósticos antes de ejecutar el juego.
- El juego rechaza contenido no renderizable o con referencias rotas.
- El jugador puede guardar, cargar, perder, reintentar y reiniciar sin corrupción ni duplicación.
- NPCs, objetivos, checks, bloqueadores, encuentros, loot e inventario afectan realmente al estado.
- El progreso de XP y las recompensas son persistentes e idempotentes.
- Onboarding y pantallas críticas cumplen el checklist de accesibilidad.
- No quedan listeners, loops, recursos 3D ni transiciones pendientes al desmontar o reiniciar.
- Se cumplen lint, tests, build y el presupuesto de rendimiento acordado.
- La documentación de slices y riesgos permite continuar sin ampliar accidentalmente el alcance.
