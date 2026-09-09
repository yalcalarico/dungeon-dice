import type { D20Roll, D20Roller } from '../dice/d20'
import {
  availableAltarActions,
  altarRetryCost,
  createNarrativeEntry,
  identifyAltarAction,
  initialAltarFlags,
  initialChecks,
  initialObjectives,
  resolveAltarAction,
  updateChecks,
  updateObjectives,
  type AltarFlags,
  type Check,
  type NarrativeAction,
  type NarrativeEntry,
  type Objective,
} from '../narrative/altar'
import { cryptOfLunargenta } from '../content'
import { evaluateRequirements } from '../content/runtime'

export type GamePhase = 'exploration' | 'resolving' | 'paused' | 'victory' | 'failure'

export type GameState = {
  phase: GamePhase
  zoneId: string
  entryPointId: string
  visitedZoneIds: string[]
  pausedPhase?: 'exploration' | 'resolving'
  flags: AltarFlags
  entries: NarrativeEntry[]
  availableActions: NarrativeAction[]
  objectives: Objective[]
  checks: Check[]
  lastRoll: D20Roll | null
  lastRollOutcome: 'success' | 'failure' | null
  pendingCheck: { actionId: NarrativeAction['id']; input: string } | null
  movementLocked: boolean
  player: { hp: number; maxHp: number; mp: number; maxMp: number; attributes: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number } }
}

export type GameAction =
  | { type: 'submit-input'; input: string; targetId?: string }
  | { type: 'choose-action'; actionId: NarrativeAction['id']; targetId?: string }
  | { type: 'environment-message'; message: string }
  | { type: 'roll-dice' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'change-zone'; zoneId: string }
  | { type: 'reset' }

export function createInitialGameState(): GameState {
  const flags = initialAltarFlags()

  return {
    phase: 'exploration',
    zoneId: 'crypt-of-lunargenta',
    entryPointId: 'start',
    visitedZoneIds: ['crypt-of-lunargenta'],
    pausedPhase: undefined,
    flags,
    entries: [
      createNarrativeEntry('Narrador', 'La lluvia golpea las bóvedas. Un altar cubierto de ceniza espera en la cripta.'),
      createNarrativeEntry('Sistema', 'Acércate al altar para investigar las runas y comenzar la aventura.', 'muted'),
    ],
    availableActions: availableAltarActions(flags),
    objectives: initialObjectives(),
    checks: initialChecks(),
    lastRoll: null,
    lastRollOutcome: null,
    pendingCheck: null,
    movementLocked: false,
    player: { hp: 18, maxHp: 18, mp: 7, maxMp: 7, attributes: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 } },
  }
}

