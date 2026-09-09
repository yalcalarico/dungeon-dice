export const PROGRESSION_SCHEMA_VERSION = 1 as const

export type ProgressionState = {
  experience: number
  level: number
  completedMilestones: string[]
}

export type MilestoneDefinition = {
  id: string
  experience: number
  label: string
}

export const progressionTable = {
  schemaVersion: PROGRESSION_SCHEMA_VERSION,
  levels: [0, 50, 125],
  milestones: [
    { id: 'relic-discovered', experience: 25, label: 'Reliquia descubierta' },
    { id: 'sentinel-defeated', experience: 40, label: 'Centinela derrotado' },
  ],
} as const

export function levelForExperience(experience: number): number {
  return progressionTable.levels.reduce((level, threshold, index) => experience >= threshold ? index + 1 : level, 1)
}

export function awardMilestone(state: ProgressionState, milestone: MilestoneDefinition): ProgressionState {
  if (state.completedMilestones.includes(milestone.id)) return state
  const experience = Math.max(0, state.experience) + Math.max(0, milestone.experience)
  return {
    experience,
    level: Math.max(state.level, levelForExperience(experience)),
    completedMilestones: [...state.completedMilestones, milestone.id],
  }
}

export function findMilestone(id: string): MilestoneDefinition | undefined {
  return progressionTable.milestones.find((milestone) => milestone.id === id)
}
