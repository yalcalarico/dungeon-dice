import type { GameState } from '../state/game-state'

export const CAMPAIGN_MAP_SCHEMA_VERSION = 1 as const

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
  schemaVersion: typeof CAMPAIGN_MAP_SCHEMA_VERSION
  zones: readonly ZoneDefinition[]
  connections: readonly ZoneConnection[]
}

export type CampaignMapValidationResult = { valid: true; map: CampaignMap } | { valid: false; errors: readonly string[] }

export const starterCampaignMap: CampaignMap = {
  schemaVersion: CAMPAIGN_MAP_SCHEMA_VERSION,
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
  if (!isRecord(value)) return { valid: false, errors: ['campaign map must be an object'] }
  const errors: string[] = []
  if (value.schemaVersion !== CAMPAIGN_MAP_SCHEMA_VERSION) errors.push(`schemaVersion must be ${CAMPAIGN_MAP_SCHEMA_VERSION}`)
  if (!Array.isArray(value.zones)) errors.push('campaign map must contain a zones array')
  if (!Array.isArray(value.connections)) errors.push('campaign map must contain a connections array')
  if (!Array.isArray(value.zones) || !Array.isArray(value.connections)) return { valid: false, errors }

  const zoneIds = new Set<string>()
  const zoneExits = new Map<string, Set<string>>()
  for (const [index, zone] of value.zones.entries()) {
    if (!isRecord(zone)) {
      errors.push(`zones[${index}] is invalid`)
      continue
    }
    if (!isString(zone.id) || !isString(zone.title) || !isString(zone.entryPointId) || !Array.isArray(zone.exitPointIds) || !zone.exitPointIds.every(isString)) {
      errors.push(`zones[${index}] is invalid`)
      continue
    }
    if (zoneIds.has(zone.id)) errors.push(`duplicate zone id: ${zone.id}`)
    else zoneIds.add(zone.id)
    if (new Set(zone.exitPointIds).size !== zone.exitPointIds.length) errors.push(`duplicate exit id in zone: ${zone.id}`)
    if (zone.exitPointIds.includes(zone.entryPointId)) errors.push(`zone entry point is also an exit: ${zone.id}`)
    zoneExits.set(zone.id, new Set(zone.exitPointIds))
  }
  const connectionIds = new Set<string>()
  const connectedExits = new Set<string>()
  for (const [index, connection] of value.connections.entries()) {
    if (!isRecord(connection) || !isString(connection.id) || !isString(connection.fromZoneId) || !isString(connection.fromExitId) || !isString(connection.toZoneId) || !isString(connection.toEntryId)) {
      errors.push(`connections[${index}] is invalid`)
      continue
    }
    if (connectionIds.has(connection.id)) errors.push(`duplicate connection id: ${connection.id}`)
    else connectionIds.add(connection.id)
    const originExits = zoneExits.get(connection.fromZoneId)
    const destination = value.zones.find((zone): zone is Record<string, unknown> => isRecord(zone) && zone.id === connection.toZoneId)
    if (!zoneIds.has(connection.fromZoneId)) errors.push(`connections[${index}] references missing origin zone`)
    else if (!originExits?.has(connection.fromExitId)) errors.push(`connections[${index}] references missing origin exit`)
    const exitKey = `${connection.fromZoneId}:${connection.fromExitId}`
    if (connectedExits.has(exitKey)) errors.push(`multiple connections from exit: ${exitKey}`)
    else connectedExits.add(exitKey)
    if (!zoneIds.has(connection.toZoneId)) errors.push(`connections[${index}] references missing destination zone`)
    else if (!destination || destination.entryPointId !== connection.toEntryId) errors.push(`connections[${index}] references invalid destination entry`)
  }
  return errors.length > 0 ? { valid: false, errors } : { valid: true, map: value as CampaignMap }
}

export function loadCampaignMap(value: unknown): CampaignMap {
  let document: unknown = value
  if (typeof value === 'string') {
    try { document = JSON.parse(value) } catch { throw new Error('Invalid campaign map JSON: malformed JSON') }
  }
  const result = validateCampaignMap(document)
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
function isString(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
