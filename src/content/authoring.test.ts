import { describe, expect, it } from 'vitest'
import { cryptOfLunargenta } from './index'
import { AuthoringValidationError, exportCampaignJson, exportLevelJson } from './authoring'
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
    const json = exportCampaignJson(starterCampaignMap)

    expect(JSON.parse(json)).toMatchObject({ schemaVersion: 1, zones: expect.any(Array), connections: expect.any(Array) })
  })
})
