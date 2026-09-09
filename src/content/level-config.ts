export const CURRENT_SCHEMA_VERSION = 1 as const

export type Vector3 = { x: number; y: number; z: number }

export type Bounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export type EnvironmentConfig = {
  rain: { enabled: boolean; density: number; speed: number }
  floor: { wetness: number; puddles: boolean }
}

export type SceneConfig = {
  bounds: Bounds
  environment: EnvironmentConfig
}

export type ObjectType = 'altar' | 'torch' | 'exit-door' | 'npc' | 'relic' | 'enemy'

export type LevelObject = {
  id: string
  type: ObjectType
  position: Vector3
  interaction?: {
    radius: number
    actions: string[]
  }
}

export type Requirement =
  | { nearObject: string }
  | { objectiveCompleted: string }
  | { flag: string; value?: boolean }

export type Effect =
  | { setFlag: string }
  | { completeObjective: string }

export type MovementPolicy = {
  during: 'locked' | 'allowed'
  after: 'locked' | 'allowed'
}

export type CheckOutcome = {
  effects: Effect[]
  message?: string
  continue?: boolean
  terminal?: 'victory' | 'failure'
}

export type LevelObjective = {
  id: string
  label: string
  blocking: boolean
  completion: { flag: string }
}

export type LevelCheck = {
  id: string
  label: string
  die: 'd20'
  ability: 'wisdom' | 'investigation'
  difficulty: number
  blocking?: boolean
  onSuccess: CheckOutcome
  onFailure: CheckOutcome
}

export type RetryCost = {
  type: 'hp'
  amount: number
}

export type LevelAction = {
  id: string
  label: string
  keywords: string[]
  requires: Requirement[]
  check?: string
  effects: Effect[]
  movement: MovementPolicy
  messages?: { success?: string; unavailable?: string }
  exclusive?: boolean
}

export type LevelNpc = {
  id: string
  objectId: string
  name: string
  dialogueIds: string[]
}

export type LevelDialogue = {
  id: string
  npcId: string
  minTrust: number
  text: string
  nextTrust?: number
}

export type LevelRewardItem = {
  id: string
  label: string
  quantity: number
  kind: 'consumable' | 'quest'
  equippable?: boolean
}

export type LevelReward = {
  id: string
  experience: number
  item?: LevelRewardItem
}

export type LevelRelic = {
  id: string
  objectId: string
  name: string
  rewardIds: string[]
}

export type EnemyStats = {
  maxHp: number
  armorClass: number
  attackBonus: number
  damage: { die: 'd6'; modifier: number }
}

export type LevelEnemy = {
  id: string
  objectId: string
  name: string
  stats: EnemyStats
  rewardIds: string[]
}

export type RouteChoice = {
  id: string
  label: string
  minTrust: number
  requires: Requirement[]
  effects: Effect[]
  rewardIds: string[]
}

export type LevelConfig = {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION
  id: string
  title: string
  retryCost: RetryCost
  scene: SceneConfig
  objects: LevelObject[]
  objectives: LevelObjective[]
  checks: LevelCheck[]
  actions: LevelAction[]
  victory: { requires: Requirement[] }
  messages?: { unavailableAction?: string }
  npcs?: LevelNpc[]
  dialogues?: LevelDialogue[]
  rewards?: LevelReward[]
  relics?: LevelRelic[]
  enemies?: LevelEnemy[]
  routeChoices?: RouteChoice[]
}
