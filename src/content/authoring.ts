import { validateContent, type ContentDiagnostic } from './content-validator'
import type { LevelConfig } from './level-config'
import { loadCampaignMap as validateCampaignMap, type CampaignMap } from '../world/zones'

export class AuthoringValidationError extends Error {
  readonly diagnostics: readonly ContentDiagnostic[]

  constructor(diagnostics: readonly ContentDiagnostic[]) {
    super(`No se puede exportar contenido inválido: ${diagnostics.length} diagnóstico(s).`)
    this.name = 'AuthoringValidationError'
    this.diagnostics = diagnostics
  }
}

export function exportLevelJson(input: unknown, file = '<content>'): string {
  const result = validateContent(input, file)
  if (!result.valid) throw new AuthoringValidationError(result.diagnostics)
  return stableJson(result.config)
}

export function exportCampaignJson(campaign: CampaignMap): string {
  const validated = validateCampaignMap(campaign)
  return stableJson(validated)
}

export function loadCampaignMap(json: string): CampaignMap {
  return validateCampaignMap(json)
}

export function createLevelTemplate(base: LevelConfig): LevelConfig {
  return structuredClone(base)
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(sortValue(value), null, 2)}\n`
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortValue(item)]))
  return value
}
