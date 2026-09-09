import type { Character } from '../characters/character'
import { attributeModifier } from '../characters/character'
import { campaignLevels, getLevelByZoneId, type LevelConfig, type LevelEnemy, type LevelReward, type LevelRewardItem } from '../content'
import { awardMilestone } from '../progression/progression'

export type InventoryItem = { id: string; label: string; quantity: number; kind: 'consumable' | 'quest'; equippable?: boolean }
export type EncounterStatus = 'idle' | 'active' | 'victory' | 'defeat'
export type RouteChoice = 'relic' | 'direct'
export const INVENTORY_CAPACITY = 12
const defaultEnemy = campaignLevels.flatMap((level) => level.enemies ?? [])[0]
export const SENTINEL_ARMOR_CLASS = defaultEnemy?.stats.armorClass ?? 10
export const SENTINEL_ATTACK_BONUS = defaultEnemy?.stats.attackBonus ?? 0

export type MvpSession = {
  character: Character
  zoneId: string
  visitedZoneIds: string[]
  npcTrust: number
  routeChoice: RouteChoice | null
  checkpoint: { zoneId: string; hp: number }
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
  | { type: 'choose-route'; route: RouteChoice }
  | { type: 'inspect-relic' }
  | { type: 'start-encounter' }
  | { type: 'attack' }
  | { type: 'resolve-attack'; roll: number; die?: number; modifier?: number; damageRoll?: number }
  | { type: 'resolve-enemy-turn'; roll?: number; die?: number; modifier?: number; damageRoll?: number }
  | { type: 'use-potion' }
  | { type: 'drop-item'; itemId: InventoryItem['id'] }
  | { type: 'equip-item'; itemId: InventoryItem['id'] }
  | { type: 'reset-encounter' }
  | { type: 'retreat' }

export function createMvpSession(character: Character): MvpSession {
  const inventory = inventoryFromCharacter(character.inventory)
  return {
    character,
    zoneId: campaignLevels[0].id as MvpSession['zoneId'],
    visitedZoneIds: [campaignLevels[0].id],
    npcTrust: 0,
    routeChoice: null,
    checkpoint: { zoneId: campaignLevels[0].id as MvpSession['zoneId'], hp: character.resources.hp },
    inventory,
    equippedItemId: null,
    inventoryCapacity: INVENTORY_CAPACITY,
    experience: character.experience,
    lastRoll: null,
    lastDie: null,
    lastModifier: 0,
    level: character.level,
    encounter: createIdleEncounter(findEnemy(campaignLevels[0])),
    completedMilestones: [...character.completedMilestones],
    log: ['La campaña está lista. Elige un rumbo.'],
  }
}

export function applyMvpAction(session: MvpSession, action: MvpAction): MvpSession {
  return synchronizeMvpSession(applyMvpActionInternal(synchronizeMvpSession(session), action))
}

export function synchronizeMvpSession(session: MvpSession): MvpSession {
  const inventory = inventoryFromCharacter(session.character.inventory)
  return {
    ...session,
    character: { ...session.character, inventory: inventory.flatMap((item) => Array.from({ length: item.quantity }, () => item.id)) },
    inventory,
    experience: session.character.experience,
    level: session.character.level,
    completedMilestones: [...session.character.completedMilestones],
  }
}

function applyMvpActionInternal(session: MvpSession, action: MvpAction): MvpSession {
  if (action.type === 'travel') {
    if (session.zoneId === action.zoneId) return session
    const next = { ...session, zoneId: action.zoneId, checkpoint: { zoneId: action.zoneId, hp: session.character.resources.hp }, visitedZoneIds: session.visitedZoneIds.includes(action.zoneId) ? session.visitedZoneIds : [...session.visitedZoneIds, action.zoneId] }
    return append(next, `Llegas a ${getLevel(action.zoneId).title}.`)
  }
  if (action.type === 'talk-npc') {
    const level = getLevel(session.zoneId)
    const npc = level.npcs?.[0]
    const dialogue = level.dialogues?.filter((candidate) => candidate.npcId === npc?.id).findLast((candidate) => session.npcTrust >= candidate.minTrust)
    if (!npc || !dialogue) return append(session, 'No hay nadie aquí con quien hablar.')
    return append({ ...session, npcTrust: Math.max(session.npcTrust, dialogue.nextTrust ?? session.npcTrust) }, dialogue.text)
  }
  if (action.type === 'choose-route') {
    const route = getLevel(session.zoneId).routeChoices?.find((candidate) => candidate.id === action.route)
    if (!route || session.npcTrust < route.minTrust || session.routeChoice !== null) return session
    return append({ ...session, routeChoice: action.route }, `Decides: ${route.label}.`)
  }
  if (action.type === 'inspect-relic') {
    const level = getLevel(session.zoneId)
    const relicLevel = campaignLevels.find((candidate) => (candidate.relics?.length ?? 0) > 0)
    const relic = relicLevel?.relics?.[0]
    const rewardId = relic?.rewardIds[0]
    const selectedRoute = getLevel(session.zoneId).routeChoices?.find((route) => route.id === session.routeChoice)
    const routeAllowsRelic = !selectedRoute || selectedRoute.rewardIds.some((id) => relic?.rewardIds.includes(id))
    if (!relic || !rewardId || !routeAllowsRelic) return append(session, 'La ruta elegida deja la reliquia fuera de tu alcance.')
    return grantReward(session, rewardId, `La reliquia revela un fragmento de la historia de ${level.title}.`)
  }
  if (action.type === 'start-encounter') {
    const enemy = findEnemy(getLevel(session.zoneId))
    if (!enemy || session.encounter.status !== 'idle') return session
    return append({ ...session, encounter: { ...createIdleEncounter(enemy), status: 'active', awaitingRoll: true } }, `${enemy.name} despierta. Lanza el D20 para comenzar tu turno.`)
  }
  if (action.type === 'reset-encounter') {
    const character = session.encounter.status === 'defeat' ? { ...session.character, resources: { ...session.character.resources, hp: Math.max(1, Math.min(session.character.resources.maxHp, session.checkpoint.hp)) } } : session.character
    return append({ ...session, character, encounter: createIdleEncounter(findEnemy(getLevel(session.zoneId))) }, session.encounter.status === 'defeat' ? 'Vuelves al último punto seguro. Recuperas tus fuerzas y el encuentro está listo para reintentarse.' : 'El encuentro vuelve al último punto seguro.')
  }
  if (action.type === 'retreat') {
    if (session.encounter.status !== 'active') return session
    return append({ ...session, encounter: createIdleEncounter(findEnemy(getLevel(session.zoneId))) }, 'Te retiras del encuentro sin recibir recompensas. El enemigo sigue en guardia.')
  }
  if (action.type === 'use-potion' && session.encounter.status === 'active' && session.encounter.turn === 'enemy') return session
  if (action.type === 'use-potion') {
    const potion = session.inventory.find((item) => item.kind === 'consumable' && item.quantity > 0)
    if (!potion || session.character.resources.hp >= session.character.resources.maxHp) return append(session, 'No puedes usar una poción ahora.')
    const inventory = session.inventory.map((item) => item.id === potion.id ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0)
    const character = syncCharacterInventory({ ...session.character, resources: { ...session.character.resources, hp: Math.min(session.character.resources.maxHp, session.character.resources.hp + 8) } }, inventory)
    return append({ ...session, character, inventory }, `Usas ${potion.label} y recuperas 8 HP.`)
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
    const enemy = findEnemy(getLevel(session.zoneId))
    const attackBonus = enemy?.stats.attackBonus ?? SENTINEL_ATTACK_BONUS
    const die = action.die ?? action.roll ?? 10
    const roll = action.roll ?? die + (action.modifier ?? attackBonus)
    const modifier = action.modifier ?? attackBonus
    const armorClass = playerArmorClass(session.character)
     const hit = doesAttackHit(die, roll, armorClass)
     const damageDie = normalizeDamageRoll(action.damageRoll ?? 3)
     const damage = hit ? calculateDamage(damageDie, enemy?.stats.damage.modifier ?? 0) : 0
    const playerHp = Math.max(0, session.character.resources.hp - damage)
     const attackText = `Contraataque: d20 ${die} ${formatModifier(modifier)} = ${roll} contra CA ${armorClass}.`
     if (playerHp === 0) return append({ ...session, character: { ...session.character, resources: { ...session.character.resources, hp: 0 } }, encounter: { ...session.encounter, status: 'defeat', turn: 'player', pendingEnemyDamage: 0 } }, `${attackText} El enemigo causa ${damage} de daño (1D6: ${damageDie} +${enemy?.stats.damage.modifier ?? 0}) y te derriba. Puedes reintentar el encuentro.`)
     return append({ ...session, character: { ...session.character, resources: { ...session.character.resources, hp: playerHp } }, encounter: { ...session.encounter, turn: 'player', awaitingRoll: true, pendingEnemyDamage: 0 } }, hit ? `${attackText} El contraataque causa ${damage} de daño (1D6: ${damageDie} +${enemy?.stats.damage.modifier ?? 0}). Es tu turno: lanza el D20.` : `${attackText} El enemigo falla. Es tu turno: lanza el D20.`)
  }
  if (session.encounter.status !== 'active' || !session.encounter.awaitingRoll || session.encounter.turn !== 'player') return session
  const die = action.die ?? action.roll
  const modifier = action.modifier ?? attributeModifier(session.character.attributes.strength)
     const enemy = findEnemy(getLevel(session.zoneId))
     const armorClass = enemy?.stats.armorClass ?? SENTINEL_ARMOR_CLASS
     const hit = doesAttackHit(die, action.roll, armorClass)
     const damageDie = normalizeDamageRoll(action.damageRoll ?? 4)
     const damage = hit ? calculateDamage(damageDie, modifier) : 0
  const enemyHp = Math.max(0, session.encounter.enemyHp - damage)
   if (enemyHp === 0) {
      const rewardId = enemy?.rewardIds[0]
      const victory = rewardId ? grantReward({ ...session, lastRoll: action.roll, lastDie: action.die ?? action.roll, lastModifier: action.modifier ?? 0, encounter: { ...session.encounter, status: 'victory', enemyHp: 0, turns: session.encounter.turns + 1, awaitingRoll: false, pendingEnemyDamage: 0 } }, rewardId, hit ? 'Tu golpe rompe la armadura del enemigo.' : 'El enemigo cae después de tu último intercambio.') : session
      const routeRewardId = getLevel(session.zoneId).routeChoices?.find((route) => route.id === session.routeChoice)?.rewardIds[0]
      return routeRewardId && routeRewardId !== rewardId ? grantReward(victory, routeRewardId, 'El enemigo reconoce tu ruta y deja una recompensa.') : victory
   }
  const modifierText = formatModifier(modifier)
   const attackText = `Ataque: d20 ${die} ${modifierText} = ${action.roll} contra CA ${armorClass}.`
   return append({ ...session, lastRoll: action.roll, lastDie: die, lastModifier: modifier, encounter: { ...session.encounter, enemyHp, turns: session.encounter.turns + 1, awaitingRoll: false, turn: 'enemy', pendingEnemyDamage: 0 } }, hit ? `${attackText} Causas ${damage} de daño (1D6: ${damageDie} ${formatModifier(modifier)}).` : `${attackText} El enemigo esquiva y no causas daño.`)
}

function playerArmorClass(character: Character): number { return 10 + attributeModifier(character.attributes.dexterity) }

export function doesAttackHit(die: number, total: number, armorClass: number): boolean { return die !== 1 && (die === 20 || total >= armorClass) }

function normalizeDamageRoll(damageRoll: number): number { return ((Math.floor(damageRoll) - 1) % 6) + 1 }

function calculateDamage(damageRoll: number, modifier: number): number { return Math.max(1, damageRoll + modifier) }

function formatModifier(modifier: number): string { return `${modifier >= 0 ? '+' : ''}${modifier}` }

function grantReward(session: MvpSession, rewardId: string, message: string): MvpSession {
  const reward = findReward(campaignLevels, rewardId)
  if (!reward) return append(session, message)
  if (session.completedMilestones.includes(reward.id)) return append(session, message)
  const progression = awardMilestone({ experience: session.experience, level: session.level, completedMilestones: session.completedMilestones }, { id: reward.id, experience: reward.experience, label: reward.id })
  const inventory = reward.item ? addInventoryItem(session.inventory, reward.item) : session.inventory
  const character = syncCharacterInventory({ ...session.character, experience: progression.experience, level: progression.level, completedMilestones: unique([...session.character.completedMilestones, reward.id]) }, inventory)
  return append({ ...session, experience: progression.experience, level: progression.level, inventory, completedMilestones: progression.completedMilestones, character }, `${message} +${progression.experience - session.experience} XP.`)
}

function append(session: MvpSession, message: string): MvpSession { return { ...session, log: [...session.log, message].slice(-12) } }

function addInventoryItem(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const existing = inventory.find((candidate) => candidate.id === item.id)
  if (existing) return inventory.map((candidate) => candidate.id === item.id ? { ...candidate, quantity: candidate.quantity + item.quantity } : candidate)
  return [...inventory, item]
}

export function inventoryFromCharacter(ids: string[]): InventoryItem[] {
  const inventory: InventoryItem[] = []
  for (const id of ids) {
    const configuredItem = campaignLevels.flatMap((level) => level.rewards ?? []).map((reward) => reward.item).find((candidate): candidate is LevelRewardItem => candidate?.id === id)
    const item = configuredItem ? { ...configuredItem, quantity: 1 } : undefined
    if (!item) continue
    const existing = inventory.find((candidate) => candidate.id === item.id)
    if (existing) existing.quantity += 1
    else inventory.push(item)
  }
  return inventory
}

export function findInventoryItem(id: string): InventoryItem | undefined {
  const configuredItem = campaignLevels.flatMap((level) => level.rewards ?? [])
    .map((reward) => reward.item)
    .find((item): item is LevelRewardItem => item?.id === id)
  return configuredItem ? { ...configuredItem, quantity: 1 } : undefined
}

function syncCharacterInventory(character: Character, inventory: InventoryItem[]): Character {
  return { ...character, inventory: inventory.flatMap((item) => Array.from({ length: Math.max(0, item.quantity) }, () => item.id)) }
}

function unique(values: string[]): string[] { return [...new Set(values)] }

function getLevel(zoneId: string): LevelConfig { return getLevelByZoneId(zoneId) ?? campaignLevels[0] }

export function findEnemy(level: LevelConfig): LevelEnemy | undefined { return level.enemies?.[0] }

export function findReward(levels: readonly LevelConfig[], rewardId: string): LevelReward | undefined {
  return levels.flatMap((level) => level.rewards ?? []).find((reward) => reward.id === rewardId)
}

function createIdleEncounter(enemy: LevelEnemy | undefined): MvpSession['encounter'] {
  const maxHp = enemy?.stats.maxHp ?? 0
  return { status: 'idle', enemyHp: maxHp, enemyMaxHp: maxHp, turns: 0, awaitingRoll: false, turn: 'player', pendingEnemyDamage: 0 }
}
