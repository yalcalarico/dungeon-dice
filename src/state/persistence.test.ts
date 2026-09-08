import { describe, expect, it } from 'vitest'
import { createInitialGameState, transitionGameState } from './game-state'
import { deserializeGameState, serializeGameState, StateValidationError } from './persistence'
import type { D20Roller } from '../dice/d20'

const naturalTwenty: D20Roller = {
  roll: (modifier = 0) => ({ die: 20, value: 20, modifier, total: 20 + modifier, critical: 'natural-20' }),
}

describe('versioned game state persistence', () => {
  it('round-trips a state without losing gameplay data', () => {
    const initial = createInitialGameState()
    const pending = transitionGameState(initial, { type: 'choose-action', actionId: 'inspect-altar', targetId: 'altar' }, naturalTwenty)

    expect(deserializeGameState(serializeGameState(pending))).toEqual(pending)
  })

  it('migrates the legacy unversioned demo state', () => {
    const legacy = createInitialGameState()
    const restored = deserializeGameState(JSON.stringify(legacy))

    expect(restored.flags.exitOpened).toBe(false)
    expect(restored.phase).toBe('exploration')
  })

  it('rejects malformed, unsupported and dangerous payloads', () => {
    expect(() => deserializeGameState('{"schemaVersion":99,"state":{}}')).toThrow(StateValidationError)
    expect(() => deserializeGameState('{"__proto__":{"polluted":true}}')).toThrow('clave peligrosa')
    expect(() => deserializeGameState('{"schemaVersion":1,"state":{"phase":"exploration"}}')).toThrow('ubicación')
  })

  it('rejects invalid resource ranges', () => {
    const state = createInitialGameState()
    const invalid = { ...state, player: { ...state.player, hp: -1 } }

    expect(() => serializeGameState(invalid)).toThrow('recursos')
  })
})
