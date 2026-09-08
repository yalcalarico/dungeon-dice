export {
  CURRENT_SCHEMA_VERSION,
  type Bounds,
  type CheckOutcome,
  type Effect,
  type EnvironmentConfig,
  type LevelAction,
  type LevelCheck,
  type LevelConfig,
  type LevelObject,
  type LevelObjective,
  type MovementPolicy,
  type ObjectType,
  type Requirement,
  type SceneConfig,
  type Vector3,
} from './level-config'

export {
  LevelConfigValidationError,
  loadLevelConfig,
  validateLevelConfig,
  type LevelValidationError,
  type LevelValidationResult,
} from './level-loader'

export { validateContent, type ContentDiagnostic } from './content-validator'
export { AuthoringValidationError, createLevelTemplate, exportCampaignJson, exportLevelJson } from './authoring'

import cryptOfLunargentaJson from './crypt-of-lunargenta.json'
import { loadLevelConfig } from './level-loader'

export const cryptOfLunargenta = loadLevelConfig(cryptOfLunargentaJson)
