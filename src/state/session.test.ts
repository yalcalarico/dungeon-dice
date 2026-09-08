import { describe, expect, it } from 'vitest'
import { transitionGameState } from './game-state'
import {
  createInitialSession,
  resetSession,
  transitionSession,
  transitionToFailure,
  transitionToVictory,
} from './session'
import type { D20Roller } from '../dice/d20'

const naturalTwenty: D20Roller = {
  roll: (modifier = 0) => ({ die: 20, value: 20, modifier, total: 20 + modifier, critical: 'natural-20' }),
}

describe('session lifecycle', () => {
  it('resets to a fresh initial game state', () => {
    const session = createInitialSession()
    const changed = transitionSession(session, {
      ...session.gameState,
      entries: [...session.gameState.entries, { ...session.gameState.entries[0], text: 'changed' }],
    })

    const reset = resetSession()

    expect(reset.status).toBe('reset')
    expect(reset.gameState.entries.map(({ timestamp: _timestamp, ...entry }) => entry)).toEqual(session.gameState.entries.map(({ timestamp: _timestamp, ...entry }) => entry))
    expect(reset.gameState).not.toBe(changed.gameState)
    expect(reset.history).toEqual([])
  })

  it('represents victory and failure as terminal session states', () => {
    const initial = createInitialSession()
    const victory = transitionToVictory(initial)
    const failure = transitionToFailure(initial)

    expect(victory).toMatchObject({ status: 'victory', gameState: { phase: 'victory' } })
    expect(failure).toMatchObject({ status: 'failure', gameState: { phase: 'failure' } })
  })

  it('preserves state history until reset', () => {
    const initial = createInitialSession()
    const pending = transitionGameState(initial.gameState, { type: 'choose-action', actionId: 'inspect-altar', targetId: 'altar' }, naturalTwenty)
    const resolved = transitionGameState(pending, { type: 'roll-dice' }, naturalTwenty)
    const progressed = transitionSession(transitionSession(initial, pending), resolved)
    const terminal = transitionToVictory(progressed)

    expect(terminal.history).toHaveLength(3)
    expect(terminal.history[0]).toBe(initial.gameState)
    expect(terminal.history[1]).toBe(pending)
    expect(terminal.history[2]).toBe(resolved)
    expect(resetSession(terminal).history).toEqual([])
  })
})
