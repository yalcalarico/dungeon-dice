import { describe, expect, it } from 'vitest'
import { createInitialGameState, transitionGameState } from './game-state'
import type { D20Roller } from '../dice/d20'

const failedRoll: D20Roller = {
  roll: (modifier = 0) => ({ die: 20, value: 1, modifier, total: 1 + modifier, critical: 'natural-1' }),
}

const successfulRoll: D20Roller = {
  roll: (modifier = 0) => ({ die: 20, value: 20, modifier, total: 20 + modifier, critical: 'natural-20' }),
}

describe('game flow integration', () => {
  it('charges HP for a retry before recovering through torch and victory flow', () => {
    const initial = createInitialGameState()
    const pending = transitionGameState(initial, { type: 'choose-action', actionId: 'inspect-altar', targetId: 'altar' }, failedRoll)

    expect(pending.phase).toBe('resolving')
    expect(pending.pendingCheck).toEqual({ actionId: 'inspect-altar', input: 'Inspeccionar el altar' })
    expect(pending.availableActions).toEqual([])
    expect(pending.lastRoll).toBeNull()
    expect(pending.movementLocked).toBe(true)

    const failed = transitionGameState(pending, { type: 'roll-dice' }, failedRoll)

    expect(failed.phase).toBe('failure')
    expect(failed.pendingCheck).toBeNull()
    expect(failed.movementLocked).toBe(false)
    expect(failed.flags.altarInvestigationFailed).toBe(true)
    expect(failed.availableActions.map((action) => action.id)).toEqual(['retry-altar'])
    expect(failed.objectives.find((objective) => objective.id === 'light-torch')).toMatchObject({ completed: false, blocked: false })

    const retry = transitionGameState(failed, { type: 'choose-action', actionId: 'retry-altar', targetId: 'altar' }, failedRoll)
    expect(retry.player.hp).toBe(15)
    expect(retry.pendingCheck?.actionId).toBe('retry-altar')
    expect(retry.movementLocked).toBe(true)

    const recovered = transitionGameState(retry, { type: 'roll-dice' }, successfulRoll)
    expect(recovered.flags.altarInvestigationSucceeded).toBe(true)
    expect(recovered.availableActions.map((action) => action.id)).toEqual(['inspect-torch', 'light-torch'])

    const lit = transitionGameState(recovered, { type: 'choose-action', actionId: 'light-torch', targetId: 'torch-1' }, successfulRoll)

    expect(lit.flags.torchLit).toBe(true)
    expect(lit.objectives.find((objective) => objective.id === 'light-torch')).toMatchObject({ completed: true, blocked: false })
    expect(lit.availableActions.map((action) => action.id)).toEqual(['open-exit'])
    expect(lit.phase).toBe('exploration')

    const victory = transitionGameState(lit, { type: 'choose-action', actionId: 'open-exit', targetId: 'exit-door' }, failedRoll)

    expect(victory.phase).toBe('exploration')
    expect(victory.objectives.find((objective) => objective.id === 'open-exit')?.completed).toBe(true)
    expect(victory.movementLocked).toBe(false)
  })

  it('rejects a retry when the player cannot pay its HP cost', () => {
    const initial = createInitialGameState()
    const pending = transitionGameState(initial, { type: 'choose-action', actionId: 'inspect-altar', targetId: 'altar' }, failedRoll)
    const failed = transitionGameState(pending, { type: 'roll-dice' }, failedRoll)
    const exhausted = { ...failed, player: { ...failed.player, hp: 2 } }
    const result = transitionGameState(exhausted, { type: 'choose-action', actionId: 'retry-altar', targetId: 'altar' }, failedRoll)

    expect(result.player.hp).toBe(2)
    expect(result.pendingCheck).toBeNull()
    expect(result.entries.at(-1)?.text).toContain('No tienes suficiente vida')
  })

  it('keeps the exit unavailable before the required objective is complete', () => {
    const initial = createInitialGameState()
    const attempted = transitionGameState(initial, { type: 'submit-input', input: 'abrir la salida', targetId: 'exit-door' }, failedRoll)

    expect(attempted.phase).toBe('exploration')
    expect(attempted.flags.torchLit).toBe(false)
    expect(attempted.availableActions.map((action) => action.id)).toEqual(['inspect-altar'])
    expect(attempted.entries.at(-1)?.text).toContain('La puerta permanece sellada')
    expect(attempted.movementLocked).toBe(false)
  })

  it('does not resolve an action when the target object is wrong', () => {
    const initial = createInitialGameState()
    const attempted = transitionGameState(initial, { type: 'choose-action', actionId: 'inspect-altar', targetId: 'torch-1' }, failedRoll)

    expect(attempted.pendingCheck).toBeNull()
    expect(attempted.flags.altarInvestigated).toBe(false)
    expect(attempted.entries.at(-1)?.text).toContain('objeto correcto')
  })
})
