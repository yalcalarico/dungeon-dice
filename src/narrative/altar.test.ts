import { describe, expect, it } from 'vitest'
import {
  availableAltarActions,
  initialAltarFlags,
  resolveAltarAction,
  type AltarFlags,
} from './altar'
import type { D20Roller } from '../dice/d20'

const failedRoll: D20Roller = {
  roll: (modifier = 0) => ({ die: 20, value: 1, modifier, total: 1 + modifier, critical: 'natural-1' }),
}

const successfulRoll: D20Roller = {
  roll: (modifier = 0) => ({ die: 20, value: 20, modifier, total: 20 + modifier, critical: 'natural-20' }),
}

describe('altar action resolution', () => {
  it('keeps torch inspection and lighting available after a failed altar roll', () => {
    const failed = resolveAltarAction('investigar altar', initialAltarFlags(), failedRoll)

    expect(failed.outcome).toBe('failure')
    expect(failed.effects).toMatchObject({
      altarInvestigated: true,
      altarInvestigationFailed: true,
    })
    expect(failed.actions.map((action) => action.id)).toEqual(['retry-altar'])

    const failedFlags: AltarFlags = { ...initialAltarFlags(), ...failed.effects }
    expect(resolveAltarAction('inspeccionar la antorcha', failedFlags, failedRoll).effects).toEqual({})
    expect(resolveAltarAction('encender la antorcha', failedFlags, failedRoll).effects).toEqual({ torchLit: true })
  })

  it('does not make the exit available before the torch objective is complete', () => {
    const initial = initialAltarFlags()
    const beforeAltar = resolveAltarAction('abrir la salida', initial, successfulRoll)
    const afterAltar = { ...initial, altarInvestigated: true }
    const beforeTorch = resolveAltarAction('abrir la salida', afterAltar, successfulRoll)

    expect(availableAltarActions(initial).map((action) => action.id)).toEqual(['inspect-altar'])
    expect(beforeAltar.actions.map((action) => action.id)).toEqual(['inspect-altar'])
    expect(beforeAltar.entries[0]?.text).toContain('investigar el altar')
    expect(beforeTorch.actions.map((action) => action.id)).toEqual(['inspect-torch', 'light-torch'])
    expect(beforeTorch.entries[0]?.text).toContain('encender la antorcha')
  })

  it('only reports victory when the exit is opened', () => {
    const torchLit: AltarFlags = {
      ...initialAltarFlags(),
      altarInvestigated: true,
      altarInvestigationSucceeded: true,
      torchLit: true,
    }

    const torch = resolveAltarAction('encender la antorcha', { ...torchLit, torchLit: false }, successfulRoll)
    const exit = resolveAltarAction('abrir la puerta de salida', torchLit, successfulRoll)

    expect(torch.outcome).toBeUndefined()
    expect(torch.effects.torchLit).toBe(true)
    expect(exit.outcome).toBeUndefined()
    expect(exit.effects.exitOpened).toBe(true)
    expect(exit.movementLocked).toBe(false)
  })
})
