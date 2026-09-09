# Área: Personajes y progresión

## Objetivo

Permitir que el jugador cree o cargue un personaje antes de iniciar un nivel, juegue con sus atributos y recursos, gane experiencia por logros relevantes y progrese sin perder coherencia entre niveles.

El sistema será compatible con una experiencia d20 de fantasía, pero los nombres, textos, clases y reglas concretas deberán ser propios o utilizar contenido con licencia compatible.

## Alcance de la primera implementación

La demo debe poder:

- Crear un personaje local.
- Elegir nombre, origen/arquetipo y valores iniciales.
- Cargar un personaje guardado.
- Mostrar HP, MP y atributos en la UI.
- Utilizar los atributos en checks.
- Aplicar costes de HP, MP u otros recursos.
- Ganar experiencia por objetivos configurados.
- Evitar dar experiencia por cada click, movimiento o texto narrativo.
- Guardar progreso local con un formato versionado.

## Modelo de personaje propuesto

```ts
type Character = {
  schemaVersion: number
  id: string
  name: string
  originId: string
  archetypeId: string
  level: number
  experience: number
  attributes: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  resources: {
    hp: number
    maxHp: number
    mp: number
    maxMp: number
  }
  inventory: string[]
  abilities: string[]
  completedMilestones: string[]
}
```

## Atributos y modificadores

Los checks deben declarar el atributo utilizado y calcular el modificador mediante una regla configurable:

```text
modificador = floor((atributo - 10) / 2)
total = d20 + modificador
```

El runtime no debe asumir que todos los checks usan Sabiduría. El nivel JSON debe declarar atributo, dificultad y consecuencias.

## Creación y carga

### Creación

- Validar nombre.
- Seleccionar origen.
- Seleccionar arquetipo.
- Asignar atributos dentro de límites.
- Calcular recursos derivados.
- Mostrar resumen antes de confirmar.
- Crear un ID estable.

### Carga

- Cargar desde almacenamiento local inicialmente.
- Validar schema y rangos.
- Rechazar datos corruptos sin romper una partida nueva.
- Migrar versiones anteriores.
- No confiar en datos del cliente cuando exista backend.

## Experiencia y progresión

La experiencia se otorga mediante recompensas declarativas, no por cualquier actividad.

### Candidatos válidos para experiencia

- Completar un objetivo marcado como recompensable.
- Resolver una escena importante.
- Superar o sobrevivir a un encuentro relevante.
- Descubrir una ubicación o secreto marcado.
- Completar una misión.
- Tomar una decisión narrativa con milestone explícito.

### Actividades que no deben dar experiencia automáticamente

- Repetir una tirada sin cambiar el estado.
- Pulsar varias veces la misma acción.
- Caminar sin descubrir nada.
- Abrir o cerrar un panel.
- Recibir mensajes ambientales.
- Repetir un objetivo ya recompensado.

### Recompensa declarativa

```json
{
  "id": "milestone-altar-discovered",
  "trigger": { "flag": "altarInvestigationSucceeded" },
  "experience": 25,
  "once": true,
  "label": "Descubriste el secreto del altar"
}
```

El campo `once` evita duplicar experiencia por reintentos o eventos repetidos.

## Niveles y recursos

- Definir tabla de experiencia por nivel.
- Aplicar una sola subida por transición válida.
- Conservar experiencia sobrante.
- Declarar recompensas de nivel.
- Validar límites de atributos.
- Registrar cada subida en el historial.
- Separar recompensas de gameplay y cosméticas.
- Mantener HP y MP en el modelo, nunca en CSS o JSX.
- Impedir que HP o MP superen máximos o bajen de cero.
- Comunicar el coste antes de confirmar una acción.

La primera demo puede otorgar experiencia por completar la investigación, encender la antorcha o abrir la salida según la configuración del nivel. La decisión debe estar en JSON y no en una condición específica de `altar.ts`.

## Integración con niveles

El nivel JSON debe poder declarar:

- Check y atributo requerido.
- Coste de HP/MP.
- Recompensa de experiencia.
- Requisito de nivel.
- Recompensas de milestone.
- Efectos sobre flags y objetivos.
- Política de movimiento.

El personaje no debe conocer detalles de la cripta. El nivel tampoco debe mutar directamente componentes UI.

## Fases de implementación

1. Modelo tipado de personaje, atributos y recursos.
2. Creación local con validación.
3. Carga y guardado versionado.
4. Modificadores de atributos en checks.
5. Costes HP/MP genéricos.
6. Recompensas de experiencia declarativas.
7. Tabla de niveles y recompensas.
8. Integración con selección de nivel.
9. Migración a backend cuando exista autenticación.

## Tareas

- [x] Crear schema versionado de personaje.
- [x] Crear validador de personaje.
- [x] Crear catálogo de orígenes y arquetipos propios.
- [ ] Crear pantalla de creación.
- [ ] Crear pantalla de selección/carga.
- [ ] Extraer HP y MP al modelo de personaje.
- [ ] Añadir modificadores de atributos a checks.
- [ ] Generalizar costes de recursos.
- [x] Crear eventos de recompensa de experiencia.
- [x] Crear milestones configurables por nivel.
- [x] Añadir tabla versionada de progresión y resolución idempotente de milestones.
- [ ] Crear tabla de experiencia y niveles.
- [x] Implementar guardado/carga local.
- [ ] Añadir migraciones de schema.
- [ ] Añadir tests unitarios e integración por cada sistema.

## Criterios de aceptación

- Un personaje puede crearse, validarse y cargarse antes de jugar.
- HP y MP de la UI reflejan el estado real y se actualizan con transición animada.
- Un check utiliza el atributo declarado por su configuración.
- Un coste de reintento puede ser HP hoy y otro recurso en el futuro.
- Completar un milestone otorga experiencia una sola vez.
- Repetir una acción sin cambio de estado no otorga experiencia.
- La progresión queda guardada y puede recuperarse.
- Un personaje inválido no puede iniciar un nivel.
- La lógica puede probarse sin Three.js ni navegador.

## Criterio de balance inicial (S13)

La primera pasada compara cada arquetipo con reglas puras en `src/characters/balance.ts`:

- **Recursos iniciales:** se usan `maxHp` y `maxMp`; el rango permitido es 12-26 HP y 4-14 MP.
- **Modificador ofensivo:** es el mayor modificador entre Fuerza, Destreza e Inteligencia.
- **Modificador defensivo:** es el mayor modificador entre Constitución, Destreza y Sabiduría.
- **Supervivencia mínima:** `maxHp + max(0, modificador defensivo) * 2`. Es un proxy de dos impactos mitigados, no una predicción de una campaña.
- **Límites de comparación:** la supervivencia mínima no puede ser menor que 16 y la diferencia entre el mayor y el menor valor no puede superar 12.
- **No dominancia:** ningún arquetipo puede ser igual o mejor en HP, MP, ataque, defensa y supervivencia, siendo estrictamente mejor en al menos una métrica.

Estos límites solo validan el presupuesto inicial. No sustituyen pruebas internas de campaña: S13 aún debe medir rutas completas, tiempo hasta la primera recompensa y derrotas antes de cerrar el balance.
