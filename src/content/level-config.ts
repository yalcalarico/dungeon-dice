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

export type ObjectType = 'altar' | 'torch' | 'exit-door'

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
  | { flag: string }

export type Effect =
  | { setFlag: string }
  | { completeObjective: string }

export type MovementPolicy = {
  during: 'locked' | 'allowed'
  after: 'locked' | 'allowed'
}

export type CheckOutcome = {
  effects: Effect[]
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
}
