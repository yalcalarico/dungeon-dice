import { describe, expect, it } from 'vitest'
import { QualityController } from './QualityController'

describe('QualityController', () => {
  it('lowers quality only after sustained low FPS', () => {
    const controller = new QualityController({ lowFpsThreshold: 45, highFpsThreshold: 58, lowFpsDurationSeconds: 1, initialQuality: 'high' })

    controller.update({ sampleCount: 10, averageFps: 30, lastTimestampSeconds: 0 })
    expect(controller.getQuality()).toBe('high')
    controller.update({ sampleCount: 10, averageFps: 30, lastTimestampSeconds: .5 })
    expect(controller.getQuality()).toBe('high')
    controller.update({ sampleCount: 10, averageFps: 30, lastTimestampSeconds: 1.1 })
    expect(controller.getQuality()).toBe('medium')
  })

  it('does not oscillate when FPS is between thresholds', () => {
    const controller = new QualityController({ initialQuality: 'medium', highFpsDurationSeconds: 1 })

    controller.update({ sampleCount: 10, averageFps: 52, lastTimestampSeconds: 0 })
    controller.update({ sampleCount: 10, averageFps: 52, lastTimestampSeconds: 5 })
    expect(controller.getQuality()).toBe('medium')
  })
})
