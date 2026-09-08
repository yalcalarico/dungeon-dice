export interface InteractionPosition {
  readonly x: number
  readonly z: number
}

export interface InteractionTarget {
  readonly id: string
  readonly label: string
  readonly position: InteractionPosition
  readonly radius: number
  readonly availableActionIds: readonly string[]
  readonly zoneId?: string
}

export function findNearestInteraction(
  playerPosition: InteractionPosition,
  targets: readonly InteractionTarget[],
): InteractionTarget | null {
  let nearest: InteractionTarget | null = null
  let nearestDistanceSquared = Infinity

  for (const target of targets) {
    const distanceX = target.position.x - playerPosition.x
    const distanceZ = target.position.z - playerPosition.z
    const distanceSquared = distanceX * distanceX + distanceZ * distanceZ
    const radiusSquared = target.radius * target.radius

    if (distanceSquared <= radiusSquared && distanceSquared < nearestDistanceSquared) {
      nearest = target
      nearestDistanceSquared = distanceSquared
    }
  }

  return nearest
}
