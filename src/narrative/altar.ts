import { resolveCheck, type CheckResult, type DiceCheck, type D20Roller } from '../dice/d20'
import { applyEffects, evaluateRequirements, type RuntimeEffects } from '../content/runtime'
import { campaignLevels, cryptOfLunargenta, type LevelAction, type LevelCheck, type LevelConfig } from '../content'

export type NarrativeEntry = { speaker: 'Narrador' | 'Sistema' | 'D20' | 'Tú' | 'Entorno'; text: string; tone?: 'gold' | 'muted' | 'danger'; timestamp: number }
export function createNarrativeEntry(speaker: NarrativeEntry['speaker'], text: string, tone?: NarrativeEntry['tone']): NarrativeEntry { return { speaker, text, tone, timestamp: Date.now() } }

export type AltarFlags = { altarInvestigated: boolean; altarInvestigationSucceeded: boolean; altarInvestigationFailed: boolean; torchLit?: boolean; exitOpened?: boolean }
export type ObjectiveId = 'investigate-altar' | 'light-torch' | 'open-exit'
export type Objective = { id: ObjectiveId; label: string; completed: boolean; blocked: boolean }
export type CheckId = 'altar-investigation'
export type Check = { id: CheckId; label: string; difficulty: number; completed: boolean; blocked: boolean }
export type AltarActionId = 'inspect-altar' | 'retry-altar' | 'inspect-torch' | 'light-torch' | 'open-exit'
export type RetryCost = { type: 'hp'; amount: number }
export const altarRetryCost: RetryCost = cryptOfLunargenta.retryCost
export type NarrativeAction = { id: AltarActionId; label: string; keywords: string[] }
export type AltarResolution = { entries: NarrativeEntry[]; actions: NarrativeAction[]; effects: Partial<AltarFlags>; roll: CheckResult | null; movementLocked?: boolean; outcome?: 'victory' | 'failure'; rollOutcome?: 'success' | 'failure' }

const actionIds = new Set<AltarActionId>(['inspect-altar', 'retry-altar', 'inspect-torch', 'light-torch', 'open-exit'])
const altarCheckId: CheckId = 'altar-investigation'

export const altarInvestigationCheck: DiceCheck = diceCheck(cryptOfLunargenta, altarCheckId)

function configuredActions(level: LevelConfig): LevelAction[] { return level.actions.filter((action): action is LevelAction & { id: AltarActionId } => actionIds.has(action.id as AltarActionId)) }
function configuredAction(id: AltarActionId, level: LevelConfig): LevelAction { const action = level.actions.find((candidate) => candidate.id === id); if (!action) throw new Error(`Missing configured altar action: ${id}`); return action }
function configuredCheck(level: LevelConfig): LevelCheck { const check = level.checks.find((candidate) => candidate.id === altarCheckId); if (!check) throw new Error(`Missing configured altar check: ${altarCheckId}`); return check }
function narrativeAction(action: LevelAction): NarrativeAction { return { id: action.id as AltarActionId, label: action.label, keywords: action.keywords } }

function runtimeEffects(flags: AltarFlags, level: LevelConfig): RuntimeEffects { return { flags: { ...flags }, completedObjectives: level.objectives.filter((objective) => flags[objective.completion.flag as keyof AltarFlags] === true).map((objective) => objective.id) } }
function requirementsMet(action: LevelAction, flags: AltarFlags, level: LevelConfig): boolean {
  const snapshot = runtimeEffects(flags, level)
  return evaluateRequirements(action.requires, { flags: snapshot.flags, completedObjectives: new Set(snapshot.completedObjectives), nearbyObjectIds: new Set(level.objects.map((object) => object.id)) })
}
function partialFlags(before: RuntimeEffects, after: RuntimeEffects): Partial<AltarFlags> { return Object.fromEntries(Object.entries(after.flags).filter(([key, value]) => before.flags[key] !== value)) as Partial<AltarFlags> }
function objectiveId(id: string): ObjectiveId { return id.replace(/^objective-/, '') as ObjectiveId }

export function initialObjectives(level: LevelConfig = cryptOfLunargenta): Objective[] { return level.objectives.map((objective) => ({ id: objectiveId(objective.id), label: objective.label, completed: false, blocked: isObjectiveBlocked(objective.id, initialAltarFlags(), level) })) }
export function updateObjectives(flags: AltarFlags, phase: 'exploration' | 'resolving' | 'victory' | 'failure', level: LevelConfig = cryptOfLunargenta): Objective[] {
  return level.objectives.map((objective) => ({ id: objectiveId(objective.id), label: objective.label, completed: flags[objective.completion.flag as keyof AltarFlags] === true || (phase === 'victory' && objective.id === 'objective-open-exit'), blocked: !flags[objective.completion.flag as keyof AltarFlags] && isObjectiveBlocked(objective.id, flags, level) }))
}
function isObjectiveBlocked(id: string, flags: AltarFlags, level: LevelConfig): boolean {
  const completers = level.actions.filter((action) => action.effects.some((effect) => 'setFlag' in effect && level.objectives.some((objective) => objective.id === id && objective.completion.flag === effect.setFlag)))
  return completers.length > 0 && !completers.some((action) => requirementsMet(action, flags, level))
}

