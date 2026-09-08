export type D20Roller = {
  roll: (modifier?: number) => D20Roll
}

export type D20Roll = {
  die: 20
  value: number
  modifier: number
  total: number
  critical: 'natural-20' | 'natural-1' | null
}

export type Ability = 'wisdom' | 'investigation'

export type DiceCheck = {
  ability: Ability
  difficulty: number
  modifier: number
}

export type CheckResult = {
  check: DiceCheck
  roll: D20Roll
  success: boolean
}

export function createSeededD20(seed: number): D20Roller {
  let state = Math.abs(Math.trunc(seed)) || 1

  return {
    roll(modifier = 0) {
      state = (state * 1664525 + 1013904223) >>> 0
      const value = (state % 20) + 1
      const critical = value === 20 ? 'natural-20' : value === 1 ? 'natural-1' : null

      return {
        die: 20,
        value,
        modifier,
        total: value + modifier,
        critical,
      }
    },
  }
}

export function createRandomD20(): D20Roller {
  return {
    roll(modifier = 0) {
      const random = new Uint32Array(1)
      crypto.getRandomValues(random)
      const value = (random[0] % 20) + 1
      const critical = value === 20 ? 'natural-20' : value === 1 ? 'natural-1' : null

      return { die: 20, value, modifier, total: value + modifier, critical }
    },
  }
}

export function resolveCheck(check: DiceCheck, roller: D20Roller): CheckResult {
  const roll = roller.roll(check.modifier)

  return {
    check,
    roll,
    success: roll.critical === 'natural-20' || (roll.critical !== 'natural-1' && roll.total >= check.difficulty),
  }
}
