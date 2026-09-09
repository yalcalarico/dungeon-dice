import type { GameState } from '../state/game-state'

export type ZoneDefinition = {
  id: string
  title: string
  entryPointId: string
  exitPointIds: string[]
}

export type ZoneConnection = {
  id: string
  fromZoneId: string
  fromExitId: string
  toZoneId: string
  toEntryId: string
}

export type CampaignMap = {
  zones: readonly ZoneDefinition[]
  connections: readonly ZoneConnection[]
}

export type CampaignMapValidationResult = { valid: true; map: CampaignMap } | { valid: false; errors: readonly string[] }

export const starterCampaignMap: CampaignMap = {
  zones: [
    { id: 'crypt-of-lunargenta', title: 'La Cripta de Lunargenta', entryPointId: 'start', exitPointIds: ['north-gate'] },
    { id: 'ashen-courtyard', title: 'El Patio de Ceniza', entryPointId: 'crypt-gate', exitPointIds: ['tower-path'] },
  ],
  connections: [
    { id: 'crypt-to-courtyard', fromZoneId: 'crypt-of-lunargenta', fromExitId: 'north-gate', toZoneId: 'ashen-courtyard', toEntryId: 'crypt-gate' },
    { id: 'courtyard-to-crypt', fromZoneId: 'ashen-courtyard', fromExitId: 'tower-path', toZoneId: 'crypt-of-lunargenta', toEntryId: 'start' },
  ],
}

export function validateCampaignMap(value: unknown): CampaignMapValidationResult {
  if (!isRecord(value) || !Array.isArray(value.zones) || !Array.isArray(value.connections)) return { valid: false, errors: ['campaign map must contain zones and connections arrays'] }
  const errors: string[] = []
  const zoneIds = new Set<string>()
  for (const [index, zone] of value.zones.entries()) {
    if (!isRecord(zone) || !isString(zone.id) || !isString(zone.title) || !isString(zone.entryPointId) || !Array.isArray(zone.exitPointIds) || !zone.exitPointIds.every(isString)) errors.push(`zones[${index}] is invalid`)
    else if (zoneIds.has(zone.id)) errors.push(`duplicate zone id: ${zone.id}`)
    else zoneIds.add(zone.id)
  }
  for (const [index, connection] of value.connections.entries()) {
    if (!isRecord(connection) || !isString(connection.id) || !isString(connection.fromZoneId) || !isString(connection.fromExitId) || !isString(connection.toZoneId) || !isString(connection.toEntryId)) errors.push(`connections[${index}] is invalid`)
    else {
      if (!zoneIds.has(connection.fromZoneId)) errors.push(`connections[${index}] references missing origin zone`)
      if (!zoneIds.has(connection.toZoneId)) errors.push(`connections[${index}] references missing destination zone`)
    }
  }
  return errors.length > 0 ? { valid: false, errors } : { valid: true, map: value as CampaignMap }
}

export function loadCampaignMap(value: unknown): CampaignMap {
  const result = validateCampaignMap(value)
  if (!result.valid) throw new Error(`Invalid campaign map: ${result.errors.join('; ')}`)
  return result.map
}

export type ZoneTransition = {
  connectionId: string
  fromExitId: string
}

export function transitionZone(state: GameState, transition: ZoneTransition, map: CampaignMap = starterCampaignMap): GameState {
  const connection = map.connections.find((candidate) => candidate.id === transition.connectionId && candidate.fromZoneId === state.zoneId && candidate.fromExitId === transition.fromExitId)
  if (!connection) return state
  if (!map.zones.some((zone) => zone.id === connection.toZoneId)) return state

  return {
    ...state,
    zoneId: connection.toZoneId,
    entryPointId: connection.toEntryId,
    visitedZoneIds: state.visitedZoneIds.includes(connection.toZoneId) ? state.visitedZoneIds : [...state.visitedZoneIds, connection.toZoneId],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isString(value: unknown): value is string { return typeof value === 'string' && value.length > 0 }
