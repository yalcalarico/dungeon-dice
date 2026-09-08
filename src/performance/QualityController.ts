/** Quality tiers supported by the adaptive renderer. */
export type QualityLevel = 'low' | 'medium' | 'high'

/** Rendering features selected for a quality tier. */
export type QualitySettings = {
  readonly pixelRatio: number
  readonly rainDensity: number
  readonly shadows: boolean
  readonly puddles: boolean
  readonly reflections: boolean
}

/** Minimum performance data required by the controller. */
export type PerformanceSnapshotLike = {
  readonly sampleCount: number
  readonly averageFps: number
  readonly lastTimestampSeconds: number | null
}

export type QualityControllerOptions = {
  /** FPS below which performance is considered low. Defaults to 45. */
  readonly lowFpsThreshold?: number
  /** FPS above which performance is considered recovered. Defaults to 58. */
  readonly highFpsThreshold?: number
  /** Seconds of low FPS required before lowering quality. Defaults to 2. */
  readonly lowFpsDurationSeconds?: number
  /** Seconds of high FPS required before raising quality. Defaults to 5. */
  readonly highFpsDurationSeconds?: number
  /** Initial tier. Defaults to high. */
  readonly initialQuality?: QualityLevel
}

export type QualityRecommendation = {
  readonly level: QualityLevel
  readonly settings: QualitySettings
}

const QUALITY_SETTINGS: Readonly<Record<QualityLevel, QualitySettings>> = {
  low: {
    pixelRatio: 1,
    rainDensity: 0.35,
    shadows: false,
    puddles: false,
    reflections: false,
  },
  medium: {
    pixelRatio: 1.25,
    rainDensity: 0.65,
    shadows: true,
    puddles: true,
    reflections: false,
  },
  high: {
    pixelRatio: 1.5,
    rainDensity: 1,
    shadows: true,
    puddles: true,
    reflections: true,
  },
}

const QUALITY_LEVELS: readonly QualityLevel[] = ['low', 'medium', 'high']
const DEFAULT_LOW_FPS_THRESHOLD = 45
const DEFAULT_HIGH_FPS_THRESHOLD = 58
const DEFAULT_LOW_FPS_DURATION_SECONDS = 2
const DEFAULT_HIGH_FPS_DURATION_SECONDS = 5

/**
 * Selects a rendering tier from sustained FPS measurements.
 *
 * Quality is changed one tier at a time. The distinct low and high thresholds,
 * plus different hold durations, prevent oscillation around the target FPS.
 */
export class QualityController {
  private readonly lowFpsThreshold: number
  private readonly highFpsThreshold: number
  private readonly lowFpsDurationSeconds: number
  private readonly highFpsDurationSeconds: number
  private quality: QualityLevel
  private lowFpsSeconds = 0
  private highFpsSeconds = 0
  private lastTimestampSeconds: number | null = null

  public constructor(options: QualityControllerOptions = {}) {
    this.lowFpsThreshold = options.lowFpsThreshold ?? DEFAULT_LOW_FPS_THRESHOLD
    this.highFpsThreshold = options.highFpsThreshold ?? DEFAULT_HIGH_FPS_THRESHOLD
    this.lowFpsDurationSeconds = options.lowFpsDurationSeconds ?? DEFAULT_LOW_FPS_DURATION_SECONDS
    this.highFpsDurationSeconds = options.highFpsDurationSeconds ?? DEFAULT_HIGH_FPS_DURATION_SECONDS
    this.quality = options.initialQuality ?? 'high'

    if (!Number.isFinite(this.lowFpsThreshold) || this.lowFpsThreshold <= 0) {
      throw new RangeError('lowFpsThreshold must be finite and greater than zero')
    }
    if (!Number.isFinite(this.highFpsThreshold) || this.highFpsThreshold <= this.lowFpsThreshold) {
      throw new RangeError('highFpsThreshold must be finite and greater than lowFpsThreshold')
    }
    if (!Number.isFinite(this.lowFpsDurationSeconds) || this.lowFpsDurationSeconds <= 0) {
      throw new RangeError('lowFpsDurationSeconds must be finite and greater than zero')
    }
    if (!Number.isFinite(this.highFpsDurationSeconds) || this.highFpsDurationSeconds <= 0) {
      throw new RangeError('highFpsDurationSeconds must be finite and greater than zero')
    }
  }

  /** Current quality tier. */
  public getQuality(): QualityLevel {
    return this.quality
  }

  /** Returns the current tier and its renderer-agnostic settings. */
  public getRecommendation(): QualityRecommendation {
    return this.createRecommendation()
  }

  /**
   * Consumes a performance snapshot and returns the tier to apply.
   * Snapshots should be supplied in timestamp order; repeated timestamps do not
   * add time to either hysteresis timer.
   */
  public update(snapshot: PerformanceSnapshotLike): QualityRecommendation {
    if (!Number.isInteger(snapshot.sampleCount) || snapshot.sampleCount < 0) {
      throw new RangeError('sampleCount must be a non-negative integer')
    }
    if (snapshot.lastTimestampSeconds !== null && !Number.isFinite(snapshot.lastTimestampSeconds)) {
      throw new RangeError('lastTimestampSeconds must be finite or null')
    }
    if (this.lastTimestampSeconds !== null && snapshot.lastTimestampSeconds !== null && snapshot.lastTimestampSeconds < this.lastTimestampSeconds) {
      throw new RangeError('lastTimestampSeconds must not move backwards')
    }

    const elapsedSeconds = this.getElapsedSeconds(snapshot.lastTimestampSeconds)
    this.lastTimestampSeconds = snapshot.lastTimestampSeconds

    if (snapshot.sampleCount > 0 && Number.isFinite(snapshot.averageFps) && elapsedSeconds > 0) {
      if (snapshot.averageFps < this.lowFpsThreshold) {
        this.lowFpsSeconds += elapsedSeconds
        this.highFpsSeconds = 0
        if (this.lowFpsSeconds >= this.lowFpsDurationSeconds) {
          this.stepQuality(-1)
          this.lowFpsSeconds = 0
        }
      } else if (snapshot.averageFps > this.highFpsThreshold) {
        this.highFpsSeconds += elapsedSeconds
        this.lowFpsSeconds = 0
        if (this.highFpsSeconds >= this.highFpsDurationSeconds) {
          this.stepQuality(1)
          this.highFpsSeconds = 0
        }
      } else {
        this.lowFpsSeconds = 0
        this.highFpsSeconds = 0
      }
    }

    return this.createRecommendation()
  }

  /** Clears hysteresis history while retaining the current quality tier. */
  public reset(): void {
    this.lowFpsSeconds = 0
    this.highFpsSeconds = 0
    this.lastTimestampSeconds = null
  }

  private getElapsedSeconds(timestampSeconds: number | null): number {
    if (timestampSeconds === null || this.lastTimestampSeconds === null) {
      return 0
    }

    return timestampSeconds - this.lastTimestampSeconds
  }

  private stepQuality(direction: -1 | 1): void {
    const currentIndex = QUALITY_LEVELS.indexOf(this.quality)
    const nextIndex = Math.max(0, Math.min(QUALITY_LEVELS.length - 1, currentIndex + direction))
    this.quality = QUALITY_LEVELS[nextIndex]
  }

  private createRecommendation(): QualityRecommendation {
    return {
      level: this.quality,
      settings: QUALITY_SETTINGS[this.quality],
    }
  }
}
