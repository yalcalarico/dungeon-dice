import { CURRENT_SCHEMA_VERSION, type LevelConfig } from './level-config'

export type LevelValidationError = {
  path: string
  message: string
  severity?: 'error' | 'warning'
  id?: string
  suggestion?: string
}

export type LevelValidationResult =
  | { valid: true; config: LevelConfig; errors: readonly [] }
  | { valid: false; errors: readonly LevelValidationError[] }

export class LevelConfigValidationError extends Error {
  readonly errors: readonly LevelValidationError[]

  constructor(errors: readonly LevelValidationError[]) {
    super(`Invalid level configuration: ${errors.length} error${errors.length === 1 ? '' : 's'}`)
    this.name = 'LevelConfigValidationError'
    this.errors = errors
  }
}

export function validateLevelConfig(input: unknown): LevelValidationResult {
  const errors: LevelValidationError[] = []
  if (!isRecord(input)) return invalid([{ path: '$', message: 'must be an object' }])

  if (input.schemaVersion !== CURRENT_SCHEMA_VERSION) add(errors, '$.schemaVersion', `must be ${CURRENT_SCHEMA_VERSION}`)
  requireString(input, 'id', '$', errors)
  requireString(input, 'title', '$', errors)
  const retryCost = record(input.retryCost, '$.retryCost', errors)
  if (retryCost) {
    requireOneOf(retryCost, 'type', ['hp'], '$.retryCost', errors)
    requireNumber(retryCost, 'amount', '$.retryCost', errors)
    if (isNumber(retryCost.amount) && retryCost.amount <= 0) add(errors, '$.retryCost.amount', 'must be greater than zero')
  }
  const scene = record(input.scene, '$.scene', errors)
  if (scene) validateScene(scene, errors)

  const objects = array(input.objects, '$.objects', errors)
  const objectives = array(input.objectives, '$.objectives', errors)
  const checks = array(input.checks, '$.checks', errors)
  const actions = array(input.actions, '$.actions', errors)
  const victory = record(input.victory, '$.victory', errors)

  const objectIds = validateObjects(objects, errors)
  const objectiveIds = validateObjectives(objectives, errors)
  const checkIds = validateChecks(checks, errors)
  const actionIds = validateActions(actions, errors)
  validateObjectActionReferences(objects, actionIds, errors)
  validateActionReferences(actions, checkIds, objectIds, objectiveIds, errors)
  validateCheckReferences(checks, objectiveIds, errors)
  if (victory) validateRequirements(victory.requires, '$.victory.requires', errors, objectIds, objectiveIds)

  validateGlobalIds([
    ['objects', objectIds],
    ['objectives', objectiveIds],
    ['checks', checkIds],
    ['actions', actionIds],
  ], errors)

  if (errors.length > 0) return invalid(errors)
  return { valid: true, config: input as unknown as LevelConfig, errors: [] }
}

export function loadLevelConfig(input: unknown): LevelConfig {
  const result = validateLevelConfig(input)
  if (!result.valid) throw new LevelConfigValidationError(result.errors)
  return result.config
}

function validateScene(scene: Record<string, unknown>, errors: LevelValidationError[]) {
  const bounds = record(scene.bounds, '$.scene.bounds', errors)
  if (bounds) {
    for (const key of ['minX', 'maxX', 'minZ', 'maxZ']) requireNumber(bounds, key, '$.scene.bounds', errors)
    if (isNumber(bounds.minX) && isNumber(bounds.maxX) && bounds.minX >= bounds.maxX) add(errors, '$.scene.bounds', 'minX must be less than maxX')
    if (isNumber(bounds.minZ) && isNumber(bounds.maxZ) && bounds.minZ >= bounds.maxZ) add(errors, '$.scene.bounds', 'minZ must be less than maxZ')
  }
  const environment = record(scene.environment, '$.scene.environment', errors)
  if (!environment) return
  const rain = record(environment.rain, '$.scene.environment.rain', errors)
  if (rain) {
    requireBoolean(rain, 'enabled', '$.scene.environment.rain', errors)
    requireNumber(rain, 'density', '$.scene.environment.rain', errors)
    requireNumber(rain, 'speed', '$.scene.environment.rain', errors)
  }
  const floor = record(environment.floor, '$.scene.environment.floor', errors)
  if (floor) {
    requireNumber(floor, 'wetness', '$.scene.environment.floor', errors)
    requireBoolean(floor, 'puddles', '$.scene.environment.floor', errors)
  }
}

