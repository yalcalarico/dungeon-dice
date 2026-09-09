import ashenCourtyardJson from './ashen-courtyard.json'
import cryptOfLunargentaJson from './crypt-of-lunargenta.json'
import type { LevelConfig } from './level-config'
import { loadLevelConfig } from './level-loader'

export const cryptOfLunargenta = loadLevelConfig(cryptOfLunargentaJson)
export const ashenCourtyard = loadLevelConfig(ashenCourtyardJson)

export const campaignLevels = [cryptOfLunargenta, ashenCourtyard] as const satisfies readonly LevelConfig[]

export const levelsByZoneId: Readonly<Record<string, LevelConfig>> = Object.fromEntries(
  campaignLevels.map((level) => [level.id, level]),
)

export function getLevelByZoneId(zoneId: string): LevelConfig | undefined {
  return levelsByZoneId[zoneId]
}
