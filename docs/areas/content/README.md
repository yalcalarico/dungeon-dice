# Área: Contenido parametrizable

## Objetivo

Permitir que niveles, objetos, acciones, requisitos, dados, consecuencias y flujos narrativos se definan como datos versionados, exportables e importables, sin tener que modificar TypeScript para crear una nueva aventura.

Esta área es prioritaria antes de construir varios niveles. El código debe interpretar configuraciones, no contener una copia específica de la cripta.

## Estado actual

El proyecto todavía no cumple completamente este objetivo:

- Los IDs y acciones públicas del altar están definidos en `src/narrative/altar.ts`, pero sus etiquetas, keywords, checks, objetivos y coste se leen de la configuración.
- Las geometrías y materiales genéricos se construyen en `GameScene.ts`, pero las posiciones, tipos, IDs, bounds y entidades de ambas zonas se leen desde configuración.
- El Patio de Ceniza, Iria, la reliquia y el Centinela ya tienen un JSON equivalente; sus reglas y recompensas se consultan desde el nivel activo.
- Las reglas técnicas del vertical slice conservan algunos condicionales de orquestación, pero ya no contienen labels, posiciones, stats, recompensas ni diálogos de campaña.
- El authoring de campaña ya permite exportar y cargar mapas JSON versionados.
- Las migraciones entre versiones todavía no están implementadas.

La fundación inicial ya existe: hay schema tipado, JSON de la cripta, JSON del Patio de Ceniza, loader, validación de referencias y montaje de ambas zonas desde el índice de campaña.

La implementación actual ya tiene una arquitectura de niveles parametrizable para las entidades y reglas cubiertas por el schema; faltan catálogo visual, migraciones y generalizar algunos flujos técnicos.

### Auditoría de residuos hardcoded

La migración de runtime deja los datos visibles de diálogo, recompensas, items, títulos de zona, entradas, entidades y transiciones respaldados por los niveles cargados desde JSON. `src/content/dialogue.ts` es únicamente un adaptador compatible para la API antigua; `progression.ts` indexa las recompensas de campaña; y almacenamiento/sincronización consultan ese mismo catálogo.

Se mantienen como reglas técnicas o contratos públicos: los umbrales numéricos de nivel (`0`, `50`, `125`), los IDs de acciones y flags heredados de `altar.ts`, y textos de sistema que no representan contenido de campaña. Los IDs de zona se validan contra el catálogo cargado.

## Contrato de configuración

Un nivel debe poder describirse con un documento similar a este:

```json
{
  "schemaVersion": 1,
  "id": "crypt-of-lunargenta",
  "title": "La Cripta de Lunargenta",
  "scene": {
    "bounds": { "minX": -10.8, "maxX": 10.8, "minZ": -5.8, "maxZ": 6.2 },
    "environment": {
      "rain": { "enabled": true, "density": 96, "speed": 4.5 },
      "floor": { "wetness": 0.8, "puddles": true }
    }
  },
  "objects": [
    {
      "id": "altar-main",
      "type": "altar",
      "position": { "x": 6, "y": 0, "z": -1 },
      "interaction": {
        "radius": 2.2,
        "actions": ["inspect-altar"]
      }
    }
  ],
  "objectives": [
    {
      "id": "objective-investigate-altar",
      "label": "Investigar el altar",
      "blocking": true,
      "completion": { "flag": "altarInvestigated" }
    }
  ],
  "checks": [
    {
      "id": "altar-investigation",
      "label": "Prueba de sabiduría",
      "die": "d20",
      "difficulty": 12,
      "onSuccess": { "effects": [{ "setFlag": "altarInvestigationSucceeded" }] },
      "onFailure": { "effects": [{ "setFlag": "altarInvestigationFailed" }], "continue": true }
    }
  ],
  "actions": [
    {
      "id": "inspect-altar",
      "label": "Inspeccionar el altar",
      "keywords": ["inspeccionar altar", "examinar altar"],
      "requires": [{ "nearObject": "altar-main" }],
      "check": "altar-investigation",
      "effects": [{ "setFlag": "altarInvestigated" }],
      "movement": { "during": "locked", "after": "allowed" }
    }
  ],
  "victory": {
    "requires": [{ "objectiveCompleted": "objective-open-exit" }]
  }
}
```

El formato de niveles es un contrato versionado. El mapa de campaña usa `schemaVersion: 1` y exige IDs únicos, salidas declaradas y conexiones que apunten a zonas, salidas y entradas existentes.

