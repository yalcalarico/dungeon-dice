import { describe, expect, it } from 'vitest'
import { createCharacter } from '../characters/character'
import { applyMvpAction, createMvpSession } from './campaign'

const character = createCharacter('Alda', 'vanguard', 'wanderer', '00000000-0000-4000-8000-000000000001')

describe('MVP campaign rules', () => {
  it('keeps travel, NPC progress and rewards in the campaign state', () => {
    let session = createMvpSession(character)
    session = applyMvpAction(session, { type: 'inspect-relic' })
    session = applyMvpAction(session, { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'talk-npc' })

    expect(session.npcTrust).toBe(1)
    expect(session.experience).toBe(25)
    expect(session.inventory[0].id).toBe('ash-key')
    expect(session.visitedZoneIds).toContain('ashen-courtyard')
  })

  it('makes encounter rewards idempotent and supports defeat recovery', () => {
    let session = applyMvpAction(createMvpSession(character), { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'start-encounter' })
    for (let turn = 0; turn < 4; turn++) { session = applyMvpAction(session, { type: 'attack' }); session = applyMvpAction(session, { type: 'resolve-attack', roll: 20 }); if (session.encounter.turn === 'enemy') session = applyMvpAction(session, { type: 'resolve-enemy-turn' }) }

    expect(session.encounter.status).toBe('victory')
    expect(session.experience).toBe(40)
    expect(session.inventory[0].quantity).toBe(2)

    const repeated = applyMvpAction(session, { type: 'inspect-relic' })
    expect(repeated.experience).toBe(65)

    const repeatedAgain = applyMvpAction(repeated, { type: 'inspect-relic' })
    expect(repeatedAgain.experience).toBe(65)
    expect(repeatedAgain.inventory.filter((item) => item.id === 'ash-key')[0].quantity).toBe(1)
  })

  it('keeps NPC dialogue state contextual and capped', () => {
    const outside = applyMvpAction(createMvpSession(character), { type: 'talk-npc' })
    expect(outside.npcTrust).toBe(0)

    let session = applyMvpAction(outside, { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'talk-npc' })
    session = applyMvpAction(session, { type: 'talk-npc' })
    const finished = applyMvpAction(session, { type: 'talk-npc' })

    expect(session.npcTrust).toBe(2)
    expect(finished.npcTrust).toBe(2)
    expect(finished.log.at(-1)).toContain('todo lo que sabe')
  })

  it('persists a route decision and supports retreat without rewards', () => {
    let session = applyMvpAction(createMvpSession(character), { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'talk-npc' })
    session = applyMvpAction(session, { type: 'choose-route', route: 'relic' })
    session = applyMvpAction(session, { type: 'start-encounter' })
    const retreated = applyMvpAction(session, { type: 'retreat' })

    expect(session.routeChoice).toBe('relic')
    expect(retreated.encounter.status).toBe('idle')
    expect(retreated.experience).toBe(0)
  })

  it('keeps inventory quantities and protects quest items', () => {
    let session = applyMvpAction(createMvpSession(character), { type: 'inspect-relic' })
    const blocked = applyMvpAction(session, { type: 'drop-item', itemId: 'ash-key' })
    expect(blocked.inventory[0].quantity).toBe(1)

    session = { ...session, inventory: [{ id: 'moon-potion', label: 'Poción lunar', quantity: 2, kind: 'consumable' }], character: { ...session.character, resources: { ...session.character.resources, hp: 10 }, inventory: ['moon-potion', 'moon-potion'] } }
    const used = applyMvpAction(session, { type: 'use-potion' })
    expect(used.inventory[0].quantity).toBe(1)
    expect(used.character.inventory).toEqual(['moon-potion'])
  })

  it('reduces HP and reaches defeat without awarding victory XP', () => {
    let session = applyMvpAction(createMvpSession(character), { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'start-encounter' })
    for (let turn = 0; turn < 15; turn++) { session = applyMvpAction(session, { type: 'attack' }); session = applyMvpAction(session, { type: 'resolve-attack', roll: 1 }); if (session.encounter.turn === 'enemy') session = applyMvpAction(session, { type: 'resolve-enemy-turn' }) }

    expect(session.encounter.status).toBe('defeat')
    expect(session.experience).toBe(0)
    expect(session.character.resources.hp).toBe(0)
  })

  it('preserves damaged HP when traveling between zones', () => {
    const damaged = { ...createMvpSession(character), character: { ...character, resources: { ...character.resources, hp: 4 } } }
    const traveled = applyMvpAction(damaged, { type: 'travel', zoneId: 'ashen-courtyard' })

    expect(traveled.character.resources.hp).toBe(4)
  })

  it('uses strength, armor class and variable damage for player attacks', () => {
    let session = applyMvpAction(createMvpSession(character), { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'start-encounter' })
    const resolved = applyMvpAction(session, { type: 'resolve-attack', roll: 15, die: 13, modifier: 2, damageRoll: 1 })

    expect(resolved.encounter.enemyHp).toBe(15)
    expect(resolved.log.at(-1)).toContain('Causas 3 de daño')
  })

  it('allows player attacks to miss when the total is below enemy armor class', () => {
    let session = applyMvpAction(createMvpSession(character), { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'start-encounter' })
    const resolved = applyMvpAction(session, { type: 'resolve-attack', roll: 11, die: 11, modifier: 0, damageRoll: 8 })

    expect(resolved.encounter.enemyHp).toBe(18)
    expect(resolved.log.at(-1)).toContain('esquiva')
  })

  it('allows enemy attacks to miss or deal variable damage against player armor class', () => {
    const scout = createCharacter('Lía', 'scout', 'wanderer', '00000000-0000-4000-8000-000000000002')
    let session = applyMvpAction(createMvpSession(scout), { type: 'travel', zoneId: 'ashen-courtyard' })
    session = applyMvpAction(session, { type: 'start-encounter' })
    session = applyMvpAction(session, { type: 'resolve-attack', roll: 1, die: 1, modifier: 2 })
    const missed = applyMvpAction(session, { type: 'resolve-enemy-turn', roll: 11, die: 7, modifier: 4, damageRoll: 20 })

    expect(missed.character.resources.hp).toBe(scout.resources.hp)
    expect(missed.log.at(-1)).toContain('falla')

    const hit = applyMvpAction(missed, { type: 'resolve-attack', roll: 20, die: 20, modifier: 2, damageRoll: 1 })
    const damaged = applyMvpAction(hit, { type: 'resolve-enemy-turn', roll: 24, die: 20, modifier: 4, damageRoll: 6 })
    expect(damaged.character.resources.hp).toBe(scout.resources.hp - 7)
    expect(damaged.log.at(-1)).toContain('causa 7 de daño')
  })
})
