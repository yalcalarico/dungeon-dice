import { describe, expect, it } from 'vitest'
import { archetypes } from './character'
import { compareArchetypes, compareArchetype, validateArchetypeBalance } from './balance'

describe('archetype balance rules', () => {
  it('compares initial resources, modifiers and survivability deterministically', () => {
    expect(compareArchetype(archetypes[0])).toEqual({
      archetypeId: 'vanguard',
      initialHp: 24,
      initialMp: 4,
      offensiveModifier: 2,
      defensiveModifier: 2,
      minimumSurvivability: 28,
    })
    expect(compareArchetype(archetypes[2])).toMatchObject({ initialHp: 14, initialMp: 14, minimumSurvivability: 18 })
  })

  it('keeps the current catalog inside the first-pass balance limits', () => {
    expect(validateArchetypeBalance()).toEqual([])
  })

  it('requires a meaningful resource tradeoff instead of accepting a dominant archetype', () => {
    const comparisons = compareArchetypes()

    expect(new Set(comparisons.map((comparison) => comparison.initialHp)).size).toBe(3)
    expect(new Set(comparisons.map((comparison) => comparison.initialMp)).size).toBe(3)
    expect(validateArchetypeBalance(comparisons.map((comparison) => ({
      ...archetypes.find((archetype) => archetype.id === comparison.archetypeId)!,
      resources: { hp: 30, maxHp: 30, mp: 20, maxMp: 20 },
    })))).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'initial-hp-out-of-range' }),
      expect.objectContaining({ code: 'initial-mp-out-of-range' }),
    ]))
  })
})