Las zonas que usan contenido narrativo adicional pueden declarar `npcs`, `dialogues`, `relics`, `enemies`, `rewards` y `routeChoices`. Un NPC referencia su objeto espacial y sus diálogos; los diálogos usan `minTrust` y `nextTrust`; reliquias y enemigos referencian recompensas; y las rutas declaran `minTrust`, requisitos, efectos y recompensas. Los enemigos declaran `maxHp`, `armorClass`, `attackBonus` y daño `d6` con modificador.

El índice `src/content/campaign.ts` carga los dos documentos y expone `levelsByZoneId`, sin duplicar los datos ni depender de `GameScene.ts`.

## Reglas de parametrización

- Los IDs son únicos dentro de un nivel y nunca se usan como texto visible.
- Las acciones declaran requisitos, prueba opcional, efectos, consecuencias y política de movimiento.
- Un check puede ser bloqueante o informativo.
- `onSuccess` y `onFailure` pueden tener flujos diferentes.
- Un fallo no bloquea automáticamente: el JSON debe declarar `continue` o una transición terminal.
- Los objetivos declaran si bloquean un flujo posterior.
- La posición y el objeto objetivo deben referenciar IDs estables.
- No se permiten funciones ni código ejecutable dentro del JSON.
- Las transiciones deben poder validarse como un grafo.
- Los assets visuales futuros deben referenciar recursos permitidos por el proyecto y no descargar contenido implícitamente.

## Importación y exportación

La futura herramienta debe permitir:

- Cargar un nivel JSON local.
- Validar schema y referencias.
- Mostrar errores de configuración legibles.
- Exportar el nivel sin perder IDs ni versionado.
- Exportar mapas de campaña con JSON determinista y cargarlos desde texto JSON.
- Migrar versiones antiguas del schema.
- Generar un resumen de objetivos y flujos.
- Detectar acciones imposibles, objetivos sin salida y referencias inexistentes.

## Separación de responsabilidades

- El JSON define contenido y reglas declarativas.
- El runtime valida y ejecuta comandos.
- Three.js interpreta la sección visual y espacial.
- React presenta objetivos, acciones y resultados.
- Ningún nivel debe requerir editar `GameScene.ts` para colocar un objeto básico.

## Tareas prioritarias

- [x] Diseñar el schema inicial de nivel.
- [x] Extraer posiciones, entidades y reglas de altar, antorchas, puerta y Patio a configuración JSON consumida por runtime.
- [x] Crear loader y validador de configuración.
- [x] Consumir desde runtime labels, keywords, dificultad y coste de reintento.
- [x] Añadir evaluador base de requisitos y efectos sin dependencia de React o Three.js.
- [ ] Crear catálogo de tipos visuales permitidos.
- [x] Crear sistema genérico de objetos interactivos.
- [x] Crear evaluador genérico de requisitos.
- [x] Crear ejecutor base de efectos y transiciones.
- [ ] Parametrizar políticas de éxito, fallo y continuidad.
- [ ] Parametrizar bloqueo de movimiento por acción o flujo.
- [x] Generar objetivos y checks del altar desde la configuración.
- [ ] Añadir validación de grafo narrativo.
- [x] Añadir exportación y carga de mapas de campaña.
- [ ] Añadir migraciones entre versiones.
- [x] Crear un segundo nivel usando únicamente JSON para entidades, bounds, ambiente, NPCs, reliquia y enemigo.

### Auditoría de parametrización

El contenido visible de ambas zonas y sus metadatos de campaña ya provienen de JSON. Permanecen como trabajo posterior el catálogo visual versionado, migraciones de schema, validación de grafo y la extracción completa de políticas técnicas de movimiento/combate.

## Criterios de aceptación

- La cripta actual puede representarse en JSON sin lógica específica del altar en el runtime.
- Un segundo nivel sencillo puede cargarse sin modificar componentes React ni `GameScene.ts`.
- Cambiar una dificultad, etiqueta, posición, requisito o consecuencia no requiere recompilar lógica de gameplay.
- Los checks de éxito y fallo producen los flujos declarados por la configuración.
- Las acciones bloqueantes aparecen en el checklist y las no bloqueantes permiten continuar.
- Un JSON inválido falla con errores concretos antes de iniciar la partida.
- Exportar y volver a importar conserva IDs, objetivos, acciones y consecuencias.
- Exportar y volver a importar un mapa conserva `schemaVersion`, zonas, conexiones, entradas y salidas.
