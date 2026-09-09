export type D6Roll = {
  die: 6
  value: number
}

export type D6Roller = {
  roll: () => D6Roll
}

export function createSeededD6(seed: number): D6Roller {
  let state = Math.abs(Math.trunc(seed)) || 1

  return {
    roll() {
      state = (state * 1664525 + 1013904223) >>> 0
      return { die: 6, value: (state % 6) + 1 }
    },
  }
}

export function createRandomD6(): D6Roller {
  return {
    roll() {
      const random = new Uint32Array(1)
      const limit = 0x100000000 - (0x100000000 % 6)
      do crypto.getRandomValues(random)
      while (random[0] >= limit)
      return { die: 6, value: (random[0] % 6) + 1 }
    },
  }
}