export function transitionGameState(state: GameState, action: GameAction, roller: D20Roller): GameState {
  if (action.type === 'reset') return createInitialGameState()
  if (action.type === 'pause') {
    if (state.phase !== 'exploration' && state.phase !== 'resolving') return state
    return { ...state, phase: 'paused', pausedPhase: state.phase, movementLocked: true }
  }
  if (action.type === 'resume') {
    if (state.phase !== 'paused') return state
    return { ...state, phase: state.pausedPhase ?? 'exploration', pausedPhase: undefined, movementLocked: state.pausedPhase === 'resolving' }
  }
  if (action.type === 'change-zone') {
    if (!action.zoneId || action.zoneId === state.zoneId) return state
    return {
      ...state,
      phase: 'exploration',
      zoneId: action.zoneId,
      entryPointId: action.zoneId === 'ashen-courtyard' ? 'crypt-gate' : 'start',
      pendingCheck: null,
      availableActions: action.zoneId === 'crypt-of-lunargenta' ? availableAltarActions(state.flags) : [],
      movementLocked: false,
      entries: [...state.entries, createNarrativeEntry('Sistema', `Has entrado en ${action.zoneId === 'ashen-courtyard' ? 'el Patio de Ceniza' : 'la Cripta de Lunargenta'}.`, 'gold')],
    }
  }
  if (state.phase === 'paused' || state.phase === 'victory') return state
  if (action.type === 'environment-message') {
    return { ...state, entries: [...state.entries, createNarrativeEntry('Entorno', action.message, 'muted')] }
  }

  if (action.type === 'roll-dice') {
    const roll = roller.roll()
    if (!state.pendingCheck) return { ...state, lastRoll: roll, lastRollOutcome: null }

    const wisdomModifier = Math.floor((state.player.attributes.wisdom - 10) / 2)
    const resolution = resolveAltarAction(state.pendingCheck.input, state.flags, { roll: () => roll }, wisdomModifier)
    return {
      phase: resolution.outcome ?? (resolution.effects.altarInvestigationFailed ? 'failure' : 'exploration'),
      zoneId: state.zoneId,
      entryPointId: state.entryPointId,
      visitedZoneIds: state.visitedZoneIds,
      flags: { ...state.flags, ...resolution.effects },
      entries: [...state.entries, ...resolution.entries],
      availableActions: resolution.actions,
      lastRoll: roll,
      lastRollOutcome: resolution.rollOutcome ?? null,
      pendingCheck: null,
      movementLocked: resolution.movementLocked ?? state.movementLocked,
      player: state.player,
      objectives: updateObjectives({ ...state.flags, ...resolution.effects }, resolution.outcome ?? (resolution.effects.altarInvestigationFailed ? 'failure' : 'exploration')),
      checks: updateChecks({ ...state.flags, ...resolution.effects }),
    }
  }

  const input = action.type === 'choose-action'
    ? state.availableActions.find((candidate) => candidate.id === action.actionId)?.label ?? ''
    : action.input
  const actionId = action.type === 'choose-action' ? action.actionId : identifyAltarAction(input)
  const targetId = action.targetId
  if (actionId && !isConfiguredActionAllowed(state, actionId, targetId)) {
    return {
      ...state,
      entries: [...state.entries, createNarrativeEntry('Sistema', 'Debes acercarte al objeto correcto para realizar esa acción.', 'muted')],
      lastRollOutcome: null,
    }
  }
  if (actionId === 'retry-altar') {
    if (state.player.hp < altarRetryCost.amount) {
      return {
        ...state,
        entries: [...state.entries, createNarrativeEntry('Sistema', `No tienes suficiente vida para reintentar. Necesitas ${altarRetryCost.amount} HP.`, 'danger')],
        lastRollOutcome: null,
      }
    }

    return {
      ...state,
      phase: 'resolving',
      player: { ...state.player, hp: state.player.hp - altarRetryCost.amount },
      entries: [
        ...state.entries,
        createNarrativeEntry('Tú', input),
        createNarrativeEntry('Sistema', `Sacrificas ${altarRetryCost.amount} HP para volver a intentar la prueba. Lanza el D20.`, 'gold'),
      ],
      availableActions: [],
      pendingCheck: { actionId: 'retry-altar', input: 'volver a intentar' },
      lastRollOutcome: null,
      movementLocked: true,
    }
  }

  const requiresRoll = actionId === 'inspect-altar' && !state.flags.altarInvestigated
  if (requiresRoll) {
    return {
      ...state,
      phase: 'resolving',
      entries: [
        ...state.entries,
        createNarrativeEntry('Tú', input),
        createNarrativeEntry('Sistema', 'El altar exige una prueba. Lanza el D20 para descubrir lo que oculta.', 'gold'),
      ],
      availableActions: [],
      pendingCheck: { actionId: 'inspect-altar', input },
      movementLocked: true,
    }
  }

  const resolution = resolveAltarAction(input, state.flags, roller)

  return {
    phase: resolution.outcome ?? (state.phase === 'failure' ? 'exploration' : state.phase),
    zoneId: state.zoneId,
    entryPointId: state.entryPointId,
    visitedZoneIds: state.visitedZoneIds,
    flags: { ...state.flags, ...resolution.effects },
    entries: [...state.entries, createNarrativeEntry('Tú', input), ...resolution.entries],
    availableActions: resolution.actions,
    lastRoll: resolution.roll?.roll ?? state.lastRoll,
    lastRollOutcome: resolution.rollOutcome ?? null,
    pendingCheck: null,
    movementLocked: resolution.movementLocked ?? state.movementLocked,
    player: state.player,
    objectives: updateObjectives({ ...state.flags, ...resolution.effects }, resolution.outcome ?? (state.phase === 'failure' ? 'exploration' : state.phase)),
    checks: updateChecks({ ...state.flags, ...resolution.effects }),
  }
}

export type GameSnapshot = Readonly<GameState>

export function createGameSnapshot(state: GameState): GameSnapshot {
  return structuredClone(state)
}

export function restoreGameSnapshot(snapshot: GameSnapshot): GameState {
  return structuredClone(snapshot)
}

function isConfiguredActionAllowed(state: GameState, actionId: NarrativeAction['id'], targetId: string | undefined): boolean {
  if (!targetId) return false
  const configuredAction = cryptOfLunargenta.actions.find((candidate) => candidate.id === actionId)
  if (!configuredAction) return false
  const completedObjectives = new Set(state.objectives.filter((objective) => objective.completed).map((objective) => objective.id))
  const spatialRequirements = configuredAction.requires.filter((requirement) => 'nearObject' in requirement)
  return evaluateRequirements(spatialRequirements, { flags: state.flags, completedObjectives, nearbyObjectIds: new Set([targetId, targetId === 'altar' ? 'altar-main' : targetId]) })
}
