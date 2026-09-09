import { validateCharacter, type Character } from '../characters/character'
import { INVENTORY_CAPACITY, type InventoryItem, type MvpSession } from './campaign'

const CHARACTER_KEY = 'dungeon-dice:characters:v1'
const SESSION_KEY = 'dungeon-dice:mvp-session:v1'

export function loadCharacters(): Character[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(CHARACTER_KEY) ?? '[]'); return Array.isArray(value) ? value.filter(validateCharacter) : [] } catch { return [] }
}

export function saveCharacter(character: Character): boolean {
  if (!validateCharacter(character)) return false
  const characters = loadCharacters().filter((candidate) => candidate.id !== character.id)
  try { localStorage.setItem(CHARACTER_KEY, JSON.stringify([...characters, character])); return true } catch { return false }
}

export function loadMvpSession(characterId: string): MvpSession | null {
  try { return normalizeMvpSession(JSON.parse(localStorage.getItem(`${SESSION_KEY}:${characterId}`) ?? 'null'), characterId) } catch { return null }
}

export function saveMvpSession(session: MvpSession): boolean {
  const normalized = normalizeMvpSession(session, session.character.id)
  if (!normalized) return false
  try { localStorage.setItem(`${SESSION_KEY}:${session.character.id}`, JSON.stringify(normalized)); return true } catch { return false }
}

export function validateMvpSession(value: unknown, characterId?: string): value is MvpSession {
  return normalizeMvpSession(value, characterId) !== null
}

function normalizeMvpSession(value: unknown, characterId?: string): MvpSession | null {
  if (!isRecord(value) || !validateCharacter(value.character) || (characterId !== undefined && value.character.id !== characterId)) return null
  const zoneId = value.zoneId === 'ashen-courtyard' || value.zoneId === 'crypt-of-lunargenta' ? value.zoneId : null
  const inventory = normalizeInventory(value.inventory)
  const encounter = isRecord(value.encounter) ? value.encounter : {}
  const npcTrust = finiteNumber(value.npcTrust)
  const experience = finiteNumber(value.experience)
  const level = finiteNumber(value.level)
  if (!zoneId || !inventory || !Array.isArray(value.visitedZoneIds) || !value.visitedZoneIds.every((id): id is string => typeof id === 'string') || npcTrust === null || experience === null || level === null || !Array.isArray(value.completedMilestones) || !value.completedMilestones.every((id): id is string => typeof id === 'string') || !Array.isArray(value.log) || !value.log.every((entry): entry is string => typeof entry === 'string')) return null
  const normalizedExperience = Math.max(0, experience)
  const normalizedLevel = Math.max(1, Math.floor(level))
  const completedMilestones = [...new Set(value.completedMilestones)]
  const character: Character = {
    ...value.character,
    experience: normalizedExperience,
    level: normalizedLevel,
    inventory: inventory.flatMap((item) => Array.from({ length: item.quantity }, () => item.id)),
    completedMilestones,
  }
  const normalized: MvpSession = {
    character,
    zoneId,
    visitedZoneIds: [...new Set(value.visitedZoneIds)],
    npcTrust: Math.max(0, Math.min(2, Math.floor(npcTrust))),
    inventory,
    equippedItemId: value.equippedItemId === 'moon-potion' || value.equippedItemId === 'ash-key' ? value.equippedItemId : null,
    inventoryCapacity: positiveNumber(value.inventoryCapacity, INVENTORY_CAPACITY),
    experience: normalizedExperience,
    lastRoll: finiteOrNull(value.lastRoll),
    lastDie: finiteOrNull(value.lastDie ?? value.lastRoll),
    lastModifier: finiteOrZero(value.lastModifier),
    level: normalizedLevel,
    encounter: {
      status: valueOfEncounterStatus(encounter.status),
      enemyHp: nonNegativeNumber(encounter.enemyHp, 18),
      enemyMaxHp: positiveNumber(encounter.enemyMaxHp, 18),
      turns: Math.max(0, Math.floor(nonNegativeNumber(encounter.turns, 0))),
      awaitingRoll: encounter.awaitingRoll === true,
      turn: encounter.turn === 'enemy' ? 'enemy' : 'player',
      pendingEnemyDamage: nonNegativeNumber(encounter.pendingEnemyDamage, 0),
    },
    completedMilestones,
    log: value.log.slice(-12),
  }
  return validateNormalizedSession(normalized) ? normalized : null
}

function normalizeInventory(value: unknown): InventoryItem[] | null {
  if (!Array.isArray(value)) return null
  const items = new Map<InventoryItem['id'], InventoryItem>()
  for (const candidate of value) {
    if (!isRecord(candidate) || (candidate.id !== 'moon-potion' && candidate.id !== 'ash-key') || typeof candidate.label !== 'string' || (candidate.kind !== 'consumable' && candidate.kind !== 'quest') || typeof candidate.quantity !== 'number' || !Number.isInteger(candidate.quantity) || candidate.quantity <= 0) return null
    const id = candidate.id
    const label = candidate.label
    const quantity = candidate.quantity
    const kind = candidate.kind
    const existing = items.get(id)
    if (existing) existing.quantity += quantity
    else items.set(id, { id, label, quantity, kind, equippable: candidate.equippable === true })
  }
  return [...items.values()]
}

function validateNormalizedSession(session: MvpSession): boolean {
  return validateCharacter(session.character) && session.inventory.every((item) => item.quantity > 0) && session.encounter.enemyMaxHp > 0
}

function valueOfEncounterStatus(value: unknown): MvpSession['encounter']['status'] { return value === 'active' || value === 'victory' || value === 'defeat' ? value : 'idle' }
function finiteOrNull(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null }
function finiteNumber(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null }
function finiteOrZero(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : 0 }
function nonNegativeNumber(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback }
function positiveNumber(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
