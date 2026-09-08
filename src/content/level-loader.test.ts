import { describe, expect, it } from 'vitest'
import { cryptOfLunargenta } from './index'
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
})
