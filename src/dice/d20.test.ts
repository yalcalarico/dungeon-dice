import { describe, expect, it } from 'vitest'
import { createSeededD20, resolveCheck, type D20Roll, type D20Roller } from './d20'

describe('d20 system', () => {
  it('produces a repeatable sequence for the same seed', () => {
    const first = createSeededD20(1234)
    const second = createSeededD20(1234)

    expect([first.roll(2), first.roll(-1), first.roll()]).toEqual([
      second.roll(2),
      second.roll(-1),
      second.roll(),
    ])
  })

  it('marks seeded natural 1 and natural 20 results', () => {
    expect(createSeededD20(7133).roll()).toMatchObject({ value: 1, total: 1, critical: 'natural-1' })
    expect(createSeededD20(9716).roll()).toMatchObject({ value: 20, total: 20, critical: 'natural-20' })
  })

  it('resolves critical results without consulting random state', () => {
    const check = { ability: 'wisdom' as const, difficulty: 20, modifier: 0 }
    const naturalOne: D20Roller = { roll: () => roll(1, 'natural-1') }
    const naturalTwenty: D20Roller = { roll: () => roll(20, 'natural-20') }

    expect(resolveCheck(check, naturalOne).success).toBe(false)
    expect(resolveCheck(check, naturalTwenty).success).toBe(true)
  })
})

function roll(value: number, critical: D20Roll['critical']): D20Roll {
  return { die: 20, value, modifier: 0, total: value, critical }
}
