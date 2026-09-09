# Área: Narrativa

## Objetivo

Permitir jugar desde el primer arranque mediante texto, opciones contextuales y consecuencias persistentes.

## Modelo

Una acción narrativa debe declarar etiqueta, intención, requisitos opcionales, prueba opcional, efectos y siguiente nodo.

```ts
type NarrativeChoice = {
  id: string;
  label: string;
  keywords: string[];
  requirements?: Requirement[];
  check?: DiceCheck;
  effects: Effect[];
  nextNode?: string;
};
```

## Parser inicial

Será determinista, local y sin dependencia de IA. Debe normalizar mayúsculas, acentos y expresiones equivalentes. Si no encuentra una intención válida, responderá con una explicación contextual.

La implementación actual es específica del altar. La parametrización de acciones, requisitos, checks, efectos y transiciones queda definida en [Contenido parametrizable](../content/README.md) y es necesaria antes de crear varios niveles.

## Tareas

- [x] Definir tipos de nodos, elecciones, requisitos y efectos.
- [x] Crear datos iniciales del altar.
- [x] Implementar normalización de texto.
- [x] Implementar detección de intención.
- [x] Implementar validación contextual.
- [x] Implementar respuestas para acciones inválidas.
- [x] Implementar historial de narrativa inicial.
- [x] Permitir que una prueba controle temporalmente el movimiento del jugador.
- [x] Definir objetivos, checks y resultados explícitos de éxito/fallo.
- [x] Permitir continuar hacia las antorchas aunque falle la prueba del altar.
- [x] Permitir reintentar una prueba fallida mediante un coste de vida parametrizable.
- [ ] Migrar las acciones actuales a configuración declarativa JSON.
- [ ] Implementar ramificación por flags.
- [x] Escribir la ruta completa del altar a la puerta.
- [ ] Añadir tests de sinónimos y acciones imposibles.

## Criterios de aceptación

- Una acción válida escrita produce el mismo efecto que su opción sugerida equivalente.
- Una acción inválida no cambia el estado del juego y devuelve una respuesta contextual.
- Las elecciones disponibles cambian según posición, flags y progreso.
- La narrativa conserva el historial durante la sesión.
- La ruta principal puede completarse sin depender de una conexión de red o de IA externa.
