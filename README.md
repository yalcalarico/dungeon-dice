# Dungeon Dice

Aventura narrativa 3D single-player construida con React 19, TypeScript, Vite y Three.js. El jugador explora mapas procedurales, crea un personaje, resuelve checks d20, combate por turnos y conserva su campaña localmente.

## Estado

El repositorio contiene un vertical slice jugable del MVP:

- Cripta y Patio de Ceniza con transición narrativa.
- Movimiento WASD, cámara isométrica, drag y zoom.
- Creación y carga de personajes locales.
- Tres arquetipos y atributos D&D.
- Compra de puntos y generación aleatoria 4d6.
- Checks con modificadores de atributos.
- Altar, antorchas, puerta, NPC, reliquia y enemigo visible.
- Combate por turnos con D20, daño, curación, buffs y debuffs.
- Inventario inferior con acumulación, uso y descarte.
- Victoria, muerte, reintento y reset de campaña.
- Persistencia local de personajes y progreso.
- UI accesible con foco visible, Escape y soporte de movimiento reducido.

El checklist de implementación se mantiene en [`docs/plan/MVP-EXECUTION.md`](./docs/plan/MVP-EXECUTION.md). Algunas capacidades del MVP completo, como authoring totalmente declarativo, guardado atómico y QA de navegador, continúan en evolución.

## Inicio rápido

Requisitos:

- Node.js compatible con la versión actual del proyecto.
- Navegador con soporte WebGL.

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173/`.

## Comandos

```bash
npm run dev       # servidor Vite con HMR
npm test          # suite Vitest
npm run lint      # Oxlint
npm run build     # comprobación TypeScript y build de producción
npm run preview   # preview del build
```

## Arquitectura

- React controla la interfaz y el estado de aplicación.
- Los módulos de `src/state`, `src/narrative`, `src/mvp` y `src/characters` contienen reglas testeables sin navegador.
- Three.js representa escena, interacción espacial, animaciones y recursos visuales.
- El contenido inicial vive en `src/content` y se valida antes de cargarlo.
- Los perfiles y sesiones de campaña se guardan en `localStorage` versionado por clave.
- No se requiere red, backend, cuenta ni assets descargados para jugar.

## Documentación

- [Ejecución del MVP](./docs/plan/MVP-EXECUTION.md)
- [Especificación del MVP](./docs/plan/MVP-SPEC.md)
- [Slices de entrega](./docs/plan/FUTURE-DELIVERY-SLICES.md)
- [Auditoría del demo](./docs/plan/DEMO-AUDIT.md)
- [Arquitectura](./docs/architecture/ARCHITECTURE.md)
- [Índice de áreas](./docs/README.md)
- [Lineamientos de colaboración](./AGENTS.md)

## Principios

- Gameplay determinista y testeable fuera de Three.js.
- IDs estables y estado como fuente de verdad.
- Cleanup obligatorio de listeners, loops y recursos 3D.
- Geometría y materiales procedurales sin assets de terceros.
- Medición de rendimiento antes de ampliar efectos visuales.
- Contenido, nombres, narrativa y reglas propios o compatibles con su licencia.
