import { describe, expect, it } from 'vitest'
import { cryptOfLunargenta } from './index'
import { AuthoringValidationError, exportCampaignJson, exportLevelJson, loadCampaignMap } from './authoring'
import { starterCampaignMap } from '../world/zones'

describe('content authoring', () => {
  it('exports valid level JSON deterministically', () => {
    const first = exportLevelJson(cryptOfLunargenta)
    const second = exportLevelJson(cryptOfLunargenta)

    expect(first).toBe(second)
    expect(JSON.parse(first).schemaVersion).toBe(1)
  })

  it('blocks invalid content and reports diagnostics', () => {
    expect(() => exportLevelJson({ schemaVersion: 1 })).toThrow(AuthoringValidationError)
    try { exportLevelJson({ schemaVersion: 1 }) } catch (error) {
      expect(error).toMatchObject({ diagnostics: expect.arrayContaining([expect.objectContaining({ severity: 'error', suggestion: expect.any(String) })]) })
    }
  })

  it('exports a deterministic campaign map document', () => {
    const first = exportCampaignJson(starterCampaignMap)
    const second = exportCampaignJson(structuredClone(starterCampaignMap))

    expect(first).toBe(second)
    expect(JSON.parse(first)).toMatchObject({ schemaVersion: 1, zones: expect.any(Array), connections: expect.any(Array) })
  })

  it('blocks invalid campaign maps and malformed JSON', () => {
    expect(() => exportCampaignJson({ ...starterCampaignMap, schemaVersion: 99 } as unknown as typeof starterCampaignMap)).toThrow('Invalid campaign map')
    expect(() => loadCampaignMap('{"schemaVersion":1}')).toThrow('Invalid campaign map')
    expect(() => loadCampaignMap('{')).toThrow('malformed JSON')
  })

  it('round-trips an exported campaign map', () => {
    const json = exportCampaignJson(starterCampaignMap)

    expect(loadCampaignMap(json)).toEqual(starterCampaignMap)
  })
})
