import { describe, expect, it } from 'vitest'
import { awardMilestone, findMilestone, levelForExperience } from './progression'

describe('progression rules', () => {
  it('uses the versioned table to resolve levels', () => {
    expect(levelForExperience(0)).toBe(1)
    expect(levelForExperience(50)).toBe(2)
    expect(levelForExperience(125)).toBe(3)
  })

  it('awards each milestone once', () => {
    const milestone = findMilestone('relic-discovered')!
    const first = awardMilestone({ experience: 0, level: 1, completedMilestones: [] }, milestone)
    const repeated = awardMilestone(first, milestone)

    expect(first).toEqual({ experience: 25, level: 1, completedMilestones: ['relic-discovered'] })
    expect(repeated).toEqual(first)
  })
})
