import type { Effect, Requirement } from './level-config'

export type RuntimeContext = {
  flags: Record<string, boolean>
  completedObjectives: ReadonlySet<string>
  nearbyObjectIds: ReadonlySet<string>
}

export type RuntimeEffects = {
  flags: Record<string, boolean>
  completedObjectives: string[]
}

export function evaluateRequirement(requirement: Requirement, context: RuntimeContext): boolean {
  if ('nearObject' in requirement) return context.nearbyObjectIds.has(requirement.nearObject)
  if ('objectiveCompleted' in requirement) return context.completedObjectives.has(requirement.objectiveCompleted)
  return context.flags[requirement.flag] === (requirement.value ?? true)
}

export function evaluateRequirements(requirements: readonly Requirement[], context: RuntimeContext): boolean {
  return requirements.every((requirement) => evaluateRequirement(requirement, context))
}

export function applyEffects(effects: readonly Effect[], current: RuntimeEffects): RuntimeEffects {
  const flags = { ...current.flags }
  const completedObjectives = new Set(current.completedObjectives)
  for (const effect of effects) {
    if ('setFlag' in effect) flags[effect.setFlag] = true
    if ('completeObjective' in effect) completedObjectives.add(effect.completeObjective)
  }
  return { flags, completedObjectives: [...completedObjectives] }
}
