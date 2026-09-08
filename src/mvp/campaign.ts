import type { Character } from '../characters/character'

export type InventoryItem = { id: 'moon-potion' | 'ash-key'; label: string; quantity: number; kind: 'consumable' | 'quest' }
export type EncounterStatus = 'idle' | 'active' | 'victory' | 'defeat'

export type MvpSession = {
  character: Character
  zoneId: 'crypt-of-lunargenta' | 'ashen-courtyard'
  visitedZoneIds: string[]
  npcTrust: number
  inventory: InventoryItem[]
  experience: number
  lastRoll: number | null
  lastDie: number | null
  lastModifier: number
  level: number
  encounter: { status: EncounterStatus; enemyHp: number; enemyMaxHp: number; turns: number; awaitingRoll: boolean; turn: 'player' | 'enemy'; pendingEnemyDamage: number }
  completedMilestones: string[]
  log: string[]
}

export type MvpAction =
  | { type: 'travel'; zoneId: MvpSession['zoneId'] }
  | { type: 'talk-npc' }
  | { type: 'inspect-relic' }
  | { type: 'start-encounter' }
  | { type: 'attack' }
  | { type: 'resolve-attack'; roll: number; die?: number; modifier?: number }
  | { type: 'resolve-enemy-turn' }
  | { type: 'use-potion' }
  | { type: 'drop-item'; itemId: InventoryItem['id'] }
  | { type: 'reset-encounter' }

export function createMvpSession(character: Character): MvpSession {
  return {
    character,
    zoneId: 'crypt-of-lunargenta',
    visitedZoneIds: ['crypt-of-lunargenta'],
    npcTrust: 0,
    inventory: [],
    experience: character.experience,
    lastRoll: null,
    lastDie: null,
    lastModifier: 0,
    level: character.level,
    encounter: { status: 'idle', enemyHp: 18, enemyMaxHp: 18, turns: 0, awaitingRoll: false, turn: 'player', pendingEnemyDamage: 0 },
    completedMilestones: [...character.completedMilestones],
    log: ['La campaña está lista. Elige un rumbo.'],
  }
}

