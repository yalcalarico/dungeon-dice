import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../state/game-state'
import { loadCampaignMap, starterCampaignMap, transitionZone, validateCampaignMap } from './zones'

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

  it('validates and loads exported campaign maps', () => {
    const exported = JSON.parse(JSON.stringify(starterCampaignMap))
    expect(validateCampaignMap(exported).valid).toBe(true)
    expect(loadCampaignMap(exported).zones).toHaveLength(2)
    expect(validateCampaignMap({ schemaVersion: 1, zones: [], connections: [{ fromZoneId: 'missing' }] }).valid).toBe(false)
  })

  it('rejects duplicate IDs and invalid exits or entries', () => {
    const invalid = {
      ...starterCampaignMap,
      zones: [{ ...starterCampaignMap.zones[0], exitPointIds: ['north-gate', 'north-gate'] }, starterCampaignMap.zones[1]],
      connections: [{ ...starterCampaignMap.connections[0], id: 'duplicate' }, { ...starterCampaignMap.connections[0], id: 'duplicate', fromExitId: 'unknown' }],
    }

    expect(validateCampaignMap(invalid)).toMatchObject({ valid: false, errors: expect.arrayContaining([expect.stringContaining('duplicate'), expect.stringContaining('missing origin exit')]) })
  })
})
