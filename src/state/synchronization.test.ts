import { beforeEach, describe, expect, it } from 'vitest'
import { createCharacter } from '../characters/character'
import { applyMvpAction, createMvpSession } from '../mvp/campaign'
import { loadMvpSession, saveMvpSession } from '../mvp/storage'
import { createInitialGameState } from './game-state'
import { syncCharacterToGameState, syncGameStateToMvpSession, syncMvpSessionToGameState } from './synchronization'

const character = {
  ...createCharacter('Alda', 'vanguard', 'wanderer', 'sync-character'),
  level: 2,
  experience: 25,
  resources: { hp: 12, maxHp: 24, mp: 3, maxMp: 4 },
  inventory: ['ash-key'],
}

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

describe('state synchronization contract', () => {
  beforeEach(() => { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: createStorage() }) })

  it('projects Character attributes, resources, progression and inventory through GameState', () => {
    const state = syncCharacterToGameState(createInitialGameState(), character)

    expect(state.player).toMatchObject({
      attributes: character.attributes,
      hp: 12,
      maxHp: 24,
      mp: 3,
      maxMp: 4,
      level: 2,
      experience: 25,
      inventory: ['ash-key'],
    })
  })

  it('keeps Character, GameState and MvpSession aligned after travel, combat and save/load', () => {
    let session = createMvpSession(character)
    session = applyMvpAction(session, { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'start-encounter' })
    session = applyMvpAction(session, { type: 'resolve-attack', roll: 1, die: 1 })
    session = applyMvpAction(session, { type: 'resolve-enemy-turn', roll: 24, die: 20, damageRoll: 3 })

    const gameState = syncMvpSessionToGameState(createInitialGameState(), session)
    const roundTripped = syncGameStateToMvpSession(session, gameState)
    saveMvpSession(roundTripped)
    const loaded = loadMvpSession(character.id)

    expect(loaded).not.toBeNull()
    expect(loaded?.character.attributes).toEqual(gameState.player.attributes)
    expect(loaded?.character.resources).toMatchObject({ hp: gameState.player.hp, maxHp: gameState.player.maxHp, mp: gameState.player.mp, maxMp: gameState.player.maxMp })
    expect(loaded?.character.level).toBe(gameState.player.level)
    expect(loaded?.character.experience).toBe(gameState.player.experience)
    expect(loaded?.character.inventory).toEqual(gameState.player.inventory)
    expect(loaded?.inventory.flatMap((item) => Array.from({ length: item.quantity }, () => item.id))).toEqual(gameState.player.inventory)
    expect(loaded?.zoneId).toBe('ashen-courtyard')
  })

  it('uses Character as the canonical value when legacy session mirrors diverge', () => {
    const session = createMvpSession(character)
    const loaded = saveMvpSession({ ...session, level: 99, experience: 999, inventory: [] })

    expect(loaded).toBe(true)
    expect(loadMvpSession(character.id)).toMatchObject({ level: 2, experience: 25, inventory: [{ id: 'ash-key', quantity: 1 }] })
  })
})
