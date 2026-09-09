import type { Character } from '../characters/character'
import type { MvpSession, InventoryItem } from '../mvp/campaign'
import type { GameState } from './game-state'

export function syncCharacterToGameState(state: GameState, character: Character): GameState {
  return {
    ...state,
    zoneId: state.zoneId,
    player: {
      ...state.player,
      ...character.resources,
      attributes: { ...character.attributes },
      level: character.level,
      experience: character.experience,
      inventory: [...character.inventory],
    },
  }
}

export function syncGameStateToCharacter(character: Character, state: GameState): Character {
  return {
    ...character,
    level: state.player.level ?? character.level,
    experience: state.player.experience ?? character.experience,
    attributes: { ...state.player.attributes },
    resources: {
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      mp: state.player.mp,
      maxMp: state.player.maxMp,
    },
    inventory: [...(state.player.inventory ?? character.inventory)],
  }
}

export function syncGameStateToMvpSession(session: MvpSession, state: GameState): MvpSession {
  const character = syncGameStateToCharacter(session.character, state)
  const inventory = inventoryFromCharacter(character.inventory, session.inventory)

  return {
    ...session,
    character,
    zoneId: isMvpZone(state.zoneId) ? state.zoneId : session.zoneId,
    visitedZoneIds: [...state.visitedZoneIds],
    inventory,
    experience: character.experience,
    level: character.level,
    completedMilestones: [...character.completedMilestones],
  }
}

export function syncMvpSessionToGameState(state: GameState, session: MvpSession): GameState {
  const next = syncCharacterToGameState(state, session.character)
  return {
    ...next,
    zoneId: session.zoneId,
    visitedZoneIds: [...session.visitedZoneIds],
  }
}

function inventoryFromCharacter(ids: string[], existing: InventoryItem[]): InventoryItem[] {
  const inventory: InventoryItem[] = []
  for (const id of ids) {
    const item = existing.find((candidate) => candidate.id === id) ?? knownInventoryItem(id)
    if (!item) continue
    const current = inventory.find((candidate) => candidate.id === item.id)
    if (current) current.quantity += 1
    else inventory.push({ ...item, quantity: 1 })
  }
  return inventory
}

function knownInventoryItem(id: string): InventoryItem | null {
  if (id === 'moon-potion') return { id, label: 'Poción lunar', quantity: 1, kind: 'consumable' }
  if (id === 'ash-key') return { id, label: 'Llave de ceniza', quantity: 1, kind: 'quest', equippable: true }
  return null
}

function isMvpZone(zoneId: string): zoneId is MvpSession['zoneId'] {
  return zoneId === 'crypt-of-lunargenta' || zoneId === 'ashen-courtyard'
}
