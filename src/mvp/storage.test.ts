import { beforeEach, describe, expect, it } from 'vitest'
import { createCharacter } from '../characters/character'
import { createMvpSession } from './campaign'
import { loadMvpSession, saveMvpSession, validateMvpSession } from './storage'

const character = createCharacter('Alda', 'vanguard', 'wanderer', 'storage-character')
let storage: ReturnType<typeof createStorage>

function createStorage() {
  const values = new Map<string, string>()
  let failWrites = false
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (failWrites) throw new Error('quota exceeded'); values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    failWrites: () => { failWrites = true },
  }
}

describe('MVP storage', () => {
  beforeEach(() => { storage = createStorage(); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage }) })

  it('round-trips a session and normalizes the character inventory', () => {
    const session = createMvpSession({ ...character, inventory: ['moon-potion', 'moon-potion'] })
    saveMvpSession(session)

    const loaded = loadMvpSession(character.id)
    expect(loaded?.inventory).toMatchObject([{ id: 'moon-potion', quantity: 2 }])
    expect(loaded?.character.inventory).toEqual(['moon-potion', 'moon-potion'])
    expect(validateMvpSession(loaded, character.id)).toBe(true)
  })

  it('rejects corrupt or mismatched sessions', () => {
    localStorage.setItem('dungeon-dice:mvp-session:v1:storage-character', '{broken')
    expect(loadMvpSession(character.id)).toBeNull()
    expect(validateMvpSession({ character }, character.id)).toBe(false)
  })

  it('keeps the previous valid save when storage fails', () => {
    const session = createMvpSession(character)
    saveMvpSession(session)
    storage.failWrites()
    saveMvpSession({ ...session, experience: 25 })

    expect(loadMvpSession(character.id)?.experience).toBe(0)
  })

  it('migrates missing encounter fields from an older save', () => {
    const session = createMvpSession(character)
    const legacy = { ...session, encounter: { status: 'idle', enemyHp: 18, enemyMaxHp: 18, turns: 0 } }
    localStorage.setItem('dungeon-dice:mvp-session:v1:storage-character', JSON.stringify(legacy))

    expect(loadMvpSession(character.id)?.encounter).toMatchObject({ awaitingRoll: false, turn: 'player', pendingEnemyDamage: 0 })
  })
})
