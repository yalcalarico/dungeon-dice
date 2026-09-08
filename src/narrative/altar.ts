import { resolveCheck, type CheckResult, type DiceCheck, type D20Roller } from '../dice/d20'
import { cryptOfLunargenta } from '../content'

export type NarrativeEntry = {
  speaker: 'Narrador' | 'Sistema' | 'D20' | 'Tú' | 'Entorno'
  text: string
  tone?: 'gold' | 'muted' | 'danger'
  timestamp: number
}

export function createNarrativeEntry(speaker: NarrativeEntry['speaker'], text: string, tone?: NarrativeEntry['tone']): NarrativeEntry {
  return { speaker, text, tone, timestamp: Date.now() }
}

export type AltarFlags = {
  altarInvestigated: boolean
  altarInvestigationSucceeded: boolean
  altarInvestigationFailed: boolean
  torchLit?: boolean
  exitOpened?: boolean
}

export type ObjectiveId = 'investigate-altar' | 'light-torch' | 'open-exit'

export type Objective = {
  id: ObjectiveId
  label: string
  completed: boolean
  blocked: boolean
}

export type CheckId = 'altar-investigation'

export type Check = {
  id: CheckId
  label: string
  difficulty: number
  completed: boolean
  blocked: boolean
}

export type AltarActionId = 'inspect-altar' | 'retry-altar' | 'inspect-torch' | 'light-torch' | 'open-exit'

export type RetryCost = { type: 'hp'; amount: number }

export const altarRetryCost: RetryCost = cryptOfLunargenta.retryCost

export type NarrativeAction = {
  id: AltarActionId
  label: string
  keywords: string[]
}

export type AltarResolution = {
  entries: NarrativeEntry[]
  actions: NarrativeAction[]
  effects: Partial<AltarFlags>
  roll: CheckResult | null
  movementLocked?: boolean
  outcome?: 'victory' | 'failure'
  rollOutcome?: 'success' | 'failure'
}

export const altarInvestigationCheck: DiceCheck = {
  ability: 'wisdom',
  difficulty: cryptOfLunargenta.checks.find((check) => check.id === 'altar-investigation')?.difficulty ?? 0,
  modifier: 0,
}

function objectiveLabel(id: ObjectiveId): string {
  return cryptOfLunargenta.objectives.find((objective) => objective.id === `objective-${id}`)?.label ?? id
}

function actionFromConfig(id: AltarActionId): NarrativeAction {
  const action = cryptOfLunargenta.actions.find((candidate) => candidate.id === id)
  if (!action) throw new Error(`Missing configured altar action: ${id}`)
  return { id, label: action.label, keywords: action.keywords }
}

export function initialObjectives(): Objective[] {
  return [
    { id: 'investigate-altar', label: objectiveLabel('investigate-altar'), completed: false, blocked: false },
    { id: 'light-torch', label: objectiveLabel('light-torch'), completed: false, blocked: true },
    { id: 'open-exit', label: objectiveLabel('open-exit'), completed: false, blocked: true },
  ]
}

export function updateObjectives(flags: AltarFlags, phase: 'exploration' | 'resolving' | 'victory' | 'failure'): Objective[] {
  const investigated = flags.altarInvestigated
  const torchLit = flags.torchLit === true

  return [
    { id: 'investigate-altar', label: objectiveLabel('investigate-altar'), completed: investigated, blocked: false },
    { id: 'light-torch', label: objectiveLabel('light-torch'), completed: torchLit, blocked: !investigated },
    { id: 'open-exit', label: objectiveLabel('open-exit'), completed: flags.exitOpened === true || phase === 'victory', blocked: !torchLit },
  ]
}

export function initialChecks(): Check[] {
  return [{ id: 'altar-investigation', label: checkLabel(), difficulty: altarInvestigationCheck.difficulty, completed: false, blocked: false }]
}

export function updateChecks(flags: AltarFlags): Check[] {
  return [{
    id: 'altar-investigation',
    label: checkLabel(),
    difficulty: altarInvestigationCheck.difficulty,
    completed: flags.altarInvestigationSucceeded,
    blocked: false,
  }]
}

export const altarActions: Readonly<Record<AltarActionId, NarrativeAction>> = {
  'inspect-altar': actionFromConfig('inspect-altar'),
  'retry-altar': actionFromConfig('retry-altar'),
  'inspect-torch': actionFromConfig('inspect-torch'),
  'light-torch': actionFromConfig('light-torch'),
  'open-exit': actionFromConfig('open-exit'),
}

function checkLabel(): string {
  return cryptOfLunargenta.checks.find((check) => check.id === 'altar-investigation')?.label ?? 'altar-investigation'
}

export function initialAltarFlags(): AltarFlags {
  return {
    altarInvestigated: false,
    altarInvestigationSucceeded: false,
    altarInvestigationFailed: false,
    torchLit: false,
    exitOpened: false,
  }
}

