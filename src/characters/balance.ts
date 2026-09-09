import { archetypes, attributeModifier, type Archetype, type CharacterAttributes } from './character'

const OFFENSIVE_ATTRIBUTES = ['strength', 'dexterity', 'intelligence'] as const
const DEFENSIVE_ATTRIBUTES = ['constitution', 'dexterity', 'wisdom'] as const

export const BALANCE_LIMITS = {
  minimumInitialHp: 12,
  maximumInitialHp: 26,
  minimumInitialMp: 4,
  maximumInitialMp: 14,
  minimumSurvivability: 16,
  maximumSurvivabilitySpread: 12,
} as const

export type ArchetypeBalance = {
  archetypeId: string
  initialHp: number
  initialMp: number
  offensiveModifier: number
  defensiveModifier: number
  minimumSurvivability: number
}

export type BalanceIssue = {
  code: string
  message: string
}

export function compareArchetype(archetype: Archetype): ArchetypeBalance {
  const offensiveModifier = highestModifier(archetype.attributes, OFFENSIVE_ATTRIBUTES)
  const defensiveModifier = highestModifier(archetype.attributes, DEFENSIVE_ATTRIBUTES)

  return {
    archetypeId: archetype.id,
    initialHp: archetype.resources.maxHp,
    initialMp: archetype.resources.maxMp,
    offensiveModifier,
    defensiveModifier,
    minimumSurvivability: archetype.resources.maxHp + Math.max(0, defensiveModifier) * 2,
  }
}

export function compareArchetypes(input: readonly Archetype[] = archetypes): readonly ArchetypeBalance[] {
  return input.map(compareArchetype)
}

export function validateArchetypeBalance(input: readonly Archetype[] = archetypes): readonly BalanceIssue[] {
  const comparisons = compareArchetypes(input)
  const issues: BalanceIssue[] = []

  for (const comparison of comparisons) {
    if (comparison.initialHp < BALANCE_LIMITS.minimumInitialHp || comparison.initialHp > BALANCE_LIMITS.maximumInitialHp) {
      issues.push({ code: 'initial-hp-out-of-range', message: `${comparison.archetypeId} tiene HP inicial fuera de rango` })
    }
    if (comparison.initialMp < BALANCE_LIMITS.minimumInitialMp || comparison.initialMp > BALANCE_LIMITS.maximumInitialMp) {
      issues.push({ code: 'initial-mp-out-of-range', message: `${comparison.archetypeId} tiene MP inicial fuera de rango` })
    }
    if (comparison.minimumSurvivability < BALANCE_LIMITS.minimumSurvivability) {
      issues.push({ code: 'minimum-survivability-too-low', message: `${comparison.archetypeId} no alcanza la supervivencia mínima` })
    }
  }

  const survivability = comparisons.map((comparison) => comparison.minimumSurvivability)
  if (survivability.length > 1 && Math.max(...survivability) - Math.min(...survivability) > BALANCE_LIMITS.maximumSurvivabilitySpread) {
    issues.push({ code: 'survivability-spread-too-wide', message: 'La distancia de supervivencia entre arquetipos es demasiado amplia' })
  }

  for (const candidate of comparisons) {
    const dominates = comparisons.some((other) => other !== candidate && dominatesBalance(candidate, other))
    if (dominates) issues.push({ code: 'dominant-archetype', message: `${candidate.archetypeId} domina todas las métricas comparadas` })
  }

  return issues
}

function highestModifier(attributes: CharacterAttributes, keys: readonly (keyof CharacterAttributes)[]): number {
  return Math.max(...keys.map((key) => attributeModifier(attributes[key])))
}

function dominatesBalance(candidate: ArchetypeBalance, other: ArchetypeBalance): boolean {
  const metrics = ['initialHp', 'initialMp', 'offensiveModifier', 'defensiveModifier', 'minimumSurvivability'] as const
  return metrics.every((metric) => candidate[metric] >= other[metric]) && metrics.some((metric) => candidate[metric] > other[metric])
}
