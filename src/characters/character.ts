export const CHARACTER_SCHEMA_VERSION = 1 as const

export type CharacterAttributes = {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export type CharacterResources = {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
}

export type Character = {
  schemaVersion: typeof CHARACTER_SCHEMA_VERSION
  id: string
  name: string
  originId: string
  archetypeId: string
  level: number
  experience: number
  attributes: CharacterAttributes
  resources: CharacterResources
  inventory: string[]
  abilities: string[]
  completedMilestones: string[]
}

export type Archetype = {
  id: string
  name: string
  description: string
  attributes: CharacterAttributes
  resources: CharacterResources
  abilityId: string
}

export type CharacterCreationOptions = {
  attributes?: CharacterAttributes
}

export const archetypes: readonly Archetype[] = [
  {
    id: 'vanguard', name: 'Vanguardia', description: 'Resiste el peligro y protege rutas frágiles.', abilityId: 'brace',
    attributes: { strength: 14, dexterity: 10, constitution: 15, intelligence: 8, wisdom: 10, charisma: 9 },
    resources: { hp: 24, maxHp: 24, mp: 4, maxMp: 4 },
  },
  {
    id: 'scout', name: 'Explorador', description: 'Lee el terreno y encuentra rutas alternativas.', abilityId: 'keen-eye',
    attributes: { strength: 10, dexterity: 15, constitution: 11, intelligence: 11, wisdom: 13, charisma: 9 },
    resources: { hp: 18, maxHp: 18, mp: 7, maxMp: 7 },
  },
  {
    id: 'channeler', name: 'Canalizador', description: 'Convierte su voluntad en recursos para los checks.', abilityId: 'focus',
    attributes: { strength: 8, dexterity: 10, constitution: 9, intelligence: 15, wisdom: 14, charisma: 12 },
    resources: { hp: 14, maxHp: 14, mp: 14, maxMp: 14 },
  },
]

export class CharacterValidationError extends Error {
  readonly errors: readonly string[]

  constructor(errors: readonly string[]) {
    super(`Personaje inválido: ${errors.join('; ')}`)
    this.name = 'CharacterValidationError'
    this.errors = errors
  }
}

export function createCharacter(name: string, archetypeId: string, originId = 'wanderer', id: string = crypto.randomUUID(), options: CharacterCreationOptions = {}): Character {
  const cleanName = name.trim()
  const archetype = archetypes.find((candidate) => candidate.id === archetypeId)
  const errors = validateCharacterInput(cleanName, archetypeId, originId)
  if (!archetype || errors.length > 0) throw new CharacterValidationError(errors)
  const attributes = options.attributes ?? archetype.attributes
  if (!validateDndAttributes(attributes)) throw new CharacterValidationError(['los atributos deben ser enteros entre 1 y 20'])
  return {
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    id,
    name: cleanName,
    originId,
    archetypeId,
    level: 1,
    experience: 0,
    attributes: { ...attributes },
    resources: { ...archetype.resources },
    inventory: [],
    abilities: [archetype.abilityId],
    completedMilestones: [],
  }
}

export function rollDndAttributes(random: () => number = Math.random): CharacterAttributes {
  const values = Array.from({ length: 6 }, () => {
    const dice = Array.from({ length: 4 }, () => Math.floor(random() * 6) + 1).sort((left, right) => right - left)
    return dice[0] + dice[1] + dice[2]
  })
  const [strength, dexterity, constitution, intelligence, wisdom, charisma] = values
  return { strength, dexterity, constitution, intelligence, wisdom, charisma }
}

export function pointBuyCost(attributes: CharacterAttributes): number {
  return Object.values(attributes).reduce((total, value) => total + (value <= 8 ? 0 : value === 9 ? 1 : value === 10 ? 2 : value === 11 ? 3 : value === 12 ? 4 : value === 13 ? 5 : value === 14 ? 7 : value === 15 ? 9 : Infinity), 0)
}

export function validateDndPointBuy(attributes: CharacterAttributes): boolean {
  return Object.values(attributes).every((value) => Number.isInteger(value) && value >= 8 && value <= 15) && pointBuyCost(attributes) <= 27
}

export function validateDndAttributes(attributes: CharacterAttributes): boolean {
  return Object.values(attributes).every((value) => Number.isInteger(value) && value >= 1 && value <= 20)
}

export function attributeModifier(value: number): number { return Math.floor((value - 10) / 2) }

export function validateCharacter(value: unknown): value is Character {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<Character>
  return candidate.schemaVersion === CHARACTER_SCHEMA_VERSION && validateCharacterInput(candidate.name, candidate.archetypeId, candidate.originId).length === 0 && typeof candidate.id === 'string' && typeof candidate.level === 'number' && candidate.level >= 1 && typeof candidate.experience === 'number' && candidate.experience >= 0 && validAttributes(candidate.attributes) && validResources(candidate.resources) && Array.isArray(candidate.inventory) && Array.isArray(candidate.abilities) && Array.isArray(candidate.completedMilestones)
}

function validateCharacterInput(name: unknown, archetypeId: unknown, originId: unknown): string[] {
  const errors: string[] = []
  if (typeof name !== 'string' || name.length < 2 || name.length > 24 || !/^[\p{L}\p{N} _-]+$/u.test(name)) errors.push('el nombre debe tener entre 2 y 24 caracteres válidos')
  if (typeof archetypeId !== 'string' || !archetypes.some((archetype) => archetype.id === archetypeId)) errors.push('el arquetipo no existe')
  if (typeof originId !== 'string' || originId.trim().length === 0) errors.push('el origen es obligatorio')
  return errors
}

function validAttributes(value: unknown): value is CharacterAttributes {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= 20)
}

function validResources(value: unknown): value is CharacterResources {
  return isRecord(value) && typeof value.hp === 'number' && typeof value.maxHp === 'number' && typeof value.mp === 'number' && typeof value.maxMp === 'number' && value.hp >= 0 && value.hp <= value.maxHp && value.mp >= 0 && value.mp <= value.maxMp
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
