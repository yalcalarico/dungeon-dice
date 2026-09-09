import { describe, expect, it } from 'vitest'
import { ashenCourtyard, cryptOfLunargenta, levelsByZoneId } from './index'
import { validateLevelConfig } from './level-loader'

const renderableObjectTypes = new Set(['altar', 'torch', 'exit-door', 'npc', 'relic', 'enemy'])

describe('bundled level content integration', () => {
  it('is valid and has renderable scene geometry', () => {
    const result = validateLevelConfig(cryptOfLunargenta)

    expect(result.valid).toBe(true)
    if (!result.valid) return

    const { bounds } = result.config.scene
    expect(bounds.minX).toBeLessThan(bounds.maxX)
    expect(bounds.minZ).toBeLessThan(bounds.maxZ)
    expect(Object.values(bounds).every(Number.isFinite)).toBe(true)
    expect(result.config.objects.length).toBeGreaterThan(0)

    for (const object of result.config.objects) {
      expect(renderableObjectTypes.has(object.type)).toBe(true)
      expect(Object.values(object.position).every(Number.isFinite)).toBe(true)
    }
  })

  it('resolves every interactive object action to a known action', () => {
    const actionIds = new Set(cryptOfLunargenta.actions.map((action) => action.id))
    const interactiveObjects = cryptOfLunargenta.objects.filter((object) => object.interaction)

    expect(interactiveObjects.length).toBeGreaterThan(0)
    for (const object of interactiveObjects) {
      for (const actionId of object.interaction?.actions ?? []) {
        expect(actionIds.has(actionId)).toBe(true)
      }
    }
  })

  it('keeps every object inside its playable bounds', () => {
    for (const level of [cryptOfLunargenta, ashenCourtyard]) {
      const { bounds } = level.scene
      for (const object of level.objects) {
        expect(object.position.x, `${level.id}:${object.id} x`).toBeGreaterThanOrEqual(bounds.minX)
        expect(object.position.x, `${level.id}:${object.id} x`).toBeLessThanOrEqual(bounds.maxX)
        expect(object.position.z, `${level.id}:${object.id} z`).toBeGreaterThanOrEqual(bounds.minZ)
        expect(object.position.z, `${level.id}:${object.id} z`).toBeLessThanOrEqual(bounds.maxZ)
      }
    }
  })

  it('indexes both bundled zones by their stable zone ID', () => {
    expect(levelsByZoneId['crypt-of-lunargenta']).toBe(cryptOfLunargenta)
    expect(levelsByZoneId['ashen-courtyard']).toBe(ashenCourtyard)
    expect(Object.keys(levelsByZoneId)).toEqual(['crypt-of-lunargenta', 'ashen-courtyard'])
  })

  it('can reach completion flags for every blocking objective', () => {
    const objectives = new Map(cryptOfLunargenta.objectives.map((objective) => [objective.id, objective]))
    const reachableObjectiveIds = new Set<string>()
    const reachableActionIds = new Set<string>()
    const reachableCheckIds = new Set<string>()
    const actionIds = new Set(cryptOfLunargenta.actions.map((action) => action.id))
    const checkById = new Map(cryptOfLunargenta.checks.map((check) => [check.id, check]))

    let changed = true
    while (changed) {
      changed = false
      for (const action of cryptOfLunargenta.actions) {
        const requirementsMet = action.requires.every((requirement) =>
          !('objectiveCompleted' in requirement) || reachableObjectiveIds.has(requirement.objectiveCompleted),
        )
        if (!requirementsMet || reachableActionIds.has(action.id)) continue

        reachableActionIds.add(action.id)
        if (action.check) reachableCheckIds.add(action.check)
        changed = true
      }

      const completionFlags = new Set<string>()
      for (const actionId of reachableActionIds) {
        const action = cryptOfLunargenta.actions.find((candidate) => candidate.id === actionId)
        for (const effect of action?.effects ?? []) if ('setFlag' in effect) completionFlags.add(effect.setFlag)
      }
      for (const checkId of reachableCheckIds) {
        const check = checkById.get(checkId)
        for (const outcome of [check?.onSuccess, check?.onFailure]) {
          for (const effect of outcome?.effects ?? []) if ('setFlag' in effect) completionFlags.add(effect.setFlag)
        }
      }
      for (const objective of objectives.values()) {
        if (!reachableObjectiveIds.has(objective.id) && completionFlags.has(objective.completion.flag)) {
          reachableObjectiveIds.add(objective.id)
          changed = true
        }
      }
    }

    const blockingObjectives = cryptOfLunargenta.objectives.filter((objective) => objective.blocking)
    expect(blockingObjectives.length).toBeGreaterThan(0)
    for (const objective of blockingObjectives) {
      expect(reachableObjectiveIds.has(objective.id), objective.id).toBe(true)
    }
    expect([...reachableActionIds].every((id) => actionIds.has(id))).toBe(true)
  })
})
