import { describe, expect, it } from 'vitest'
import { getDialogueNode, iriaDialogue } from './dialogue'

describe('declarative dialogue', () => {
  it('selects Iria dialogue from relationship state', () => {
    expect(getDialogueNode(iriaDialogue, 0).id).toBe('iria-route')
    expect(getDialogueNode(iriaDialogue, 1).id).toBe('iria-relic')
    expect(getDialogueNode(iriaDialogue, 2).id).toBe('iria-farewell')
  })
})