export function initialChecks(level: LevelConfig = cryptOfLunargenta): Check[] { return level.checks.filter((check) => check.id === altarCheckId).map((check) => ({ id: check.id as CheckId, label: check.label, difficulty: check.difficulty, completed: false, blocked: false })) }
export function updateChecks(flags: AltarFlags, level: LevelConfig = cryptOfLunargenta): Check[] { return initialChecks(level).map((check) => ({ ...check, completed: checkEffects(configuredCheck(level).onSuccess.effects, flags) })) }
function checkEffects(effects: LevelCheck['onSuccess']['effects'], flags: AltarFlags): boolean { return effects.some((effect) => 'setFlag' in effect && flags[effect.setFlag as keyof AltarFlags] === true) }

export const altarActions: Readonly<Record<AltarActionId, NarrativeAction>> = Object.fromEntries(configuredActions(cryptOfLunargenta).map((action) => [action.id, narrativeAction(action)])) as Readonly<Record<AltarActionId, NarrativeAction>>

export function initialAltarFlags(): AltarFlags { return { altarInvestigated: false, altarInvestigationSucceeded: false, altarInvestigationFailed: false, torchLit: false, exitOpened: false } }
export function availableAltarActions(flags: AltarFlags, level: LevelConfig = cryptOfLunargenta): NarrativeAction[] {
  const available = configuredActions(level).filter((action) => requirementsMet(action, flags, level))
  const exclusive = available.filter((action) => action.exclusive)
  return (exclusive.length > 0 ? exclusive : available).map(narrativeAction)
}

export function resolveAltarAction(input: string, flags: AltarFlags, roller: D20Roller, modifier = 0, level: LevelConfig = cryptOfLunargenta): AltarResolution {
  const actionId = identifyAltarAction(input, level)
  const action = actionId ? configuredAction(actionId, level) : undefined
  if (!action || !requirementsMet(action, flags, level)) return unavailableResolution(action, flags, level)

  const before = runtimeEffects(flags, level)
  if (action.check) {
    const check = configuredCheck(level)
    const roll = resolveCheck({ ability: check.ability, difficulty: check.difficulty, modifier }, roller)
    const outcome = roll.success ? check.onSuccess : check.onFailure
    const after = applyEffects([...action.effects, ...outcome.effects], before)
    const rollText = `${check.label}: d20 ${roll.roll.value} ${roll.roll.modifier >= 0 ? '+' : ''}${roll.roll.modifier} = ${roll.roll.total} contra ${roll.check.difficulty}.`
    const entries = [createNarrativeEntry('D20', rollText, roll.success ? 'gold' : 'danger')]
    if (roll.success) entries.push(createNarrativeEntry('Sistema', `Prueba superada: total ${roll.roll.total} contra dificultad ${roll.check.difficulty}. Éxito.`, 'gold'))
    if (outcome.message) entries.push(createNarrativeEntry('Narrador', outcome.message, roll.success ? 'gold' : 'danger'))
    return { roll, effects: partialFlags(before, after), entries, actions: availableAltarActions(after.flags as AltarFlags, level), movementLocked: action.movement.after === 'locked', outcome: outcome.terminal, rollOutcome: roll.success ? 'success' : 'failure' }
  }

  const after = applyEffects(action.effects, before)
  const successText = action.messages?.success?.replace('{destination}', getDestinationTitle())
  return { roll: null, effects: partialFlags(before, after), entries: successText ? [createNarrativeEntry('Narrador', successText, 'gold')] : [], actions: availableAltarActions(after.flags as AltarFlags, level), movementLocked: action.movement.after === 'locked' ? false : undefined }
}

function unavailableResolution(action: LevelAction | undefined, flags: AltarFlags, level: LevelConfig): AltarResolution {
  const requirements = action ? missingObjectiveLabels(action, flags, level).join(' y ') : undefined
  const text = (action?.messages?.unavailable ?? level.messages?.unavailableAction ?? '').replace('{requirements}', requirements ?? '')
  return { roll: null, effects: {}, entries: [createNarrativeEntry('Sistema', text, 'danger')], actions: availableAltarActions(flags, level), movementLocked: flags.altarInvestigated ? false : undefined }
}
function missingObjectiveLabels(action: LevelAction, flags: AltarFlags, level: LevelConfig): string[] {
  const missing = new Set<string>()
  const visit = (candidate: LevelAction) => {
    for (const requirement of candidate.requires) {
      if (!('objectiveCompleted' in requirement) || runtimeEffects(flags, level).completedObjectives.includes(requirement.objectiveCompleted)) continue
      missing.add(requirement.objectiveCompleted)
      for (const completer of level.actions.filter((item) => item.effects.some((effect) => 'setFlag' in effect && level.objectives.some((objective) => objective.id === requirement.objectiveCompleted && objective.completion.flag === effect.setFlag)))) visit(completer)
    }
  }
  visit(action)
  return [...missing].map((id) => level.objectives.find((objective) => objective.id === id)?.label.toLocaleLowerCase()).filter((label): label is string => Boolean(label))
}
function diceCheck(level: LevelConfig, id: string): DiceCheck { const check = level.checks.find((candidate) => candidate.id === id); if (!check) throw new Error(`Missing configured altar check: ${id}`); return { ability: check.ability, difficulty: check.difficulty, modifier: 0 } }
export function identifyAltarAction(input: string, level: LevelConfig = cryptOfLunargenta): AltarActionId | null { const normalized = normalize(input); return configuredActions(level).find((action) => action.keywords.some((keyword) => normalized === normalize(keyword)))?.id as AltarActionId | undefined ?? null }
function normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() }
function getDestinationTitle(): string { return campaignLevels.find((level) => level.id !== cryptOfLunargenta.id)?.title ?? cryptOfLunargenta.title }
