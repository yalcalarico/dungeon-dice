import { describe, expect, it } from 'vitest'
import { PerformanceTracker } from './PerformanceTracker'

describe('PerformanceTracker', () => {
  it('starts with an empty snapshot', () => {
    const tracker = new PerformanceTracker({ windowSeconds: 2 })

    expect(tracker.getSnapshot()).toEqual({
      sampleCount: 0,
      windowSeconds: 2,
      averageFps: 0,
      minimumFps: 0,
      averageFrameTimeSeconds: 0,
      minimumFrameTimeSeconds: 0,
      maximumFrameTimeSeconds: 0,
      lastTimestampSeconds: null,
    })
  })

  it('reports average, minimum, and maximum frame metrics', () => {
    const tracker = new PerformanceTracker()

    tracker.recordFrame(0, 0.01)
    tracker.recordFrame(0.01, 0.02)
    tracker.recordFrame(0.02, 0.04)

    const snapshot = tracker.getSnapshot()

    expect(snapshot.sampleCount).toBe(3)
    expect(snapshot.averageFrameTimeSeconds).toBeCloseTo(0.07 / 3)
    expect(snapshot.minimumFrameTimeSeconds).toBe(0.01)
    expect(snapshot.maximumFrameTimeSeconds).toBe(0.04)
    expect(snapshot.averageFps).toBeCloseTo(3 / 0.07)
    expect(snapshot.minimumFps).toBe(25)
    expect(snapshot.lastTimestampSeconds).toBe(0.02)
  })

  it('expires samples outside the rolling window', () => {
    const tracker = new PerformanceTracker({ windowSeconds: 1 })

    tracker.recordFrame(0, 0.01)
    tracker.recordFrame(0.5, 0.02)
    tracker.recordFrame(1, 0.04)

    const snapshot = tracker.getSnapshot()

    expect(snapshot.sampleCount).toBe(2)
    expect(snapshot.windowSeconds).toBe(1)
    expect(snapshot.averageFps).toBeCloseTo(1 / 0.03)
    expect(snapshot.averageFrameTimeSeconds).toBeCloseTo(0.03)
    expect(snapshot.minimumFrameTimeSeconds).toBe(0.02)
    expect(snapshot.maximumFrameTimeSeconds).toBe(0.04)
    expect(snapshot.lastTimestampSeconds).toBe(1)
  })

  it('resets all collected metrics', () => {
    const tracker = new PerformanceTracker({ windowSeconds: 2 })

    tracker.recordFrame(1, 0.05)
    tracker.reset()

    expect(tracker.getSnapshot()).toEqual({
      sampleCount: 0,
      windowSeconds: 2,
      averageFps: 0,
      minimumFps: 0,
      averageFrameTimeSeconds: 0,
      minimumFrameTimeSeconds: 0,
      maximumFrameTimeSeconds: 0,
      lastTimestampSeconds: null,
    })
  })

  it('rejects invalid timestamps and deltas without changing the snapshot', () => {
    const tracker = new PerformanceTracker()
    tracker.recordFrame(1, 0.02)
    const initialSnapshot = tracker.getSnapshot()

    for (const timestamp of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0]) {
      expect(() => tracker.recordFrame(timestamp, 0.02)).toThrow(RangeError)
    }

    for (const delta of [0, -0.01, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => tracker.recordFrame(1, delta)).toThrow(RangeError)
    }

    expect(tracker.getSnapshot()).toEqual(initialSnapshot)
  })

  it('allows zero and duplicate timestamps while requiring non-decreasing time', () => {
    const tracker = new PerformanceTracker({ windowSeconds: 1 })

    tracker.recordFrame(0, 0.01)
    tracker.recordFrame(0, 0.03)

    expect(tracker.getSnapshot()).toMatchObject({
      sampleCount: 2,
      averageFrameTimeSeconds: 0.02,
      minimumFrameTimeSeconds: 0.01,
      maximumFrameTimeSeconds: 0.03,
      lastTimestampSeconds: 0,
    })
    expect(() => tracker.recordFrame(-0.01, 0.02)).toThrow(RangeError)
  })
})
