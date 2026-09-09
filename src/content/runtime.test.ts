import { describe, expect, it } from 'vitest'
import { applyEffects, evaluateRequirements } from './runtime'

describe('declarative content runtime', () => {
  it('evaluates spatial, objective and flag requirements', () => {
    const context = { flags: { torchLit: true }, completedObjectives: new Set(['altar']), nearbyObjectIds: new Set(['exit']) }

    expect(evaluateRequirements([{ nearObject: 'exit' }, { objectiveCompleted: 'altar' }, { flag: 'torchLit' }], context)).toBe(true)
    expect(evaluateRequirements([{ nearObject: 'altar' }], context)).toBe(false)
  })

  it('applies effects idempotently to a runtime snapshot', () => {
    expect(applyEffects([{ setFlag: 'torchLit' }, { completeObjective: 'light-torch' }], { flags: {}, completedObjectives: [] })).toEqual({ flags: { torchLit: true }, completedObjectives: ['light-torch'] })
  })
})