export function applyMvpAction(session: MvpSession, action: MvpAction): MvpSession {
  if (action.type === 'travel') {
    if (session.zoneId === action.zoneId) return session
    return append({ ...session, zoneId: action.zoneId, visitedZoneIds: session.visitedZoneIds.includes(action.zoneId) ? session.visitedZoneIds : [...session.visitedZoneIds, action.zoneId] }, `Llegas a ${action.zoneId === 'ashen-courtyard' ? 'el Patio de Ceniza' : 'la Cripta de Lunargenta'}.`)
  }
  if (action.type === 'talk-npc') return append({ ...session, npcTrust: Math.min(2, session.npcTrust + 1) }, session.npcTrust === 0 ? 'Iria, la guardiana, te ofrece una ruta segura hacia el patio.' : 'Iria confía en ti y te entrega una pista sobre la reliquia.')
  if (action.type === 'inspect-relic') return milestone(session, 'relic-discovered', 25, { id: 'ash-key', label: 'Llave de ceniza', quantity: 1, kind: 'quest' }, 'La reliquia revela un fragmento de la historia de Lunargenta.')
  if (action.type === 'start-encounter') {
    if (session.zoneId !== 'ashen-courtyard' || session.encounter.status !== 'idle') return session
    return append({ ...session, encounter: { status: 'active', enemyHp: 18, enemyMaxHp: 18, turns: 0, awaitingRoll: true, turn: 'player', pendingEnemyDamage: 0 } }, 'El centinela de ceniza despierta. Lanza el D20 para comenzar tu turno.')
  }
  if (action.type === 'reset-encounter') {
    const character = session.encounter.status === 'defeat' ? { ...session.character, resources: { ...session.character.resources, hp: session.character.resources.maxHp } } : session.character
    return append({ ...session, character, encounter: { status: 'idle', enemyHp: 18, enemyMaxHp: 18, turns: 0, awaitingRoll: false, turn: 'player', pendingEnemyDamage: 0 } }, session.encounter.status === 'defeat' ? 'Vuelves al último punto seguro. Recuperas tus fuerzas y el encuentro está listo para reintentarse.' : 'El encuentro vuelve al último punto seguro.')
  }
  if (action.type === 'use-potion' && session.encounter.status === 'active' && session.encounter.turn === 'enemy') return session
  if (action.type === 'use-potion') {
    const potion = session.inventory.find((item) => item.id === 'moon-potion' && item.quantity > 0)
    if (!potion || session.character.resources.hp >= session.character.resources.maxHp) return append(session, 'No puedes usar una poción ahora.')
    const inventory = session.inventory.map((item) => item.id === 'moon-potion' ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0)
    const character = { ...session.character, resources: { ...session.character.resources, hp: Math.min(session.character.resources.maxHp, session.character.resources.hp + 8) } }
    return append({ ...session, character, inventory }, 'Bebes una poción lunar y recuperas 8 HP.')
  }
  if (action.type === 'drop-item') {
    const item = session.inventory.find((candidate) => candidate.id === action.itemId)
    if (!item) return session
    if (item.kind === 'quest') return append(session, `${item.label} es necesaria para la campaña y no puedes dejarla.`)
    const inventory = session.inventory.map((candidate) => candidate.id === item.id ? { ...candidate, quantity: candidate.quantity - 1 } : candidate).filter((candidate) => candidate.quantity > 0)
    const droppedIndex = session.character.inventory.indexOf(item.id)
    const character = { ...session.character, inventory: droppedIndex < 0 ? session.character.inventory : session.character.inventory.filter((_itemId, index) => index !== droppedIndex) }
    return append({ ...session, inventory, character }, `Dejas una unidad de ${item.label}.`)
  }
  if (action.type === 'attack') {
    if (session.encounter.status !== 'active' || session.encounter.awaitingRoll || session.encounter.turn !== 'player') return session
    return append({ ...session, encounter: { ...session.encounter, awaitingRoll: true } }, 'Elige tu objetivo y lanza el D20 para atacar.')
  }
  if (action.type === 'resolve-enemy-turn') {
    if (session.encounter.status !== 'active' || session.encounter.turn !== 'enemy') return session
    const playerHp = Math.max(0, session.character.resources.hp - session.encounter.pendingEnemyDamage)
    if (playerHp === 0) return append({ ...session, character: { ...session.character, resources: { ...session.character.resources, hp: 0 } }, encounter: { ...session.encounter, status: 'defeat', turn: 'player', pendingEnemyDamage: 0 } }, 'El centinela te derriba. Puedes reintentar el encuentro.')
    return append({ ...session, character: { ...session.character, resources: { ...session.character.resources, hp: playerHp } }, encounter: { ...session.encounter, turn: 'player', awaitingRoll: true, pendingEnemyDamage: 0 } }, `El contraataque causa ${session.encounter.pendingEnemyDamage} de daño. Es tu turno: lanza el D20.`)
  }
  if (session.encounter.status !== 'active' || !session.encounter.awaitingRoll || session.encounter.turn !== 'player') return session
  const hit = action.roll >= 10
  const enemyHp = hit ? Math.max(0, session.encounter.enemyHp - 6) : session.encounter.enemyHp
  if (enemyHp === 0) return milestone({ ...session, lastRoll: action.roll, lastDie: action.die ?? action.roll, lastModifier: action.modifier ?? 0, encounter: { ...session.encounter, status: 'victory', enemyHp: 0, turns: session.encounter.turns + 1, awaitingRoll: false, pendingEnemyDamage: 0 } }, 'sentinel-defeated', 40, { id: 'moon-potion', label: 'Poción lunar', quantity: 2, kind: 'consumable' }, hit ? 'Tu golpe rompe la armadura del centinela.' : 'El centinela cae después de tu último intercambio.')
  const modifier = action.modifier ?? 0
  const modifierText = `${modifier >= 0 ? '+' : ''}${modifier}`
  return append({ ...session, lastRoll: action.roll, lastDie: action.die ?? action.roll, lastModifier: modifier, encounter: { ...session.encounter, enemyHp, turns: session.encounter.turns + 1, awaitingRoll: false, turn: 'enemy', pendingEnemyDamage: 2 } }, hit ? `Ataque: d20 ${action.die ?? action.roll} ${modifierText} = ${action.roll}. Causas 6 de daño.` : `Ataque: d20 ${action.die ?? action.roll} ${modifierText} = ${action.roll}. El enemigo esquiva y no causas daño.`)
}

function milestone(session: MvpSession, id: string, experience: number, item: InventoryItem, message: string): MvpSession {
  if (session.completedMilestones.includes(id)) return append(session, message)
  const total = session.experience + experience
  const level = total >= 50 ? 2 : session.level
  return append({ ...session, experience: total, level, inventory: [...session.inventory, item], completedMilestones: [...session.completedMilestones, id], character: { ...session.character, experience: total, level, inventory: [...session.character.inventory, item.id], completedMilestones: [...session.character.completedMilestones, id] } }, `${message} +${experience} XP.`)
}

function append(session: MvpSession, message: string): MvpSession { return { ...session, log: [...session.log, message].slice(-12) } }
