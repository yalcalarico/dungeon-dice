import type { GameState } from './game-state'
import { INPUT_LIMITS, parseJsonWithinLimits } from '../security/input-limits'

export const STATE_SCHEMA_VERSION = 1 as const

export type PersistedGameState = {
  schemaVersion: typeof STATE_SCHEMA_VERSION
  state: GameState
}

export class StateValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StateValidationError'
  }
}

export function serializeGameState(state: GameState): string {
  validateGameState(state)
  const payload: PersistedGameState = { schemaVersion: STATE_SCHEMA_VERSION, state }
  const serialized = JSON.stringify(payload)
  if (new TextEncoder().encode(serialized).byteLength > INPUT_LIMITS.maxJsonBytes) throw new StateValidationError('El estado supera el límite de tamaño permitido.')
  return serialized
}

export function deserializeGameState(serialized: string): GameState {
  let input: unknown
  try {
    input = parseJsonWithinLimits(serialized)
  } catch (error) {
    throw new StateValidationError(error instanceof Error ? error.message.replace('El JSON', 'El guardado').replace('El contenido', 'El guardado') : 'El guardado no es válido.')
  }
  return migratePersistedState(input).state
}

export function migratePersistedState(input: unknown): PersistedGameState {
  if (!isRecord(input)) throw new StateValidationError('El guardado debe ser un objeto.')

  if (input.schemaVersion === STATE_SCHEMA_VERSION) {
    if (!('state' in input)) throw new StateValidationError('Falta el estado dentro del guardado.')
    validateGameState(input.state)
    return { schemaVersion: STATE_SCHEMA_VERSION, state: input.state as GameState }
  }

  if (input.schemaVersion === undefined || input.schemaVersion === 0) {
    const legacy = { ...input }
    delete legacy.schemaVersion
    if (legacy.pausedPhase === undefined) legacy.pausedPhase = undefined
    if (isRecord(legacy.flags) && legacy.flags.exitOpened === undefined) legacy.flags.exitOpened = false
    validateGameState(legacy)
    return { schemaVersion: STATE_SCHEMA_VERSION, state: legacy as unknown as GameState }
  }

  throw new StateValidationError(`Versión de guardado no soportada: ${String(input.schemaVersion)}.`)
}

export function validateGameState(value: unknown): asserts value is GameState {
  if (!isRecord(value)) throw new StateValidationError('El estado debe ser un objeto.')
  if (!['exploration', 'resolving', 'paused', 'victory', 'failure'].includes(value.phase as string)) throw new StateValidationError('La fase del estado no es válida.')
  if (typeof value.zoneId !== 'string' || typeof value.entryPointId !== 'string' || !isStringArray(value.visitedZoneIds)) throw new StateValidationError('La ubicación de la sesión no es válida.')
  if (value.phase === 'paused' && !['exploration', 'resolving'].includes(value.pausedPhase as string)) throw new StateValidationError('Una partida pausada debe conservar su fase anterior.')
  if (!isRecord(value.flags) || !isBoolean(value.flags.altarInvestigated) || !isBoolean(value.flags.altarInvestigationSucceeded) || !isBoolean(value.flags.altarInvestigationFailed)) throw new StateValidationError('Las flags del estado no son válidas.')
  if (!isArray(value.entries) || !isArray(value.availableActions) || !isArray(value.objectives) || !isArray(value.checks)) throw new StateValidationError('Las colecciones del estado no son válidas.')
  if (!isRecord(value.player) || !validResource(value.player.hp, value.player.maxHp) || !validResource(value.player.mp, value.player.maxMp) || !optionalPositiveInteger(value.player.level) || !optionalNonNegativeNumber(value.player.experience) || !optionalStringArray(value.player.inventory) || !validAttributes(value.player.attributes)) throw new StateValidationError('Los recursos del jugador no son válidos.')
  if (value.pendingCheck !== null && !isRecord(value.pendingCheck)) throw new StateValidationError('La prueba pendiente no es válida.')
}

function validResource(current: unknown, maximum: unknown): boolean {
  return isFiniteNumber(current) && isFiniteNumber(maximum) && current >= 0 && maximum >= 0 && current <= maximum
}

function validAttributes(value: unknown): boolean {
  return isRecord(value) && ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].every((key) => Number.isInteger(value[key]) && (value[key] as number) >= 1 && (value[key] as number) <= 20)
}

function optionalPositiveInteger(value: unknown): boolean { return value === undefined || (typeof value === 'number' && Number.isInteger(value) && value >= 1) }
function optionalNonNegativeNumber(value: unknown): boolean { return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value >= 0) }
function optionalStringArray(value: unknown): boolean { return value === undefined || isStringArray(value) }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isArray(value: unknown): value is unknown[] { return Array.isArray(value) }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === 'string') }
function isBoolean(value: unknown): value is boolean { return typeof value === 'boolean' }
function isFiniteNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
