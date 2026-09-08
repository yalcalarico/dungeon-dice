import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../state/game-state'
import { starterCampaignMap, transitionZone } from './zones'

describe('zone transitions', () => {
  it('moves to a connected zone and remembers it', () => {
    const next = transitionZone(createInitialGameState(), { connectionId: 'crypt-to-courtyard', fromExitId: 'north-gate' })

    expect(next.zoneId).toBe('ashen-courtyard')
    expect(next.entryPointId).toBe('crypt-gate')
    expect(next.visitedZoneIds).toEqual(['crypt-of-lunargenta', 'ashen-courtyard'])
  })

  it('does not mutate state for an invalid or unrelated connection', () => {
    const initial = createInitialGameState()

    expect(transitionZone(initial, { connectionId: 'courtyard-to-crypt', fromExitId: 'tower-path' }, starterCampaignMap)).toBe(initial)
  })
})
