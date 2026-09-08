export type PerformanceTrackerOptions = {
  /** Length of the rolling window, in seconds. */
  windowSeconds?: number
  /** Maximum number of samples retained by the rolling window. */
  maxSamples?: number
}

export type PerformanceSnapshot = {
  readonly sampleCount: number
  readonly windowSeconds: number
  readonly averageFps: number
  readonly minimumFps: number
  readonly averageFrameTimeSeconds: number
  readonly minimumFrameTimeSeconds: number
  readonly maximumFrameTimeSeconds: number
  readonly lastTimestampSeconds: number | null
}

export type PerformanceSnapshotTarget = {
  -readonly [Key in keyof PerformanceSnapshot]: PerformanceSnapshot[Key]
}

const DEFAULT_WINDOW_SECONDS = 1
const DEFAULT_MAX_SAMPLES = 240

/**
 * Collects frame timing data without relying on browser or renderer APIs.
 * Timestamps and deltas must both be expressed in seconds.
 */
export class PerformanceTracker {
  private readonly windowSeconds: number
  private readonly timestamps: Float64Array
  private readonly frameTimes: Float64Array
  private sampleCount = 0
  private writeIndex = 0
  private frameTimeTotal = 0
  private longestFrameTime = 0
  private shortestFrameTime = Number.POSITIVE_INFINITY
  private lastTimestampSeconds: number | null = null

  public constructor(options: PerformanceTrackerOptions = {}) {
    const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS
    const maxSamples = options.maxSamples ?? DEFAULT_MAX_SAMPLES

    if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) {
      throw new RangeError('windowSeconds must be a finite number greater than zero')
    }

    if (!Number.isInteger(maxSamples) || maxSamples <= 0) {
      throw new RangeError('maxSamples must be a positive integer')
    }

    this.windowSeconds = windowSeconds
    this.timestamps = new Float64Array(maxSamples)
    this.frameTimes = new Float64Array(maxSamples)
  }

  /** Adds one frame and expires samples outside the configured time window. */
  public recordFrame(timestampSeconds: number, deltaSeconds: number): void {
    if (!Number.isFinite(timestampSeconds)) {
      throw new RangeError('timestampSeconds must be finite')
    }

    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      throw new RangeError('deltaSeconds must be finite and greater than zero')
    }

    if (this.lastTimestampSeconds !== null && timestampSeconds < this.lastTimestampSeconds) {
      throw new RangeError('timestampSeconds must not move backwards')
    }

    if (this.sampleCount === this.frameTimes.length) {
      this.removeOldestSample()
    }

    this.timestamps[this.writeIndex] = timestampSeconds
    this.frameTimes[this.writeIndex] = deltaSeconds
    this.writeIndex = (this.writeIndex + 1) % this.frameTimes.length
    this.sampleCount += 1
    this.frameTimeTotal += deltaSeconds
    this.longestFrameTime = Math.max(this.longestFrameTime, deltaSeconds)
    this.shortestFrameTime = Math.min(this.shortestFrameTime, deltaSeconds)
    this.lastTimestampSeconds = timestampSeconds

    this.expireSamples(timestampSeconds)
  }

  /** Alias useful for callers that use update terminology in their render loop. */
  public update(timestampSeconds: number, deltaSeconds: number): void {
    this.recordFrame(timestampSeconds, deltaSeconds)
  }

  /** Clears all samples and returns the tracker to its initial state. */
  public reset(): void {
    this.sampleCount = 0
    this.writeIndex = 0
    this.frameTimeTotal = 0
    this.longestFrameTime = 0
    this.shortestFrameTime = Number.POSITIVE_INFINITY
    this.lastTimestampSeconds = null
  }

  /** Creates a stable snapshot. Call this at UI/diagnostic polling intervals, not every frame. */
  public getSnapshot(): PerformanceSnapshot {
    const snapshot: PerformanceSnapshotTarget = {
      sampleCount: 0,
      windowSeconds: this.windowSeconds,
      averageFps: 0,
      minimumFps: 0,
      averageFrameTimeSeconds: 0,
      minimumFrameTimeSeconds: 0,
      maximumFrameTimeSeconds: 0,
      lastTimestampSeconds: null,
    }

    this.copySnapshot(snapshot)
    return snapshot
  }

  /** Copies the current metrics into a caller-owned object without allocating. */
  public copySnapshot(target: PerformanceSnapshotTarget): void {
    const averageFrameTimeSeconds = this.sampleCount === 0 ? 0 : this.frameTimeTotal / this.sampleCount

    target.sampleCount = this.sampleCount
    target.windowSeconds = this.windowSeconds
    target.averageFrameTimeSeconds = averageFrameTimeSeconds
    target.minimumFrameTimeSeconds = this.sampleCount === 0 ? 0 : this.shortestFrameTime
    target.maximumFrameTimeSeconds = this.sampleCount === 0 ? 0 : this.longestFrameTime
    target.averageFps = averageFrameTimeSeconds === 0 ? 0 : 1 / averageFrameTimeSeconds
    target.minimumFps = this.sampleCount === 0 ? 0 : 1 / this.longestFrameTime
    target.lastTimestampSeconds = this.lastTimestampSeconds
  }

  private expireSamples(currentTimestampSeconds: number): void {
    while (this.sampleCount > 0) {
      const oldestIndex = this.oldestIndex()
      if (currentTimestampSeconds - this.timestamps[oldestIndex] < this.windowSeconds) {
        return
      }

      this.removeOldestSample()
    }
  }

  private removeOldestSample(): void {
    const oldestIndex = this.oldestIndex()
    const removedFrameTime = this.frameTimes[oldestIndex]

    this.frameTimeTotal -= removedFrameTime
    this.sampleCount -= 1

    if (removedFrameTime === this.longestFrameTime || removedFrameTime === this.shortestFrameTime) {
      this.recalculateExtremes()
    }
  }

  private oldestIndex(): number {
    return (this.writeIndex - this.sampleCount + this.frameTimes.length) % this.frameTimes.length
  }

  private recalculateExtremes(): void {
    this.longestFrameTime = 0
    this.shortestFrameTime = Number.POSITIVE_INFINITY

    for (let offset = 0; offset < this.sampleCount; offset += 1) {
      const frameTime = this.frameTimes[(this.oldestIndex() + offset) % this.frameTimes.length]
      this.longestFrameTime = Math.max(this.longestFrameTime, frameTime)
      this.shortestFrameTime = Math.min(this.shortestFrameTime, frameTime)
    }
  }
}
