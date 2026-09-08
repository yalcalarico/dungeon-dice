import { validateCharacter, type Character } from '../characters/character'
import type { MvpSession } from './campaign'

const CHARACTER_KEY = 'dungeon-dice:characters:v1'
const SESSION_KEY = 'dungeon-dice:mvp-session:v1'

export function loadCharacters(): Character[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(CHARACTER_KEY) ?? '[]'); return Array.isArray(value) ? value.filter(validateCharacter) : [] } catch { return [] }
}

export function saveCharacter(character: Character): void {
  const characters = loadCharacters().filter((candidate) => candidate.id !== character.id)
  localStorage.setItem(CHARACTER_KEY, JSON.stringify([...characters, character]))
}

export function loadMvpSession(characterId: string): MvpSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(`${SESSION_KEY}:${characterId}`) ?? 'null') as MvpSession | null
    if (value?.character?.id !== characterId) return null
    return { ...value, lastRoll: value.lastRoll ?? null, lastDie: value.lastDie ?? value.lastRoll ?? null, lastModifier: value.lastModifier ?? 0, encounter: { ...value.encounter, awaitingRoll: value.encounter.awaitingRoll ?? false, turn: value.encounter.turn ?? 'player', pendingEnemyDamage: value.encounter.pendingEnemyDamage ?? 0 } }
  } catch { return null }
}

export function saveMvpSession(session: MvpSession): void { localStorage.setItem(`${SESSION_KEY}:${session.character.id}`, JSON.stringify(session)) }
