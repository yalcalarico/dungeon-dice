import { describe, expect, it } from 'vitest'
import { findNearestInteraction, type InteractionTarget } from './interaction'

const targets: InteractionTarget[] = [
  { id: 'altar', label: 'Altar', position: { x: 1, z: 1 }, radius: 2, availableActionIds: ['inspect'] },
  { id: 'torch', label: 'Torch', position: { x: 3, z: 0 }, radius: 2, availableActionIds: ['light'] },
]

describe('interaction system', () => {
  it('returns the nearest target within its interaction radius', () => {
    expect(findNearestInteraction({ x: 2, z: 0 }, targets)?.id).toBe('torch')
  })

  it('returns null when no target is in range', () => {
    expect(findNearestInteraction({ x: 10, z: 10 }, targets)).toBeNull()
  })
})