export function availableAltarActions(flags: AltarFlags): NarrativeAction[] {
  if (!flags.altarInvestigated) return [altarActions['inspect-altar']]
  if (flags.altarInvestigationFailed && !flags.altarInvestigationSucceeded) return [altarActions['retry-altar']]
  if (!flags.torchLit) return [altarActions['inspect-torch'], altarActions['light-torch']]
  return [altarActions['open-exit']]
}

export function resolveAltarAction(input: string, flags: AltarFlags, roller: D20Roller, modifier = 0): AltarResolution {
  const actionId = identifyAltarAction(input)

  if ((actionId === 'inspect-altar' || actionId === 'retry-altar') && (!flags.altarInvestigated || flags.altarInvestigationFailed)) {
    const roll = resolveAltarInvestigation(roller, modifier)
    const success = roll.success

    return {
      roll,
      effects: {
        altarInvestigated: true,
        altarInvestigationSucceeded: success,
        altarInvestigationFailed: !success,
      },
      entries: success
        ? [
            createNarrativeEntry('D20', `Sabiduría / Investigación: d20 ${roll.roll.value} ${roll.roll.modifier >= 0 ? '+' : ''}${roll.roll.modifier} = ${roll.roll.total} contra ${roll.check.difficulty}.`, 'gold'),
            createNarrativeEntry('Sistema', `Prueba superada: total ${roll.roll.total} contra dificultad ${roll.check.difficulty}. Éxito.`, 'gold'),
            createNarrativeEntry('Narrador', 'Encuentras una runa tibia bajo la ceniza. El altar te reconoce.', 'gold'),
          ]
        : [
            createNarrativeEntry('D20', `Sabiduría / Investigación: d20 ${roll.roll.value} ${roll.roll.modifier >= 0 ? '+' : ''}${roll.roll.modifier} = ${roll.roll.total} contra ${roll.check.difficulty}.`, 'danger'),
            createNarrativeEntry('Narrador', 'La ceniza se arremolina y oculta la inscripción. Algo en el altar queda despierto.', 'danger'),
          ],
      actions: availableAltarActions({ ...flags, ...{ altarInvestigated: true, altarInvestigationSucceeded: success, altarInvestigationFailed: !success } }),
      movementLocked: false,
      outcome: success ? undefined : 'failure',
      rollOutcome: success ? 'success' : 'failure',
    }
  }

  if (actionId === 'inspect-torch' && flags.altarInvestigated) {
    return {
      roll: null,
      effects: {},
      entries: [createNarrativeEntry('Narrador', 'La antorcha está fría, pero la runa del altar dejó una chispa atrapada en su mecha.', 'muted')],
      actions: availableAltarActions(flags),
      movementLocked: false,
    }
  }

  if (actionId === 'light-torch' && flags.altarInvestigated && !flags.torchLit) {
    const nextFlags = { ...flags, torchLit: true }
    return {
      roll: null,
      effects: { torchLit: true },
      entries: [createNarrativeEntry('Narrador', 'La chispa de la runa prende la antorcha. Al fondo, la puerta de salida despierta.', 'gold')],
      actions: availableAltarActions(nextFlags),
      movementLocked: false,
    }
  }

  if (actionId === 'open-exit' && flags.altarInvestigated && flags.torchLit) {
    return {
      roll: null,
      effects: { exitOpened: true },
      entries: [createNarrativeEntry('Narrador', 'La puerta se abre con un trueno suave. Más allá espera el Patio de Ceniza.', 'gold')],
      actions: [],
      movementLocked: false,
    }
  }

  if (actionId === 'open-exit') {
    const missing = !flags.altarInvestigated ? 'investigar el altar y encender la antorcha' : 'encender la antorcha'
    return {
      roll: null,
      effects: {},
      entries: [createNarrativeEntry('Sistema', `La puerta permanece sellada. Debes ${missing} antes de abrir la salida.`, 'danger')],
      actions: availableAltarActions(flags),
      movementLocked: false,
    }
  }

  return {
    roll: null,
    effects: {},
    entries: [
      createNarrativeEntry('Sistema', 'Esa acción no está disponible todavía. Examina el altar y sigue las pistas.', 'muted'),
    ],
    actions: availableAltarActions(flags),
    movementLocked: flags.altarInvestigated ? false : undefined,
  }
}

function resolveAltarInvestigation(roller: D20Roller, modifier: number): CheckResult {
  return resolveCheck({ ...altarInvestigationCheck, modifier }, roller)
}

export function identifyAltarAction(input: string): AltarActionId | null {
  const normalized = normalize(input)

  for (const action of Object.values(altarActions)) {
    if (action.keywords.some((keyword) => normalized === normalize(keyword))) return action.id
  }

  return null
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}