function validateObjects(items: unknown[], errors: LevelValidationError[]): Set<string> {
  const ids = collectIds(items, '$.objects', errors)
  items.forEach((item, index) => {
    const path = `$.objects[${index}]`
    const object = record(item, path, errors)
    if (!object) return
    requireString(object, 'id', path, errors)
    requireOneOf(object, 'type', ['altar', 'torch', 'exit-door'], path, errors)
    const position = record(object.position, `${path}.position`, errors)
    if (position) for (const key of ['x', 'y', 'z']) requireNumber(position, key, `${path}.position`, errors)
    const interaction = object.interaction === undefined ? undefined : record(object.interaction, `${path}.interaction`, errors)
    if (interaction) {
      requireNumber(interaction, 'radius', `${path}.interaction`, errors)
      if (isNumber(interaction.radius) && interaction.radius <= 0) add(errors, `${path}.interaction.radius`, 'must be greater than zero')
      strings(interaction.actions, `${path}.interaction.actions`, errors)
    }
  })
  return ids
}

function validateObjectives(items: unknown[], errors: LevelValidationError[]): Set<string> {
  const ids = collectIds(items, '$.objectives', errors)
  items.forEach((item, index) => {
    const path = `$.objectives[${index}]`
    const objective = record(item, path, errors)
    if (!objective) return
    requireString(objective, 'id', path, errors)
    requireString(objective, 'label', path, errors)
    requireBoolean(objective, 'blocking', path, errors)
    const completion = record(objective.completion, `${path}.completion`, errors)
    if (completion) requireString(completion, 'flag', `${path}.completion`, errors)
  })
  return ids
}

function validateChecks(items: unknown[], errors: LevelValidationError[]): Set<string> {
  const ids = collectIds(items, '$.checks', errors)
  items.forEach((item, index) => {
    const path = `$.checks[${index}]`
    const check = record(item, path, errors)
    if (!check) return
    requireString(check, 'id', path, errors); requireString(check, 'label', path, errors)
    requireOneOf(check, 'die', ['d20'], path, errors); requireNumber(check, 'difficulty', path, errors)
    validateOutcome(check.onSuccess, `${path}.onSuccess`, errors)
    validateOutcome(check.onFailure, `${path}.onFailure`, errors)
  })
  return ids
}

function validateActions(items: unknown[], errors: LevelValidationError[]): Set<string> {
  const ids = collectIds(items, '$.actions', errors)
  items.forEach((item, index) => {
    const path = `$.actions[${index}]`
    const action = record(item, path, errors)
    if (!action) return
    requireString(action, 'id', path, errors); requireString(action, 'label', path, errors)
    strings(action.keywords, `${path}.keywords`, errors)
    const movement = record(action.movement, `${path}.movement`, errors)
    if (movement) { requireOneOf(movement, 'during', ['locked', 'allowed'], `${path}.movement`, errors); requireOneOf(movement, 'after', ['locked', 'allowed'], `${path}.movement`, errors) }
  })
  return ids
}

function validateOutcome(value: unknown, path: string, errors: LevelValidationError[], objectiveIds?: Set<string>) {
  const outcome = record(value, path, errors)
  if (!outcome) return
  validateEffects(outcome.effects, `${path}.effects`, errors, objectiveIds)
  if (outcome.continue !== undefined) requireBoolean(outcome, 'continue', path, errors)
  if (outcome.terminal !== undefined) requireString(outcome, 'terminal', path, errors)
}

function validateRequirements(value: unknown, path: string, errors: LevelValidationError[], objectIds: Set<string>, objectiveIds: Set<string>) {
  if (!Array.isArray(value)) { add(errors, path, 'must be an array'); return }
  value.forEach((item, index) => {
    const requirement = record(item, `${path}[${index}]`, errors)
    if (!requirement) return
    const keys = Object.keys(requirement)
    if (keys.length !== 1 || !['nearObject', 'objectiveCompleted', 'flag'].includes(keys[0])) add(errors, `${path}[${index}]`, 'must contain exactly one supported requirement')
    if (requirement.nearObject !== undefined) reference(requirement.nearObject, objectIds, `${path}[${index}].nearObject`, errors, 'object')
    if (requirement.objectiveCompleted !== undefined) reference(requirement.objectiveCompleted, objectiveIds, `${path}[${index}].objectiveCompleted`, errors, 'objective')
    if (requirement.flag !== undefined) requireString(requirement, 'flag', `${path}[${index}]`, errors)
  })
}

function validateEffects(value: unknown, path: string, errors: LevelValidationError[], objectiveIds?: Set<string>) {
  if (!Array.isArray(value)) { add(errors, path, 'must be an array'); return }
  value.forEach((item, index) => {
    const effect = record(item, `${path}[${index}]`, errors)
    if (!effect) return
    const keys = Object.keys(effect)
    if (keys.length !== 1 || !['setFlag', 'completeObjective'].includes(keys[0])) add(errors, `${path}[${index}]`, 'must contain exactly one supported effect')
    if (effect.setFlag !== undefined) requireString(effect, 'setFlag', `${path}[${index}]`, errors)
    if (effect.completeObjective !== undefined && objectiveIds) reference(effect.completeObjective, objectiveIds, `${path}[${index}].completeObjective`, errors, 'objective')
  })
}

