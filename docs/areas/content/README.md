# Área: Contenido parametrizable

## Objetivo

Permitir que niveles, objetos, acciones, requisitos, dados, consecuencias y flujos narrativos se definan como datos versionados, exportables e importables, sin tener que modificar TypeScript para crear una nueva aventura.

Esta área es prioritaria antes de construir varios niveles. El código debe interpretar configuraciones, no contener una copia específica de la cripta.

## Estado actual

El proyecto todavía no cumple completamente este objetivo:

- Los IDs y acciones del altar están definidos en `src/narrative/altar.ts`.
- Las posiciones del altar, antorchas y puerta están definidas en `GameScene.ts`.
- Las reglas de requisitos y consecuencias están codificadas en condicionales TypeScript.
- No existe un exportador/importador de niveles.
- No existe todavía exportación/importación ni versionado de migraciones para contenido.

La fundación inicial ya existe: hay schema tipado, JSON de la cripta actual, loader y validación de referencias. El runtime todavía no consume todas las reglas desde ese JSON.

La implementación actual es un vertical slice válido, pero no una arquitectura de niveles parametrizable.

## Contrato de configuración propuesto

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

El formato es una dirección de diseño, no un contrato de producción todavía. Los nombres finales deben establecerse al implementar el schema.

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
- [ ] Extraer toda la geometría y reglas de altar, antorchas y puerta a configuración JSON consumida por runtime.
- [x] Crear loader y validador de configuración.
- [x] Consumir desde runtime labels, keywords, dificultad y coste de reintento.
- [ ] Crear catálogo de tipos visuales permitidos.
- [ ] Crear sistema genérico de objetos interactivos.
- [ ] Crear evaluador genérico de requisitos.
- [ ] Crear ejecutor genérico de efectos y transiciones.
- [ ] Parametrizar políticas de éxito, fallo y continuidad.
- [ ] Parametrizar bloqueo de movimiento por acción o flujo.
- [ ] Generar objetivos y checks desde la configuración.
- [ ] Añadir validación de grafo narrativo.
- [ ] Añadir exportación de la configuración actual.
- [ ] Añadir versionado y migraciones.
- [ ] Crear un segundo nivel usando únicamente JSON.

## Criterios de aceptación

- La cripta actual puede representarse en JSON sin lógica específica del altar en el runtime.
- Un segundo nivel sencillo puede cargarse sin modificar componentes React ni `GameScene.ts`.
- Cambiar una dificultad, etiqueta, posición, requisito o consecuencia no requiere recompilar lógica de gameplay.
- Los checks de éxito y fallo producen los flujos declarados por la configuración.
- Las acciones bloqueantes aparecen en el checklist y las no bloqueantes permiten continuar.
- Un JSON inválido falla con errores concretos antes de iniciar la partida.
- Exportar y volver a importar conserva IDs, objetivos, acciones y consecuencias.
