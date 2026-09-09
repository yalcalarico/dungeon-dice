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
  type LevelDialogue,
  type LevelEnemy,
  type EnemyStats,
  type LevelNpc,
  type LevelRelic,
  type LevelReward,
  type LevelRewardItem,
  type RouteChoice,
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
export { AuthoringValidationError, createLevelTemplate, exportCampaignJson, exportLevelJson, loadCampaignMap } from './authoring'

export { ashenCourtyard, campaignLevels, cryptOfLunargenta, getLevelByZoneId, levelsByZoneId } from './campaign'
