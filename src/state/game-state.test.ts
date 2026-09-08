import { describe, expect, it } from 'vitest'
import { createGameSnapshot, createInitialGameState, restoreGameSnapshot, transitionGameState } from './game-state'
import type { D20Roller } from '../dice/d20'

const naturalTwenty: D20Roller = {
  roll: (modifier = 0) => ({ die: 20, value: 20, modifier, total: 20 + modifier, critical: 'natural-20' }),
}

describe('game-state transitions', () => {
  it('creates a pending altar roll and resolves it into exploration', () => {
    const initial = createInitialGameState()
    const pending = transitionGameState(initial, { type: 'submit-input', input: 'investigar altar', targetId: 'altar' }, naturalTwenty)

    expect(pending.phase).toBe('resolving')
    expect(pending.pendingCheck?.actionId).toBe('inspect-altar')
    expect(pending.movementLocked).toBe(true)

    const resolved = transitionGameState(pending, { type: 'roll-dice' }, naturalTwenty)

    expect(resolved.phase).toBe('exploration')
    expect(resolved.pendingCheck).toBeNull()
    expect(resolved.flags.altarInvestigationSucceeded).toBe(true)
    expect(resolved.lastRollOutcome).toBe('success')
  })

  it('progresses from a successful altar investigation through torch and exit', () => {
    const initial = createInitialGameState()
    const pending = transitionGameState(initial, { type: 'choose-action', actionId: 'inspect-altar', targetId: 'altar' }, naturalTwenty)
    const altarResolved = transitionGameState(pending, { type: 'roll-dice' }, naturalTwenty)
    const torchLit = transitionGameState(altarResolved, { type: 'choose-action', actionId: 'light-torch', targetId: 'torch-1' }, naturalTwenty)

    expect(torchLit.flags.torchLit).toBe(true)
    expect(torchLit.availableActions.map((action) => action.id)).toEqual(['open-exit'])
    expect(torchLit.objectives.find((objective) => objective.id === 'light-torch')?.completed).toBe(true)

    const victory = transitionGameState(torchLit, { type: 'choose-action', actionId: 'open-exit', targetId: 'exit-door' }, naturalTwenty)

    expect(victory.phase).toBe('exploration')
    expect(victory.flags.exitOpened).toBe(true)
    expect(victory.movementLocked).toBe(false)
  })

  it('pauses and resumes without mutating the gameplay snapshot', () => {
    const initial = createInitialGameState()
    const paused = transitionGameState(initial, { type: 'pause' }, naturalTwenty)
    const resumed = transitionGameState(paused, { type: 'resume' }, naturalTwenty)

    expect(paused.phase).toBe('paused')
    expect(paused.pausedPhase).toBe('exploration')
    expect(transitionGameState(paused, { type: 'roll-dice' }, naturalTwenty)).toBe(paused)
    expect(resumed.phase).toBe('exploration')
    expect(resumed.movementLocked).toBe(false)
  })

  it('creates an independent snapshot that can be restored', () => {
    const initial = createInitialGameState()
    const snapshot = createGameSnapshot(initial)
    const restored = restoreGameSnapshot(snapshot)

    expect(restored).toEqual(initial)
    expect(restored).not.toBe(initial)
    expect(restored.entries).not.toBe(initial.entries)
  })

  it('clears pending interactions when changing zones', () => {
    const initial = createInitialGameState()
    const pending = transitionGameState(initial, { type: 'choose-action', actionId: 'inspect-altar', targetId: 'altar' }, naturalTwenty)
    const courtyard = transitionGameState(pending, { type: 'change-zone', zoneId: 'ashen-courtyard' }, naturalTwenty)

    expect(courtyard.zoneId).toBe('ashen-courtyard')
    expect(courtyard.pendingCheck).toBeNull()
    expect(courtyard.availableActions).toEqual([])
    expect(courtyard.entries.at(-1)?.text).toContain('Patio de Ceniza')
  })
})
