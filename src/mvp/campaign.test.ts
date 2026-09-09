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
})
