import * as THREE from 'three'
import { findNearestInteraction, type InteractionTarget } from './systems/interaction'
import { PerformanceTracker, type PerformanceSnapshot } from '../performance/PerformanceTracker'
import { QualityController, type QualityLevel } from '../performance/QualityController'
import { campaignLevels, getLevelByZoneId, type LevelConfig, type LevelObject } from '../content'

type EnvironmentMessage = (message: string) => void
type InteractionTargetChange = (target: InteractionTarget | null) => void
type EntitySelectionChange = (entityId: string | null) => void
type Collider = { x: number; z: number; halfX: number; halfZ: number; zoneId: string }
type CombatNotification = { sprite: THREE.Sprite; material: THREE.SpriteMaterial; texture: THREE.CanvasTexture; elapsed: number; target: 'player' | 'enemy' }
export type ScenePerformanceSnapshot = PerformanceSnapshot & {
  readonly drawCalls: number
  readonly triangles: number
  readonly geometries: number
  readonly textures: number
}

export class WebGLUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('No se pudo iniciar WebGL. Comprueba que el navegador permite WebGL y que la aceleración gráfica está activa.', { cause })
    this.name = 'WebGLUnavailableError'
  }
}

export class GameScene {
  private readonly host: HTMLElement
  private readonly onMessage: EnvironmentMessage
  private readonly onInteractionTargetChange?: InteractionTargetChange
  private readonly onEntitySelectionChange?: EntitySelectionChange
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 100)
  private readonly renderer: THREE.WebGLRenderer
  private readonly world = new THREE.Group()
  private readonly wetPatches = new THREE.Group()
  private readonly enemy = new THREE.Group()
  private readonly combatNotifications: CombatNotification[] = []
  private enemyHealthBar?: THREE.Mesh
  private readonly player = new THREE.Group()
  private readonly clock = new THREE.Clock()
  private readonly keys = new Set<string>()
  private readonly movementDirection = new THREE.Vector3()
  private readonly movementRight = new THREE.Vector3()
  private readonly performanceTracker = new PerformanceTracker({ windowSeconds: 2 })
  private readonly qualityController = new QualityController()
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly selectableObjects: THREE.Object3D[] = []
  private readonly cameraTarget = new THREE.Vector3()
  private readonly cameraPosition = new THREE.Vector3()
  private readonly torches: Array<{ light: THREE.PointLight; flame: THREE.Mesh; phase: number }> = []
  private readonly exitDoor = new THREE.Group()
  private readonly interactionTargets: InteractionTarget[] = []
  private readonly colliders: Collider[] = []
  private readonly ownedGeometries: THREE.BufferGeometry[] = []
  private readonly ownedMaterials: THREE.Material[] = []
  private readonly rainPositions = new Float32Array(Math.max(...campaignLevels.map((level) => Math.floor(level.scene.environment.rain.density))) * 3)
  private readonly rainVelocities = new Float32Array(this.rainPositions.length / 3)
  private activeRainCount = this.rainVelocities.length
  private rainGeometry?: THREE.BufferGeometry
  private rainMaterial?: THREE.PointsMaterial
  private rain?: THREE.Points
  private animation = 0
  private destroyed = false
  private yaw = Math.PI / 4
  private pitch = .86
  private distance = 17
  private dragging = false
  private pointerDown = { x: 0, y: 0 }
  private lastPointer = { x: 0, y: 0 }
  private elapsed = 0
  private interactionTargetId: string | null = null
  private movementLocked = false
  private qualityCheckElapsed = 0
  private qualityLevel: QualityLevel = 'high'
  private activeZoneId = campaignLevels[0].id
  private activeLevel = campaignLevels[0]
  private readonly zoneGroups = new Map<string, THREE.Group>()
  private activeRainEnvironment = this.activeLevel.scene.environment.rain
  private floorMaterial?: THREE.MeshPhysicalMaterial
  private combatFeedbackTime = 0
  private combatFeedbackTarget: 'player' | 'enemy' | null = null
  private enemyDefeatTime = 0
  private readonly enemyOrigin = new THREE.Vector3()

  constructor(host: HTMLElement, onMessage: EnvironmentMessage, onInteractionTargetChange?: InteractionTargetChange, onEntitySelectionChange?: EntitySelectionChange) {
    this.host = host
    this.onMessage = onMessage
    this.onInteractionTargetChange = onInteractionTargetChange
    this.onEntitySelectionChange = onEntitySelectionChange
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch (error) {
      this.onMessage('La escena 3D no está disponible: WebGL no pudo iniciarse. El resto de la interfaz sigue accesible.')
      throw new WebGLUnavailableError(error)
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.renderer.setClearColor(0x111719)
    this.host.appendChild(this.renderer.domElement)
    this.buildWorld()
    this.bindInput()
    this.onMessage('Una llama distante tiembla al norte.')
  }

  start() {
    if (this.destroyed || this.animation) return
    this.resize()
    this.animation = requestAnimationFrame(this.frame)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.animation)
    this.animation = 0
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.host.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.host.removeEventListener('wheel', this.onWheel)
    this.keys.clear()
    this.dragging = false
    this.combatNotifications.forEach(({ texture }) => texture.dispose())
    this.combatNotifications.length = 0
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry) geometries.add(mesh.geometry)
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => materials.add(material))
      else if (mesh.material) materials.add(mesh.material)
    })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => material.dispose())
    this.renderer.renderLists.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  setMovementLocked(locked: boolean) {
    this.movementLocked = locked
    if (locked) this.keys.clear()
  }

  reset() {
    if (this.destroyed) return
    this.keys.clear()
    this.dragging = false
    this.lastPointer.x = 0
    this.lastPointer.y = 0
    this.yaw = Math.PI / 4
    this.pitch = .86
    this.distance = 17
    this.elapsed = 0
    this.movementLocked = false
    this.player.position.set(0, 0, 1)
    this.player.rotation.y = 0
    this.interactionTargetId = null
    this.onInteractionTargetChange?.(null)
    this.resize()
    this.setCameraToPlayer()
    this.setZone(campaignLevels[0].id)
    this.enemy.scale.setScalar(1)
    this.player.rotation.z = 0
  }

  setZone(zoneId: string) {
    const level = getLevelByZoneId(zoneId)
    if (!level) return
    this.activeZoneId = level.id
    this.activeLevel = level
    this.activeRainEnvironment = level.scene.environment.rain
    this.resetRainForLevel()
    this.keys.clear()
    this.interactionTargetId = null
    this.onInteractionTargetChange?.(null)
    this.zoneGroups.forEach((group, id) => { group.visible = id === level.id })
    this.enemy.visible = this.isEnemyActive()
    if (this.rain) this.rain.visible = level.scene.environment.rain.enabled
    this.activeRainCount = level.scene.environment.rain.enabled ? Math.floor(this.rainVelocities.length * Math.min(1, level.scene.environment.rain.density / Math.max(1, this.rainVelocities.length))) : 0
    if (this.rainGeometry) this.rainGeometry.setDrawRange(0, this.activeRainCount)
    if (this.floorMaterial) {
      const wetness = THREE.MathUtils.clamp(level.scene.environment.floor.wetness, 0, 1)
      this.floorMaterial.roughness = THREE.MathUtils.lerp(.5, .075, wetness)
      this.floorMaterial.metalness = THREE.MathUtils.lerp(.2, .425, wetness)
    }
    this.wetPatches.visible = level.scene.environment.floor.puddles
    this.scene.fog = new THREE.Fog(0x111719, 17, 38)
    this.renderer.setClearColor(0x111719)
    this.player.position.set(0, 0, 1)
    this.setCameraToPlayer()
  }

  setEncounter(status: 'idle' | 'active' | 'victory' | 'defeat', enemyHp: number, enemyMaxHp: number) {
    this.enemy.visible = this.isEnemyActive()
    this.enemyDefeatTime = status === 'victory' ? 1.2 : 0
    if (status !== 'victory') this.enemy.scale.setScalar(1)
    if (this.enemyHealthBar) this.enemyHealthBar.scale.x = enemyMaxHp > 0 ? THREE.MathUtils.clamp(enemyHp / enemyMaxHp, 0, 1) : 0
    this.enemy.position.y = status === 'defeat' ? .08 : 0
    this.enemy.rotation.z = status === 'defeat' ? -.45 : 0
  }

  triggerCombatFeedback(target: 'player' | 'enemy', _hit: boolean) {
    this.combatFeedbackTarget = target
    this.combatFeedbackTime = .55
  }

  showCombatNotification(target: 'player' | 'enemy', amount: number, kind: 'buff' | 'debuff') {
    if (amount <= 0) return
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 120
    const context = canvas.getContext('2d')
    if (!context) return
    const sign = kind === 'buff' ? '+' : '-'
    context.font = '700 64px Georgia, serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.lineWidth = 9
    context.strokeStyle = 'rgba(8, 12, 12, .85)'
    context.fillStyle = kind === 'buff' ? '#8ed3a8' : '#e68e80'
    context.strokeText(`${sign}${amount}`, 160, 60)
    context.fillText(`${sign}${amount}`, 160, 60)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(1.35, .5, 1)
    this.world.add(sprite)
    this.combatNotifications.push({ sprite, material, texture, elapsed: 0, target })
  }

  setWorldState(flags: { torchLit?: boolean; exitOpened?: boolean }) {
    const torchLit = flags.torchLit === true
    this.torches.forEach(({ light, flame }) => {
      light.intensity = torchLit ? 11 : 8
      const material = flame.material as THREE.MeshBasicMaterial
      material.color.set(torchLit ? 0xffd27a : 0xffb45f)
    })
    this.exitDoor.visible = flags.exitOpened !== true
  }

  getPerformanceSnapshot(): ScenePerformanceSnapshot {
    const snapshot = this.performanceTracker.getSnapshot()
    return {
      ...snapshot,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    }
  }

  private buildWorld() {
    this.scene.fog = new THREE.Fog(0x111719, 17, 38)
    this.scene.add(this.world)
    this.world.add(this.wetPatches)
    this.scene.add(new THREE.HemisphereLight(0x9eafae, 0x101517, 1.7))
    const moon = new THREE.DirectionalLight(0xa9c1c7, 2.2)
    moon.position.set(-10, 18, 7); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -16; moon.shadow.camera.right = 16; moon.shadow.camera.top = 16; moon.shadow.camera.bottom = -16; this.scene.add(moon)

    const floorGeometry = new THREE.PlaneGeometry(42, 34)
    const wetness = THREE.MathUtils.clamp(this.activeLevel.scene.environment.floor.wetness, 0, 1)
    const floorMaterial = new THREE.MeshPhysicalMaterial({ color: 0x344244, roughness: THREE.MathUtils.lerp(.5, .075, wetness), metalness: THREE.MathUtils.lerp(.2, .425, wetness), clearcoat: 1, clearcoatRoughness: .08, specularIntensity: .72 })
    this.floorMaterial = floorMaterial
    this.ownedGeometries.push(floorGeometry)
    this.ownedMaterials.push(floorMaterial)
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.world.add(floor)
    if (campaignLevels.some((level) => level.scene.environment.floor.puddles)) this.makeWetPatches()
    const grid = new THREE.GridHelper(30, 30, 0x5a6664, 0x3b4948); grid.position.y = .012; grid.material.transparent = true; grid.material.opacity = .12; this.world.add(grid)
    campaignLevels.forEach((level) => this.makeLevel(level))
    this.makeRain(); this.makePlayer()
    this.updateCamera(0)
  }

  private makeLevel(level: LevelConfig) {
    const group = new THREE.Group()
    group.visible = level.id === this.activeZoneId
    this.zoneGroups.set(level.id, group)
    this.world.add(group)
    this.makeBoundary(level, group)
    level.objects.forEach((object) => this.makeObject(level, object, group))
  }

  private makeBoundary(level: LevelConfig, group: THREE.Group) {
    const stone = new THREE.MeshStandardMaterial({ color: 0x3a4544, roughness: .86 })
    this.ownedMaterials.push(stone)
    const { minX, maxX, minZ, maxZ } = level.scene.bounds
    for (let x = minX; x <= maxX; x += 2) {
      this.block(x, .8, minZ, 1.8, 1.6, 1.2, stone, group, level.id)
      this.block(x, .8, maxZ, 1.8, 1.6, 1.2, stone, group, level.id)
    }
    for (let z = minZ + 2; z < maxZ; z += 2) {
      this.block(minX, .8, z, 1.2, 1.6, 1.8, stone, group, level.id)
      this.block(maxX, .8, z, 1.2, 1.6, 1.8, stone, group, level.id)
    }
  }

  private makeObject(level: LevelConfig, object: LevelObject, group: THREE.Group) {
    switch (object.type) {
      case 'altar': this.makeAltar(level, object, group); break
      case 'exit-door': this.makeExitDoor(level, object, group); break
      case 'torch': this.makeTorch(level, object, group); break
      case 'npc': this.makeNpc(level, object, group); break
      case 'relic': this.makeRelic(level, object, group); break
      case 'enemy': this.makeEnemy(level, object, group); break
    }
  }

  private makeNpc(level: LevelConfig, object: LevelObject, group: THREE.Group) {
    const npc = level.npcs?.find((candidate) => candidate.objectId === object.id)
    const robeMaterial = new THREE.MeshStandardMaterial({ color: 0x435c58, roughness: .86 })
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xb98970, roughness: .72 })
    const npcBody = new THREE.Mesh(new THREE.ConeGeometry(.34, 1.05, 6), robeMaterial)
    const npcHead = new THREE.Mesh(new THREE.SphereGeometry(.23, 8, 6), skinMaterial)
    npcBody.position.set(object.position.x, .55, object.position.z)
    npcHead.position.set(object.position.x, 1.28, object.position.z)
    npcBody.castShadow = true
    npcHead.castShadow = true
    group.add(npcBody, npcHead)
    this.addInteraction(level, object, npc?.name ?? object.id, object.position)
  }

  private makeRelic(level: LevelConfig, object: LevelObject, group: THREE.Group) {
    const stone = new THREE.MeshStandardMaterial({ color: 0x6a4d48, roughness: .9 })
    const ember = new THREE.MeshStandardMaterial({ color: 0xa45f47, emissive: 0x4a1d16, emissiveIntensity: .8, roughness: .72 })
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.42, .52, .5, 8), stone)
    const relic = new THREE.Mesh(new THREE.OctahedronGeometry(.3, 0), ember)
    pedestal.position.set(object.position.x, .25, object.position.z)
    relic.position.set(object.position.x, .9, object.position.z)
    relic.castShadow = true
    group.add(pedestal, relic)
    const metadata = level.relics?.find((candidate) => candidate.objectId === object.id)
    this.addInteraction(level, object, metadata?.name ?? object.id, object.position)
  }

  private makeEnemy(level: LevelConfig, object: LevelObject, group: THREE.Group) {
    const metadata = level.enemies?.find((candidate) => candidate.objectId === object.id)
    if (!metadata) return
    const bodyGeometry = new THREE.IcosahedronGeometry(.62, 1)
    const cloakGeometry = new THREE.ConeGeometry(.78, 1.5, 6)
    const hornGeometry = new THREE.ConeGeometry(.12, .5, 5)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x342b32, roughness: .76, metalness: .18 })
    const cloakMaterial = new THREE.MeshStandardMaterial({ color: 0x5b3030, emissive: 0x210d10, emissiveIntensity: .42, roughness: .84 })
    const hornMaterial = new THREE.MeshStandardMaterial({ color: 0xc07a5d, emissive: 0x351510, emissiveIntensity: .5, roughness: .62 })
    const healthBackMaterial = new THREE.MeshBasicMaterial({ color: 0x1c2523 })
    const healthMaterial = new THREE.MeshBasicMaterial({ color: 0xc26052 })
    this.ownedGeometries.push(bodyGeometry, cloakGeometry, hornGeometry, new THREE.PlaneGeometry(1.5, .09), new THREE.PlaneGeometry(1.5, .09))
    this.ownedMaterials.push(bodyMaterial, cloakMaterial, hornMaterial, healthBackMaterial, healthMaterial)

    const cloak = new THREE.Mesh(cloakGeometry, cloakMaterial)
    cloak.position.y = .75
    cloak.castShadow = true
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.55
    body.castShadow = true
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial)
    leftHorn.position.set(-.25, 2.05, 0)
    leftHorn.rotation.z = -.35
    const rightHorn = leftHorn.clone()
    rightHorn.position.x = .25
    rightHorn.rotation.z = .35
    const healthBack = new THREE.Mesh(this.ownedGeometries.at(-2) as THREE.PlaneGeometry, healthBackMaterial)
    healthBack.position.set(0, 2.55, 0)
    const health = new THREE.Mesh(this.ownedGeometries.at(-1) as THREE.PlaneGeometry, healthMaterial)
    health.position.set(-.75, 2.55, .01)
    this.enemyHealthBar = health
    this.enemy.add(cloak, body, leftHorn, rightHorn, healthBack, health)
    this.enemy.position.set(object.position.x, object.position.y, object.position.z)
    this.enemyOrigin.copy(this.enemy.position)
    this.enemy.visible = this.isEnemyActive()
    this.enemy.userData.selectableId = metadata.id
    group.add(this.enemy)
    this.selectableObjects.push(this.enemy)
    this.addInteraction(level, object, metadata.name, object.position)
  }

  private block(x: number, y: number, z: number, sx: number, sy: number, sz: number, material: THREE.Material, group: THREE.Group, zoneId: string) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material)
    mesh.position.set(x, y, z)
    mesh.rotation.y = ((x + z) % 3) * .04
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    this.colliders.push({ x, z, halfX: sx / 2, halfZ: sz / 2, zoneId })
  }

  private makeAltar(level: LevelConfig, altar: LevelObject, group: THREE.Group) {
    const stone = new THREE.MeshStandardMaterial({ color: 0x555b53, roughness: .7 }); const gold = new THREE.MeshStandardMaterial({ color: 0x9f8359, emissive: 0x392714, emissiveIntensity: .5, roughness: .3 })
    this.block(altar.position.x, .6, altar.position.z, 2.6, 1.2, 1.6, stone, group, level.id); this.block(altar.position.x, 1.35, altar.position.z, 1.45, .3, .9, gold, group, level.id)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, .04, 6, 32), new THREE.MeshBasicMaterial({ color: 0xc6a776, transparent: true, opacity: .55 })); ring.rotation.x = -Math.PI / 2; ring.position.set(altar.position.x, 1.55, altar.position.z); group.add(ring)
    this.addInteraction(level, altar, altar.id, altar.position)
  }

  private makeExitDoor(level: LevelConfig, exit: LevelObject, group: THREE.Group) {
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x5f4939, roughness: .72 })
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x29383a, roughness: .5, metalness: .35 })
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xc19a5c, emissive: 0x3a2813, emissiveIntensity: .45, roughness: .3 })
    this.ownedMaterials.push(frameMaterial, doorMaterial, handleMaterial)

    const doorGeometry = new THREE.BoxGeometry(1.35, 2.65, .18)
    const postGeometry = new THREE.BoxGeometry(.2, 3, .34)
    const lintelGeometry = new THREE.BoxGeometry(1.75, .2, .34)
    const handleGeometry = new THREE.SphereGeometry(.1, 8, 6)
    this.ownedGeometries.push(doorGeometry, postGeometry, lintelGeometry, handleGeometry)

    const door = new THREE.Mesh(doorGeometry, doorMaterial)
    door.position.set(exit.position.x, 1.35, exit.position.z)
    door.castShadow = true
    const leftPost = new THREE.Mesh(postGeometry, frameMaterial)
    leftPost.position.set(exit.position.x - .78, 1.5, exit.position.z - .02)
    leftPost.castShadow = true
    const rightPost = leftPost.clone()
    rightPost.position.x = exit.position.x + .78
    const lintel = new THREE.Mesh(lintelGeometry, frameMaterial)
    lintel.position.set(exit.position.x, 2.9, exit.position.z - .02)
    lintel.castShadow = true
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(exit.position.x + .42, 1.3, exit.position.z + .14)
    this.exitDoor.add(door, leftPost, rightPost, lintel, handle)
    group.add(this.exitDoor)

    this.colliders.push({ x: exit.position.x, z: exit.position.z, halfX: .68, halfZ: .12, zoneId: level.id })
    this.addInteraction(level, exit, exit.id, { x: exit.position.x, z: exit.position.z + .21 })
  }

  private makeRain() {
    this.rainGeometry = new THREE.BufferGeometry()
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3))
    this.rainMaterial = new THREE.PointsMaterial({ color: 0xb9e4e4, size: .13, transparent: true, opacity: .68, depthWrite: false, sizeAttenuation: true })
    this.ownedGeometries.push(this.rainGeometry)
    this.ownedMaterials.push(this.rainMaterial)
    this.rain = new THREE.Points(this.rainGeometry, this.rainMaterial)
    this.rain.frustumCulled = false
    this.resetRainForLevel()
    this.world.add(this.rain)
  }

  private resetRainForLevel() {
    const { bounds } = this.activeLevel.scene
    const width = bounds.maxX - bounds.minX
    const depth = bounds.maxZ - bounds.minZ
    for (let index = 0; index < this.rainVelocities.length; index++) {
      const offset = index * 3
      this.rainPositions[offset] = bounds.minX + ((index * 17) % 100) / 100 * width
      this.rainPositions[offset + 1] = ((index * 29) % 70) / 10 + .4
      this.rainPositions[offset + 2] = bounds.minZ + ((index * 23) % 100) / 100 * depth
      this.rainVelocities[index] = this.activeRainEnvironment.speed + (index % 5) * .45
    }
  }

  private makeWetPatches() {
    const patchGeometry = new THREE.CircleGeometry(1, 20)
    const patchMaterial = new THREE.MeshPhysicalMaterial({ color: 0x253a3c, roughness: .06, metalness: .22, clearcoat: 1, clearcoatRoughness: .04, specularIntensity: .9, transparent: true, opacity: .62, depthWrite: false })
    this.ownedGeometries.push(patchGeometry)
    this.ownedMaterials.push(patchMaterial)
    const patches = [
      [-8.4, -3.9, 1.5, .7, -.2], [-4.1, 2.7, 1.15, .55, .35], [1.8, 4.5, 1.7, .62, -.45],
      [5.1, 1.8, 1.25, .48, .15], [8.9, -4.8, 1.45, .58, .5], [-1.5, -1.2, .9, .42, -.3],
    ]
    for (const [x, z, scaleX, scaleZ, rotation] of patches) {
      const patch = new THREE.Mesh(patchGeometry, patchMaterial)
      patch.position.set(x, .026, z)
      patch.rotation.x = -Math.PI / 2
      patch.rotation.z = rotation
      patch.scale.set(scaleX, scaleZ, 1)
      this.wetPatches.add(patch)
    }
  }

  private makeTorch(level: LevelConfig, torch: LevelObject, group: THREE.Group) { const { x, z } = torch.position; const light = new THREE.PointLight(0xe79c55, 8, 8, 2); light.position.set(x, 2.1, z); light.castShadow = true; light.shadow.mapSize.set(256, 256); group.add(light); const flame = new THREE.Mesh(new THREE.OctahedronGeometry(.14, 0), new THREE.MeshBasicMaterial({ color: 0xffb45f })); flame.position.copy(light.position); group.add(flame); this.torches.push({ light, flame, phase: Math.random() * 8 }); this.addInteraction(level, torch, torch.id) }

  private addInteraction(level: LevelConfig, object: LevelObject, label: string, position: { x: number; z: number } = object.position, interactionId = object.id) {
    if (!object.interaction) return
    this.interactionTargets.push({ id: interactionId, label, position: { x: position.x, z: position.z }, radius: object.interaction.radius, availableActionIds: object.interaction.actions, zoneId: level.id })
  }

  private isEnemyActive() { return (this.activeLevel.enemies?.length ?? 0) > 0 && this.enemyDefeatTime <= 0 }

  private makePlayer() { const cloak = new THREE.MeshStandardMaterial({ color: 0x725443, roughness: .78 }); const skin = new THREE.MeshStandardMaterial({ color: 0xb8896e, roughness: .7 }); const body = new THREE.Mesh(new THREE.ConeGeometry(.38, .85, 6), cloak); body.position.y = .65; body.castShadow = true; const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 6), skin); head.position.y = 1.22; head.castShadow = true; const halo = new THREE.Mesh(new THREE.RingGeometry(.62, .67, 32), new THREE.MeshBasicMaterial({ color: 0xb69a70, transparent: true, opacity: .45, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = .03; this.player.add(body, head, halo); this.player.position.set(0, 0, 1); this.world.add(this.player) }

  private bindInput() { window.addEventListener('resize', this.resize); window.addEventListener('keydown', this.onKeyDown); window.addEventListener('keyup', this.onKeyUp); this.host.addEventListener('pointerdown', this.onPointerDown); window.addEventListener('pointerup', this.onPointerUp); window.addEventListener('pointermove', this.onPointerMove); this.host.addEventListener('wheel', this.onWheel, { passive: false }) }
  private onKeyDown = (event: KeyboardEvent) => { const target = event.target; if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return; this.keys.add(event.key.toLowerCase()) }
  private onKeyUp = (event: KeyboardEvent) => { this.keys.delete(event.key.toLowerCase()) }
  private onPointerDown = (event: PointerEvent) => { this.dragging = true; this.pointerDown.x = event.clientX; this.pointerDown.y = event.clientY; this.lastPointer.x = event.clientX; this.lastPointer.y = event.clientY }
  private onPointerUp = (event: PointerEvent) => { const moved = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y) > 6; this.dragging = false; if (moved) return; const rect = this.renderer.domElement.getBoundingClientRect(); this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; this.raycaster.setFromCamera(this.pointer, this.camera); const hit = this.raycaster.intersectObjects(this.selectableObjects, true)[0]; let object: THREE.Object3D | undefined = hit?.object; while (object && !object.userData.selectableId) object = object.parent ?? undefined; this.onEntitySelectionChange?.(object?.userData.selectableId ?? null) }
  private onPointerMove = (event: PointerEvent) => { if (!this.dragging) return; this.yaw -= (event.clientX - this.lastPointer.x) * .008; this.pitch = THREE.MathUtils.clamp(this.pitch + (event.clientY - this.lastPointer.y) * .004, .58, 1.18); this.lastPointer.x = event.clientX; this.lastPointer.y = event.clientY }
  private onWheel = (event: WheelEvent) => { event.preventDefault(); this.distance = THREE.MathUtils.clamp(this.distance + event.deltaY * .012, 10, 24); this.resize() }
  private resize = () => { const width = this.host.clientWidth; const height = this.host.clientHeight; const aspect = width / height; const view = this.distance * .58; this.camera.left = -view * aspect; this.camera.right = view * aspect; this.camera.top = view; this.camera.bottom = -view; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false) }

  private updatePlayer(delta: number) { if (this.movementLocked) return; const speed = 3.1; const forward = (this.keys.has('s') ? 1 : 0) - (this.keys.has('w') ? 1 : 0); const side = (this.keys.has('d') ? 1 : 0) - (this.keys.has('a') ? 1 : 0); if (!forward && !side) return; const direction = this.movementDirection.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); const right = this.movementRight.set(direction.z, 0, -direction.x); const movementX = (direction.x * forward + right.x * side) * speed * delta; const movementZ = (direction.z * forward + right.z * side) * speed * delta; const { bounds } = this.activeLevel.scene; const nextX = THREE.MathUtils.clamp(this.player.position.x + movementX, bounds.minX, bounds.maxX); const nextZ = THREE.MathUtils.clamp(this.player.position.z + movementZ, bounds.minZ, bounds.maxZ); if (this.canOccupy(nextX, this.player.position.z)) this.player.position.x = nextX; if (this.canOccupy(this.player.position.x, nextZ)) this.player.position.z = nextZ; if (movementX || movementZ) this.player.rotation.y = Math.atan2(direction.x, direction.z); }
  private canOccupy(x: number, z: number) { const radius = .36; return this.colliders.filter((collider) => collider.zoneId === this.activeZoneId).every((collider) => Math.abs(x - collider.x) >= collider.halfX + radius || Math.abs(z - collider.z) >= collider.halfZ + radius) }
  private updateInteractionTarget() { const nearest = findNearestInteraction({ x: this.player.position.x, z: this.player.position.z }, this.interactionTargets.filter((target) => !target.zoneId || target.zoneId === this.activeZoneId)); const nextId = nearest?.id ?? null; if (nextId === this.interactionTargetId) return; this.interactionTargetId = nextId; this.onInteractionTargetChange?.(nearest) }
  private setCameraToPlayer() { const target = this.cameraTarget.copy(this.player.position); this.camera.position.set(Math.sin(this.yaw) * this.distance, this.distance * this.pitch, Math.cos(this.yaw) * this.distance).add(target); this.camera.lookAt(target.x, .2, target.z) }
  private updateCamera(delta: number) { const target = this.cameraTarget.copy(this.player.position); const position = this.cameraPosition.set(Math.sin(this.yaw) * this.distance, this.distance * this.pitch, Math.cos(this.yaw) * this.distance).add(target); this.camera.position.lerp(position, 1 - Math.pow(.0008, delta)); this.camera.lookAt(target.x, .2, target.z) }
  private updateRain(delta: number) { if (!this.rain) return; for (let index = 0; index < this.activeRainCount; index++) { const offset = index * 3; this.rainPositions[offset + 1] -= this.rainVelocities[index] * delta; if (this.rainPositions[offset + 1] < .2) this.rainPositions[offset + 1] = 7.3 + (index % 7) * .35 } const position = this.rainGeometry?.getAttribute('position'); if (position) position.needsUpdate = true }
  private updateQuality(delta: number) { this.qualityCheckElapsed += delta; if (this.qualityCheckElapsed < .5) return; this.qualityCheckElapsed = 0; const recommendation = this.qualityController.update(this.performanceTracker.getSnapshot()); if (recommendation.level === this.qualityLevel) return; this.qualityLevel = recommendation.level; this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, recommendation.settings.pixelRatio)); this.renderer.shadowMap.enabled = recommendation.settings.shadows; this.wetPatches.visible = recommendation.settings.puddles && this.activeLevel.scene.environment.floor.puddles; this.activeRainCount = this.activeRainEnvironment.enabled ? Math.floor(this.rainVelocities.length * recommendation.settings.rainDensity) : 0; if (this.rainGeometry) this.rainGeometry.setDrawRange(0, this.activeRainCount) }
  private updateCombatFeedback(delta: number) { if (!this.combatFeedbackTarget || this.combatFeedbackTime <= 0) return; this.combatFeedbackTime = Math.max(0, this.combatFeedbackTime - delta); const progress = 1 - this.combatFeedbackTime / .55; const pulse = Math.sin(progress * Math.PI); if (this.combatFeedbackTarget === 'player') this.player.rotation.z = Math.sin(progress * Math.PI * 8) * .08 * (1 - progress); else { this.enemy.position.x = this.enemyOrigin.x - pulse * .55; this.enemy.scale.setScalar(1 + pulse * .12) } if (this.combatFeedbackTime === 0) { this.combatFeedbackTarget = null; this.enemy.position.copy(this.enemyOrigin); this.enemy.scale.setScalar(1); this.player.rotation.z = 0 } }
  private updateCombatNotifications(delta: number) { for (let index = this.combatNotifications.length - 1; index >= 0; index--) { const notification = this.combatNotifications[index]; notification.elapsed += delta; const anchor = notification.target === 'player' ? this.player : this.enemy; notification.sprite.position.set(anchor.position.x, anchor.position.y + (notification.target === 'player' ? 2 : 3), anchor.position.z); notification.sprite.position.y += notification.elapsed * .45; notification.material.opacity = notification.elapsed < 1.8 ? 1 : THREE.MathUtils.clamp((3 - notification.elapsed) / 1.2, 0, 1); if (notification.elapsed >= 3) { this.world.remove(notification.sprite); notification.texture.dispose(); notification.material.dispose(); this.combatNotifications.splice(index, 1) } } }
  private updateEnemyDefeat(delta: number) { if (this.enemyDefeatTime <= 0) return; this.enemyDefeatTime = Math.max(0, this.enemyDefeatTime - delta); const progress = 1 - this.enemyDefeatTime / 1.2; this.enemy.scale.setScalar(Math.max(0, 1 - progress)); this.enemy.rotation.y += delta * 5; if (this.enemyDefeatTime === 0) { this.enemy.visible = false; this.enemy.scale.setScalar(1) } }
  private frame = () => { if (this.destroyed) return; const delta = Math.min(this.clock.getDelta(), .05); if (delta > 0) this.performanceTracker.recordFrame(performance.now() / 1000, delta); this.elapsed += delta; this.updateQuality(delta); this.updatePlayer(delta); this.updateInteractionTarget(); this.updateCamera(delta); this.updateRain(delta); this.updateCombatFeedback(delta); this.updateCombatNotifications(delta); this.updateEnemyDefeat(delta); this.player.position.y = Math.sin(this.elapsed * 3) * .025; this.torches.forEach(({ light, flame, phase }) => { const flicker = 1 + Math.sin(this.elapsed * 9 + phase) * .12 + Math.sin(this.elapsed * 17 + phase) * .06; light.intensity = 7 * flicker; flame.scale.setScalar(flicker); }); this.renderer.render(this.scene, this.camera); this.animation = requestAnimationFrame(this.frame) }
}
