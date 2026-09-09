import type { Character } from '../characters/character'
import { attributeModifier } from '../characters/character'
import { getDialogueNode, iriaDialogue } from '../content/dialogue'
import { awardMilestone, findMilestone } from '../progression/progression'

export type InventoryItem = { id: 'moon-potion' | 'ash-key'; label: string; quantity: number; kind: 'consumable' | 'quest'; equippable?: boolean }
export type EncounterStatus = 'idle' | 'active' | 'victory' | 'defeat'
export const INVENTORY_CAPACITY = 12
export const SENTINEL_ARMOR_CLASS = 14
export const SENTINEL_ATTACK_BONUS = 4

export type MvpSession = {
  character: Character
  zoneId: 'crypt-of-lunargenta' | 'ashen-courtyard'
  visitedZoneIds: string[]
  npcTrust: number
  inventory: InventoryItem[]
  equippedItemId: InventoryItem['id'] | null
  inventoryCapacity: number
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
  | { type: 'resolve-attack'; roll: number; die?: number; modifier?: number; damageRoll?: number }
  | { type: 'resolve-enemy-turn'; roll?: number; die?: number; modifier?: number; damageRoll?: number }
  | { type: 'use-potion' }
  | { type: 'drop-item'; itemId: InventoryItem['id'] }
  | { type: 'equip-item'; itemId: InventoryItem['id'] }
  | { type: 'reset-encounter' }

export function createMvpSession(character: Character): MvpSession {
  const inventory = inventoryFromCharacter(character.inventory)
  return {
    character,
    zoneId: 'crypt-of-lunargenta',
    visitedZoneIds: ['crypt-of-lunargenta'],
    npcTrust: 0,
    inventory,
    equippedItemId: null,
    inventoryCapacity: INVENTORY_CAPACITY,
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
  if (action.type === 'talk-npc') {
    if (session.zoneId !== 'ashen-courtyard') return append(session, 'Iria no está aquí.')
    const dialogue = getDialogueNode(iriaDialogue, session.npcTrust)
    return append({ ...session, npcTrust: Math.max(session.npcTrust, dialogue.nextTrust ?? session.npcTrust) }, dialogue.text)
  }
  if (action.type === 'inspect-relic') return milestone(session, 'relic-discovered', 25, { id: 'ash-key', label: 'Llave de ceniza', quantity: 1, kind: 'quest', equippable: true }, 'La reliquia revela un fragmento de la historia de Lunargenta.')
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
    const character = syncCharacterInventory({ ...session.character, resources: { ...session.character.resources, hp: Math.min(session.character.resources.maxHp, session.character.resources.hp + 8) } }, inventory)
    return append({ ...session, character, inventory }, 'Bebes una poción lunar y recuperas 8 HP.')
  }
  if (action.type === 'drop-item') {
    const item = session.inventory.find((candidate) => candidate.id === action.itemId)
    if (!item) return session
    if (item.kind === 'quest') return append(session, `${item.label} es necesaria para la campaña y no puedes dejarla.`)
    const inventory = session.inventory.map((candidate) => candidate.id === item.id ? { ...candidate, quantity: candidate.quantity - 1 } : candidate).filter((candidate) => candidate.quantity > 0)
    const droppedIndex = session.character.inventory.indexOf(item.id)
    const character = syncCharacterInventory({ ...session.character, inventory: droppedIndex < 0 ? session.character.inventory : session.character.inventory.filter((_itemId, index) => index !== droppedIndex) }, inventory)
    return append({ ...session, inventory, character }, `Dejas una unidad de ${item.label}.`)
  }
  if (action.type === 'equip-item') {
    const item = session.inventory.find((candidate) => candidate.id === action.itemId)
    if (!item || item.equippable !== true) return append(session, 'Ese objeto no puede equiparse.')
    return append({ ...session, equippedItemId: item.id }, `Equipas ${item.label}.`)
  }
  if (action.type === 'attack') {
    if (session.encounter.status !== 'active' || session.encounter.awaitingRoll || session.encounter.turn !== 'player') return session
    return append({ ...session, encounter: { ...session.encounter, awaitingRoll: true } }, 'Elige tu objetivo y lanza el D20 para atacar.')
  }
  if (action.type === 'resolve-enemy-turn') {
    if (session.encounter.status !== 'active' || session.encounter.turn !== 'enemy') return session
    const die = action.die ?? action.roll ?? 10
    const roll = action.roll ?? die + (action.modifier ?? SENTINEL_ATTACK_BONUS)
    const modifier = action.modifier ?? SENTINEL_ATTACK_BONUS
    const armorClass = playerArmorClass(session.character)
    const hit = doesAttackHit(die, roll, armorClass)
    const damageDie = normalizeDamageRoll(action.damageRoll ?? 3)
    const damage = hit ? calculateDamage(damageDie, 1) : 0
    const playerHp = Math.max(0, session.character.resources.hp - damage)
    const attackText = `Contraataque: d20 ${die} ${formatModifier(modifier)} = ${roll} contra CA ${armorClass}.`
    if (playerHp === 0) return append({ ...session, character: { ...session.character, resources: { ...session.character.resources, hp: 0 } }, encounter: { ...session.encounter, status: 'defeat', turn: 'player', pendingEnemyDamage: 0 } }, `${attackText} El centinela causa ${damage} de daño (1D6: ${damageDie} +1) y te derriba. Puedes reintentar el encuentro.`)
    return append({ ...session, character: { ...session.character, resources: { ...session.character.resources, hp: playerHp } }, encounter: { ...session.encounter, turn: 'player', awaitingRoll: true, pendingEnemyDamage: 0 } }, hit ? `${attackText} El contraataque causa ${damage} de daño (1D6: ${damageDie} +1). Es tu turno: lanza el D20.` : `${attackText} El centinela falla. Es tu turno: lanza el D20.`)
  }
  if (session.encounter.status !== 'active' || !session.encounter.awaitingRoll || session.encounter.turn !== 'player') return session
  const die = action.die ?? action.roll
  const modifier = action.modifier ?? attributeModifier(session.character.attributes.strength)
  const hit = doesAttackHit(die, action.roll, SENTINEL_ARMOR_CLASS)
  const damageDie = normalizeDamageRoll(action.damageRoll ?? 4)
  const damage = hit ? calculateDamage(damageDie, modifier) : 0
  const enemyHp = Math.max(0, session.encounter.enemyHp - damage)
  if (enemyHp === 0) return milestone({ ...session, lastRoll: action.roll, lastDie: action.die ?? action.roll, lastModifier: action.modifier ?? 0, encounter: { ...session.encounter, status: 'victory', enemyHp: 0, turns: session.encounter.turns + 1, awaitingRoll: false, pendingEnemyDamage: 0 } }, 'sentinel-defeated', 40, { id: 'moon-potion', label: 'Poción lunar', quantity: 2, kind: 'consumable' }, hit ? 'Tu golpe rompe la armadura del centinela.' : 'El centinela cae después de tu último intercambio.')
  const modifierText = formatModifier(modifier)
  const attackText = `Ataque: d20 ${die} ${modifierText} = ${action.roll} contra CA ${SENTINEL_ARMOR_CLASS}.`
  return append({ ...session, lastRoll: action.roll, lastDie: die, lastModifier: modifier, encounter: { ...session.encounter, enemyHp, turns: session.encounter.turns + 1, awaitingRoll: false, turn: 'enemy', pendingEnemyDamage: 0 } }, hit ? `${attackText} Causas ${damage} de daño (1D6: ${damageDie} ${formatModifier(modifier)}).` : `${attackText} El centinela esquiva y no causas daño.`)
}

function playerArmorClass(character: Character): number { return 10 + attributeModifier(character.attributes.dexterity) }

export function doesAttackHit(die: number, total: number, armorClass: number): boolean { return die !== 1 && (die === 20 || total >= armorClass) }

function normalizeDamageRoll(damageRoll: number): number { return ((Math.floor(damageRoll) - 1) % 6) + 1 }

function calculateDamage(damageRoll: number, modifier: number): number { return Math.max(1, damageRoll + modifier) }

function formatModifier(modifier: number): string { return `${modifier >= 0 ? '+' : ''}${modifier}` }

function milestone(session: MvpSession, id: string, experience: number, item: InventoryItem, message: string): MvpSession {
  if (session.completedMilestones.includes(id)) return append(session, message)
  const progression = awardMilestone({ experience: session.experience, level: session.level, completedMilestones: session.completedMilestones }, findMilestone(id) ?? { id, experience, label: message })
  const inventory = addInventoryItem(session.inventory, item)
  const character = syncCharacterInventory({ ...session.character, experience: progression.experience, level: progression.level, completedMilestones: unique([...session.character.completedMilestones, id]) }, inventory)
  return append({ ...session, experience: progression.experience, level: progression.level, inventory, completedMilestones: progression.completedMilestones, character }, `${message} +${progression.experience - session.experience} XP.`)
}

function append(session: MvpSession, message: string): MvpSession { return { ...session, log: [...session.log, message].slice(-12) } }

function addInventoryItem(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const existing = inventory.find((candidate) => candidate.id === item.id)
  if (existing) return inventory.map((candidate) => candidate.id === item.id ? { ...candidate, quantity: candidate.quantity + item.quantity } : candidate)
  return [...inventory, item]
}

function inventoryFromCharacter(ids: string[]): InventoryItem[] {
  const inventory: InventoryItem[] = []
  for (const id of ids) {
    const item = id === 'moon-potion' ? { id: 'moon-potion' as const, label: 'Poción lunar', quantity: 1, kind: 'consumable' as const } : id === 'ash-key' ? { id: 'ash-key' as const, label: 'Llave de ceniza', quantity: 1, kind: 'quest' as const, equippable: true } : null
    if (!item) continue
    const existing = inventory.find((candidate) => candidate.id === item.id)
    if (existing) existing.quantity += 1
    else inventory.push(item)
  }
  return inventory
}

function syncCharacterInventory(character: Character, inventory: InventoryItem[]): Character {
  return { ...character, inventory: inventory.flatMap((item) => Array.from({ length: Math.max(0, item.quantity) }, () => item.id)) }
}

function unique(values: string[]): string[] { return [...new Set(values)] }
