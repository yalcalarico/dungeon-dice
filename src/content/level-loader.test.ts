import { describe, expect, it } from 'vitest'
import { ashenCourtyard, cryptOfLunargenta } from './index'
import { validateLevelConfig } from './level-loader'

describe('level configuration validation', () => {
  it('accepts the bundled level with valid references', () => {
    const result = validateLevelConfig(cryptOfLunargenta)

    expect(result.valid).toBe(true)
    if (result.valid) expect(result.config.id).toBe('crypt-of-lunargenta')
  })

  it('rejects references to missing objects, checks, and objectives', () => {
    const invalidLevel = structuredClone(cryptOfLunargenta) as Record<string, unknown>
    const actions = invalidLevel.actions as Array<Record<string, unknown>>
    const firstAction = actions[0]
    firstAction.check = 'missing-check'
    firstAction.requires = [{ nearObject: 'missing-object' }, { objectiveCompleted: 'missing-objective' }]

    const result = validateLevelConfig(invalidLevel)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.map((error) => error.path)).toEqual(expect.arrayContaining([
        '$.actions[0].check',
        '$.actions[0].requires[0].nearObject',
        '$.actions[0].requires[1].objectiveCompleted',
      ]))
    }
  })

  it('rejects a non-positive retry cost', () => {
    const invalidLevel = structuredClone(cryptOfLunargenta) as Record<string, unknown>
    invalidLevel.retryCost = { type: 'hp', amount: 0 }

    const result = validateLevelConfig(invalidLevel)

    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.errors).toContainEqual({ path: '$.retryCost.amount', message: 'must be greater than zero' })
  })

  it('accepts the declarative courtyard entities and references', () => {
    const result = validateLevelConfig(ashenCourtyard)

    expect(result.valid).toBe(true)
    expect(ashenCourtyard.npcs?.[0].name).toBe('Iria')
    expect(ashenCourtyard.enemies?.[0].stats).toMatchObject({ maxHp: 18, armorClass: 14, attackBonus: 4 })
    expect(ashenCourtyard.routeChoices?.map((choice) => choice.id)).toEqual(['relic', 'direct'])
  })

  it('rejects invalid courtyard entity, dialogue, and reward references', () => {
    const invalidLevel = structuredClone(ashenCourtyard) as Record<string, unknown>
    const npc = (invalidLevel.npcs as Array<Record<string, unknown>>)[0]
    npc.objectId = 'missing-object'
    npc.dialogueIds = ['missing-dialogue']
    const enemy = (invalidLevel.enemies as Array<Record<string, unknown>>)[0]
    enemy.rewardIds = ['missing-reward']

    const result = validateLevelConfig(invalidLevel)

    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.errors.map((error) => error.path)).toEqual(expect.arrayContaining([
      '$.npcs[0].objectId',
      '$.npcs[0].dialogueIds[0]',
      '$.enemies[0].rewardIds[0]',
    ]))
  })
})
