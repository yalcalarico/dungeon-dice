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