function validateGlobalIds(groups: Array<[string, Set<string>]>, errors: LevelValidationError[]) {
  const seen = new Map<string, string>()
  for (const [group, ids] of groups) for (const id of ids) {
    const previous = seen.get(id)
    if (previous) add(errors, `$.${group}`, `ID "${id}" is already used in ${previous}`)
    else seen.set(id, group)
  }
}

function validateObjectActionReferences(items: unknown[], actionIds: Set<string>, errors: LevelValidationError[]) {
  items.forEach((item, index) => {
    const interaction = isRecord(item) && isRecord(item.interaction) ? item.interaction : undefined
    if (!interaction) return
    const values = strings(interaction.actions, `$.objects[${index}].interaction.actions`, errors)
    values.forEach((value, actionIndex) => reference(value, actionIds, `$.objects[${index}].interaction.actions[${actionIndex}]`, errors, 'action'))
  })
}

function validateActionReferences(items: unknown[], checkIds: Set<string>, objectIds: Set<string>, objectiveIds: Set<string>, errors: LevelValidationError[]) {
  items.forEach((item, index) => {
    if (!isRecord(item)) return
    const path = `$.actions[${index}]`
    if (item.check !== undefined) reference(item.check, checkIds, `${path}.check`, errors, 'check')
    validateRequirements(item.requires, `${path}.requires`, errors, objectIds, objectiveIds)
    validateEffects(item.effects, `${path}.effects`, errors, objectiveIds)
  })
}

function validateCheckReferences(items: unknown[], objectiveIds: Set<string>, errors: LevelValidationError[]) {
  items.forEach((item, index) => {
    if (!isRecord(item)) return
    validateOutcome(item.onSuccess, `$.checks[${index}].onSuccess`, errors, objectiveIds)
    validateOutcome(item.onFailure, `$.checks[${index}].onFailure`, errors, objectiveIds)
  })
}

function collectIds(items: unknown[], path: string, errors: LevelValidationError[]): Set<string> {
  const ids = new Set<string>()
  items.forEach((item, index) => { const value = record(item, `${path}[${index}]`, errors)?.id; if (typeof value === 'string') { if (ids.has(value)) add(errors, `${path}[${index}].id`, `duplicate ID "${value}"`); ids.add(value) } })
  return ids
}

function reference(value: unknown, ids: Set<string>, path: string, errors: LevelValidationError[], kind: string) {
  if (!isString(value)) { add(errors, path, 'must be a string'); return }
  if (!ids.has(value)) add(errors, path, `unknown ${kind} reference "${value}"`)
}

function strings(value: unknown, path: string, errors: LevelValidationError[]): string[] { if (!Array.isArray(value)) { add(errors, path, 'must be an array'); return [] } return value.filter((item) => { if (!isString(item)) { add(errors, path, 'must contain only strings'); return false }; return true }) as string[] }
function record(value: unknown, path: string, errors: LevelValidationError[]): Record<string, unknown> | null { if (!isRecord(value)) { add(errors, path, 'must be an object'); return null }; return value }
function array(value: unknown, path: string, errors: LevelValidationError[]): unknown[] { if (!Array.isArray(value)) { add(errors, path, 'must be an array'); return [] }; return value }
function requireString(object: Record<string, unknown>, key: string, path: string, errors: LevelValidationError[]): string | undefined { if (!isString(object[key])) { add(errors, `${path}.${key}`, 'must be a string'); return undefined }; return object[key] }
function requireNumber(object: Record<string, unknown>, key: string, path: string, errors: LevelValidationError[]) { if (!isNumber(object[key])) add(errors, `${path}.${key}`, 'must be a finite number') }
function requireBoolean(object: Record<string, unknown>, key: string, path: string, errors: LevelValidationError[]) { if (typeof object[key] !== 'boolean') add(errors, `${path}.${key}`, 'must be a boolean') }
function requireOneOf(object: Record<string, unknown>, key: string, values: string[], path: string, errors: LevelValidationError[]) { if (!isString(object[key])) { add(errors, `${path}.${key}`, 'must be a string'); return }; if (!values.includes(object[key])) add(errors, `${path}.${key}`, `must be one of: ${values.join(', ')}`) }
function add(errors: LevelValidationError[], path: string, message: string) { errors.push({ path, message }) }
function invalid(errors: LevelValidationError[]): LevelValidationResult { return { valid: false, errors } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isString(value: unknown): value is string { return typeof value === 'string' && value.length > 0 }
function isNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
