import { describe, expect, it } from 'vitest'
import { createSeededD6 } from './d6'

describe('D6', () => {
  it('produces a reproducible sequence in the six-sided range', () => {
    const first = createSeededD6(42)
    const second = createSeededD6(42)
    const firstRolls = Array.from({ length: 12 }, () => first.roll())
    const secondRolls = Array.from({ length: 12 }, () => second.roll())

    expect(firstRolls).toEqual(secondRolls)
    expect(firstRolls.every((roll) => roll.die === 6 && roll.value >= 1 && roll.value <= 6)).toBe(true)
  })
})
