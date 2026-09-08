import { describe, expect, it } from 'vitest'
import { archetypes, createCharacter, validateCharacter, CharacterValidationError } from './character'

describe('character foundation', () => {
  it('creates the three differentiated archetypes', () => {
    const characters = archetypes.map((archetype) => createCharacter('Alda', archetype.id, 'wanderer', `character-${archetype.id}`))

    expect(characters).toHaveLength(3)
    expect(new Set(characters.map((character) => character.resources.maxHp)).size).toBe(3)
    expect(characters.every(validateCharacter)).toBe(true)
  })

  it('rejects invalid names and archetypes', () => {
    expect(() => createCharacter('?', 'missing', 'wanderer', 'fixed-id')).toThrow(CharacterValidationError)
    expect(validateCharacter({ schemaVersion: 1, name: 'Alda', archetypeId: 'vanguard' })).toBe(false)
  })

  it('starts with stable progression and empty inventory', () => {
    const character = createCharacter('Lía', 'channeler', 'wanderer', 'fixed-id')

    expect(character).toMatchObject({ id: 'fixed-id', level: 1, experience: 0, inventory: [], completedMilestones: [] })
    expect(character.abilities).toEqual(['focus'])
  })
})
