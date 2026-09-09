import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GameScene, type ScenePerformanceSnapshot } from './game/GameScene'
import { createRandomD20 } from './dice/d20'
import { createNarrativeEntry, type AltarActionId } from './narrative/altar'
import { transitionGameState } from './state/game-state'
import { createInitialSession, resetSession, transitionSession, type Session } from './state/session'
import { cryptOfLunargenta } from './content'
import { archetypes, attributeModifier, createCharacter, pointBuyCost, rollDndAttributes, validateDndPointBuy, type Character, type CharacterAttributes } from './characters/character'
import { applyMvpAction, createMvpSession, type InventoryItem, type MvpAction, type MvpSession } from './mvp/campaign'
import { loadCharacters, loadMvpSession, saveCharacter, saveMvpSession } from './mvp/storage'
import './App.css'

type LogEntry = { speaker: string; text: string; tone?: 'gold' | 'muted' | 'danger'; timestamp: number }
const attributeLabels: Array<[keyof CharacterAttributes, string]> = [['strength', 'FUE'], ['dexterity', 'DES'], ['constitution', 'CON'], ['intelligence', 'INT'], ['wisdom', 'SAB'], ['charisma', 'CAR']]
const sentinelStats = { name: 'Centinela de ceniza', armorClass: 14, strength: 14, dexterity: 12, constitution: 16, intelligence: 7, wisdom: 11, charisma: 5 }

function App() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<GameScene | null>(null)
  const [session, setSession] = useState<Session>(createInitialSession)
  const [roller] = useState(createRandomD20)
  const [action, setAction] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [interactionTarget, setInteractionTarget] = useState<string | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [dismissedOutcomeKey, setDismissedOutcomeKey] = useState<string | null>(null)
  const [characters, setCharacters] = useState<Character[]>(loadCharacters)
  const [character, setCharacter] = useState<Character | null>(() => loadCharacters()[0] ?? null)
  const [creationOpen, setCreationOpen] = useState(() => loadCharacters().length === 0)
  const [mvp, setMvp] = useState<MvpSession | null>(() => { const saved = loadCharacters()[0]; return saved ? loadMvpSession(saved.id) ?? createMvpSession(saved) : null })
  const [creationName, setCreationName] = useState('')
  const [creationArchetype, setCreationArchetype] = useState(archetypes[0].id)
  const [creationError, setCreationError] = useState('')
  const [inventoryMenuId, setInventoryMenuId] = useState<InventoryItem['id'] | null>(null)
  const [creationMode, setCreationMode] = useState<'archetype' | 'manual' | 'random'>('archetype')
  const [creationStats, setCreationStats] = useState<CharacterAttributes>(() => ({ ...archetypes[0].attributes }))
  const [characterStatsOpen, setCharacterStatsOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<'ash-sentinel' | null>(null)
  const [performanceSnapshot, setPerformanceSnapshot] = useState<ScenePerformanceSnapshot | null>(null)
  const rollTimerRef = useRef<number | null>(null)
  const combatTimerRef = useRef<number | null>(null)
  const turnTimerRef = useRef<number | null>(null)
  const gameState = session.gameState
  const activeZoneId = mvp?.zoneId
  const visibleSelectedEntity = selectedEntity && mvp?.zoneId === 'ashen-courtyard' && mvp.encounter.status !== 'victory' && mvp.encounter.status !== 'defeat' ? selectedEntity : null
  const encounterStatus = mvp?.encounter.status
  const encounterEnemyHp = mvp?.encounter.enemyHp
  const encounterEnemyMaxHp = mvp?.encounter.enemyMaxHp
  const hpPercent = gameState.player.maxHp > 0 ? (gameState.player.hp / gameState.player.maxHp) * 100 : 0
  const mpPercent = gameState.player.maxMp > 0 ? (gameState.player.mp / gameState.player.maxMp) * 100 : 0
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const menuWasOpenRef = useRef(false)
  const storyLogRef = useRef<HTMLDivElement>(null)
  const combatLocked = mvp?.encounter.status === 'active'

  const startCharacter = (candidate: Character) => {
    saveCharacter(candidate)
    setCharacters(loadCharacters())
    setCharacter(candidate)
    setCreationOpen(false)
    setMvp(loadMvpSession(candidate.id) ?? createMvpSession(candidate))
    const fresh = createInitialSession()
    setSession({ ...fresh, gameState: { ...fresh.gameState, player: { ...candidate.resources, attributes: candidate.attributes } } })
    setCreationError('')
  }

  const createNewCharacter = () => {
    try {
      const attributes = creationMode === 'random' ? rollDndAttributes() : creationMode === 'manual' ? creationStats : archetypes.find((archetype) => archetype.id === creationArchetype)?.attributes ?? creationStats
      if (creationMode === 'manual' && !validateDndPointBuy(attributes)) throw new Error(`La compra de puntos usa ${pointBuyCost(attributes)}/27 y permite valores entre 8 y 15.`)
      startCharacter(createCharacter(creationName, creationArchetype, 'wanderer', crypto.randomUUID(), { attributes }))
    } catch (error) { setCreationError(error instanceof Error ? error.message : 'No se pudo crear el personaje.') }
  }

  const startNewCharacter = () => { setCreationOpen(true); setMenuOpen(false); setCreationError('') }

  const performMvpAction = (action: MvpAction) => {
    if (!mvp) return
    const next = applyMvpAction(mvp, action)
    if (action.type === 'resolve-attack') {
      const enemyDamage = Math.max(0, mvp.encounter.enemyHp - next.encounter.enemyHp)
      const playerDamage = Math.max(0, mvp.character.resources.hp - next.character.resources.hp)
      sceneRef.current?.triggerCombatFeedback('player', action.roll >= 10)
      if (enemyDamage > 0) sceneRef.current?.showCombatNotification('enemy', enemyDamage, 'debuff')
      if (next.character.resources.hp < mvp.character.resources.hp) {
        sceneRef.current?.showCombatNotification('player', playerDamage, 'debuff')
        if (combatTimerRef.current !== null) window.clearTimeout(combatTimerRef.current)
        combatTimerRef.current = window.setTimeout(() => {
          sceneRef.current?.triggerCombatFeedback('enemy', true)
          combatTimerRef.current = null
        }, 300)
      }
    }
    if (action.type === 'use-potion') {
      const healing = Math.max(0, next.character.resources.hp - mvp.character.resources.hp)
      if (healing > 0) sceneRef.current?.showCombatNotification('player', healing, 'buff')
    }
    if (action.type === 'use-potion' || action.type === 'drop-item') setInventoryMenuId(null)
    if (action.type === 'travel' || action.type === 'reset-encounter') setSelectedEntity(null)
    setMvp(next)
    setSession((current) => {
      const changedZone = action.type === 'travel'
      const nextGameState = changedZone
        ? transitionGameState(current.gameState, { type: 'change-zone', zoneId: next.zoneId }, roller)
        : current.gameState
      const completedCampaign = next.zoneId === 'ashen-courtyard' && next.encounter.status === 'victory'
      const died = next.character.resources.hp <= 0
      const recoveredFromDeath = action.type === 'reset-encounter' && current.gameState.phase === 'failure'
      const campaignMessages = action.type === 'travel' ? [] : next.log.slice(mvp.log.length)
      const playerResources = changedZone ? current.gameState.player : { ...next.character.resources, attributes: current.gameState.player.attributes }
      const entries = [...nextGameState.entries, ...campaignMessages.map((message) => createNarrativeEntry('Sistema', message, action.type === 'resolve-attack' || action.type === 'resolve-enemy-turn' ? 'gold' : undefined))]
      const finalGameState = died
        ? { ...nextGameState, phase: 'failure' as const, movementLocked: true, player: playerResources, entries: [...entries, createNarrativeEntry('Narrador', 'Tu vida llega a cero. Has muerto, pero puedes reintentar el encuentro desde el último punto seguro.', 'danger')] }
        : completedCampaign
          ? { ...nextGameState, phase: 'victory' as const, movementLocked: false, player: playerResources, entries: [...entries, createNarrativeEntry('Narrador', 'El Patio de Ceniza queda en silencio. Has completado la campaña.', 'gold')] }
          : { ...nextGameState, phase: recoveredFromDeath ? 'exploration' as const : nextGameState.phase, movementLocked: recoveredFromDeath ? false : nextGameState.movementLocked, player: playerResources, entries }
      return transitionSession(current, finalGameState)
    })
  }

  useEffect(() => {
    if (!viewportRef.current) return
    const scene = new GameScene(viewportRef.current, (message) => {
      setSession((current) => transitionSession(current, transitionGameState(current.gameState, { type: 'environment-message', message }, roller)))
    }, (target) => setInteractionTarget(target?.id ?? null), (entityId) => setSelectedEntity(entityId === 'ash-sentinel' ? entityId : null))
    sceneRef.current = scene
    scene.start()
    const performanceTimer = window.setInterval(() => setPerformanceSnapshot(scene.getPerformanceSnapshot()), 500)
    return () => {
      window.clearInterval(performanceTimer)
      setPerformanceSnapshot(null)
      sceneRef.current = null
      scene.destroy()
    }
  }, [roller])

  useEffect(() => () => {
    if (rollTimerRef.current !== null) window.clearTimeout(rollTimerRef.current)
    if (combatTimerRef.current !== null) window.clearTimeout(combatTimerRef.current)
    if (turnTimerRef.current !== null) window.clearTimeout(turnTimerRef.current)
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      if (menuWasOpenRef.current) menuButtonRef.current?.focus()
      menuWasOpenRef.current = false
      return
    }

    menuWasOpenRef.current = true
    menuCloseRef.current?.focus()
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', closeWithEscape)
    return () => document.removeEventListener('keydown', closeWithEscape)
  }, [menuOpen])

  useEffect(() => {
    if (!creationOpen) return
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setCreationOpen(false) }
    document.addEventListener('keydown', closeWithEscape)
    return () => document.removeEventListener('keydown', closeWithEscape)
  }, [creationOpen])

  const submitAction = (value: string) => {
    const clean = value.trim()
    if (!clean) return
    setSession((current) => transitionSession(current, transitionGameState(current.gameState, { type: 'submit-input', input: clean, targetId: interactionTarget ?? undefined }, roller)))
    setAction('')
  }

  const chooseAction = (actionId: AltarActionId) => {
    if (actionId === 'open-exit') setMvp((current) => current ? applyMvpAction(current, { type: 'travel', zoneId: 'ashen-courtyard' }) : current)
    setSession((current) => {
      const resolved = transitionGameState(current.gameState, { type: 'choose-action', actionId, targetId: interactionTarget ?? undefined }, roller)
      const nextState = actionId === 'open-exit' && resolved.flags.exitOpened ? transitionGameState(resolved, { type: 'change-zone', zoneId: 'ashen-courtyard' }, roller) : resolved
      return transitionSession(current, nextState)
    })
  }

  const log: LogEntry[] = gameState.entries
  const visibleLog = log
  const lastRoll = gameState.lastRoll
  const displayedRoll = lastRoll?.total ?? mvp?.lastRoll ?? null
  const pendingCheck = gameState.pendingCheck !== null || mvp?.encounter.awaitingRoll === true
  const inCrypt = mvp?.zoneId === 'crypt-of-lunargenta'
  const nearAltar = inCrypt && interactionTarget === 'altar'
  const nearTorch = inCrypt && (interactionTarget?.startsWith('torch-') ?? false)
  const nearExit = inCrypt && interactionTarget === 'exit-door'
  const nearIria = !inCrypt && interactionTarget === 'iria'
  const nearRelic = !inCrypt && interactionTarget === 'courtyard-relic'
  const nearEnemy = !inCrypt && interactionTarget === 'ash-sentinel'
  const interactionLabel = nearTorch ? 'ANTORCHA' : nearExit ? 'PUERTA DE SALIDA' : nearAltar ? 'ALTAR' : nearIria ? 'IRIA' : nearRelic ? 'RELIQUIA' : nearEnemy ? 'CENTINELA' : null
  const contextualActions = gameState.availableActions.filter((item) => {
    if (nearAltar) return item.id === 'inspect-altar' || item.id === 'retry-altar'
    if (nearTorch) return item.id === 'inspect-torch' || item.id === 'light-torch'
    if (nearExit) return item.id === 'open-exit'
    return false
  })
  const interactionMessage = nearIria ? 'Una guardiana espera junto al muro.' : nearRelic ? 'Una reliquia pulsa sobre el pedestal.' : nearEnemy ? 'El centinela vigila el paso.' : contextualActions.length > 0
    ? nearAltar && contextualActions.some((item) => item.id === 'inspect-altar') ? 'Puedes investigar este lugar.' : nearAltar && contextualActions.some((item) => item.id === 'retry-altar') ? 'Puedes volver a intentar la prueba a cambio de vida.' : nearAltar ? 'Ya has investigado este altar.' : nearExit ? 'La salida espera una última decisión.' : 'Hay acciones disponibles para esta antorcha.'
    : nearExit ? 'La salida está bloqueada. Revisa los objetivos pendientes.' : 'Todavía no puedes interactuar con este objeto.'
  const outcomeKey = gameState.phase === 'victory'
    ? 'victory'
    : gameState.phase === 'failure'
      ? 'failure'
      : gameState.lastRollOutcome
        ? `roll-${gameState.entries.length}`
        : null
  const outcomeVisible = outcomeKey !== null && dismissedOutcomeKey !== outcomeKey
  const outcomeType = gameState.phase === 'victory' ? 'victory' : gameState.phase === 'failure' || gameState.lastRollOutcome === 'failure' ? 'failure' : 'success'

  const rollDice = () => {
    if (isRolling) return
    const resolvingEncounter = mvp?.encounter.awaitingRoll === true
    setIsRolling(true)
    rollTimerRef.current = window.setTimeout(() => {
      try {
        if (resolvingEncounter) { const roll = roller.roll(attributeModifier(character?.attributes.strength ?? 10)); performMvpAction({ type: 'resolve-attack', roll: roll.total, die: roll.value, modifier: roll.modifier }) }
        else setSession((current) => transitionSession(current, transitionGameState(current.gameState, { type: 'roll-dice' }, roller)))
      } catch {
        setSession((current) => transitionSession(current, transitionGameState(current.gameState, { type: 'environment-message', message: 'La tirada no pudo resolverse. La acción sigue disponible para reintentar.', }, roller)))
      } finally {
        setIsRolling(false)
        rollTimerRef.current = null
      }
    }, 720)
  }

  const resetGame = () => {
    if (rollTimerRef.current !== null) {
      window.clearTimeout(rollTimerRef.current)
      rollTimerRef.current = null
    }
    if (combatTimerRef.current !== null) {
      window.clearTimeout(combatTimerRef.current)
      combatTimerRef.current = null
    }
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current)
      turnTimerRef.current = null
    }
    sceneRef.current?.reset()
    const freshSession = resetSession()
    if (character) {
      const archetype = archetypes.find((candidate) => candidate.id === character.archetypeId)
      const resetCharacter = { ...character, level: 1, experience: 0, inventory: [], completedMilestones: [], resources: archetype?.resources ?? character.resources }
      saveCharacter(resetCharacter)
      setCharacter(resetCharacter)
      setMvp(createMvpSession(resetCharacter))
      setCharacters(loadCharacters())
      setSession({ ...freshSession, gameState: { ...freshSession.gameState, player: { ...resetCharacter.resources, attributes: resetCharacter.attributes } } })
    } else {
      setSession(freshSession)
    }
    setAction('')
    setMenuOpen(false)
    setHistoryOpen(false)
    setInteractionTarget(null)
    setIsRolling(false)
    setDismissedOutcomeKey(null)
  }

  useEffect(() => {
    sceneRef.current?.setMovementLocked(gameState.movementLocked || isRolling)
    if (!character || combatLocked || creationOpen) sceneRef.current?.setMovementLocked(true)
  }, [character, combatLocked, creationOpen, gameState.movementLocked, isRolling])

  useEffect(() => {
    sceneRef.current?.setWorldState(gameState.flags)
  }, [gameState.flags])

  useEffect(() => {
    if (!mvp || !character) return
    saveMvpSession(mvp)
    saveCharacter(mvp.character)
  }, [character, mvp])

  useEffect(() => {
    const storyLog = storyLogRef.current
    if (storyLog) storyLog.scrollTop = storyLog.scrollHeight
  }, [gameState.entries.length])

  useEffect(() => {
    if (activeZoneId) sceneRef.current?.setZone(activeZoneId)
  }, [activeZoneId])

  useEffect(() => {
    if (encounterStatus && encounterEnemyHp !== undefined && encounterEnemyMaxHp !== undefined) sceneRef.current?.setEncounter(encounterStatus, encounterEnemyHp, encounterEnemyMaxHp)
  }, [encounterStatus, encounterEnemyHp, encounterEnemyMaxHp])

  useEffect(() => {
    if (!mvp || mvp.encounter.status !== 'active' || mvp.encounter.turn !== 'enemy') return
    turnTimerRef.current = window.setTimeout(() => {
      const next = applyMvpAction(mvp, { type: 'resolve-enemy-turn' })
      const damage = Math.max(0, mvp.character.resources.hp - next.character.resources.hp)
      sceneRef.current?.triggerCombatFeedback('enemy', true)
      if (damage > 0) sceneRef.current?.showCombatNotification('player', damage, 'debuff')
      setMvp(next)
      const died = next.character.resources.hp <= 0
      const entries = next.log.slice(mvp.log.length).map((message) => createNarrativeEntry('Sistema', message, 'gold'))
      setSession((current) => transitionSession(current, died
        ? { ...current.gameState, phase: 'failure', movementLocked: true, player: { ...next.character.resources, attributes: current.gameState.player.attributes }, entries: [...current.gameState.entries, ...entries, createNarrativeEntry('Narrador', 'Tu vida llega a cero. Has muerto, pero puedes reintentar el encuentro desde el último punto seguro.', 'danger')] }
        : { ...current.gameState, player: { ...next.character.resources, attributes: current.gameState.player.attributes }, entries: [...current.gameState.entries, ...entries] }))
      turnTimerRef.current = null
    }, 850)
    return () => { if (turnTimerRef.current !== null) window.clearTimeout(turnTimerRef.current) }
  }, [mvp])

  return (
    <main className="app-shell">
      <div ref={viewportRef} className="game-viewport" role="img" aria-label="Escena 3D de la cripta" />
      <div className="vignette" />
      {import.meta.env.DEV && performanceSnapshot && <aside className="performance-panel" aria-label="Diagnóstico de rendimiento">
        <b>{performanceSnapshot.averageFps.toFixed(0)} FPS</b>
        <span>{(performanceSnapshot.averageFrameTimeSeconds * 1000).toFixed(1)} ms</span>
        <small>{performanceSnapshot.drawCalls} calls · {performanceSnapshot.triangles.toLocaleString('es-ES')} tris</small>
        <small>{performanceSnapshot.framesOver33ms} frames &gt; 33 ms</small>
        <small>{performanceSnapshot.geometries} geo · {performanceSnapshot.textures} tex</small>
      </aside>}

      {creationOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreationOpen(false)}><section className="onboarding-card" aria-labelledby="onboarding-title" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Cerrar creador de personaje" onClick={() => setCreationOpen(false)}>×</button>
        <div className="eyebrow">DUNGEON DICE / CAMPAÑA I</div>
        <h1 id="onboarding-title">Elige quién cruza el umbral</h1>
        <p>Tu personaje conserva experiencia, objetos y decisiones en este navegador.</p>
        <label htmlFor="character-name">Nombre del personaje</label>
        <input id="character-name" value={creationName} onChange={(event) => setCreationName(event.target.value)} placeholder="Ej. Alda" autoComplete="nickname" />
        <fieldset><legend>Arquetipo</legend><div className="archetype-grid">{archetypes.map((archetype) => <button key={archetype.id} type="button" className={creationArchetype === archetype.id ? 'selected' : ''} onClick={() => { setCreationArchetype(archetype.id); if (creationMode === 'archetype') setCreationStats({ ...archetype.attributes }) }}><strong>{archetype.name}</strong><span>{archetype.description}</span><small>HP {archetype.resources.maxHp} · MP {archetype.resources.maxMp}</small></button>)}</div></fieldset>
        <div className="creation-modes" role="group" aria-label="Método de atributos"><button type="button" className={creationMode === 'archetype' ? 'selected' : ''} onClick={() => { setCreationMode('archetype'); setCreationStats({ ...(archetypes.find((item) => item.id === creationArchetype)?.attributes ?? archetypes[0].attributes) }) }}>Atributos del arquetipo</button><button type="button" className={creationMode === 'manual' ? 'selected' : ''} onClick={() => setCreationMode('manual')}>Compra de puntos</button><button type="button" className={creationMode === 'random' ? 'selected' : ''} onClick={() => setCreationMode('random')}>4d6 aleatorio</button></div>
        {creationMode === 'manual' && <div className="attribute-editor"><small>Compra de puntos: {pointBuyCost(creationStats)}/27 · valores 8-15</small>{attributeLabels.map(([key, label]) => <label key={key}>{label}<input type="number" min="8" max="15" value={creationStats[key]} onChange={(event) => setCreationStats((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}</div>}
        {creationMode === 'random' && <p className="creation-note">Se lanzan cuatro dados por atributo y se descarta el menor, como en D&D.</p>}
        {creationError && <p className="form-error" role="alert">{creationError}</p>}
        <button className="primary-action" type="button" onClick={createNewCharacter}>Comenzar campaña</button>
        {characters.length > 0 && <div className="saved-characters"><span>PARTIDAS LOCALES</span>{characters.map((saved) => <button key={saved.id} type="button" onClick={() => startCharacter(saved)}>{saved.name}<small>{saved.archetypeId} · nivel {saved.level}</small></button>)}</div>}
      </section></div>}

      <header className="topbar" aria-label="Cabecera de la sesión">
        <div className="brand"><span className="brand-mark">✦</span><span>VEIL / <b>FALL</b></span></div>
        <div className="session"><span className="live-dot" /> SESIÓN 01 <span className="divider" /> LA CRIPTA DE LUNARGENTA</div>
        <button ref={menuButtonRef} className="menu-button" type="button" aria-label="Abrir menú de controles" aria-expanded={menuOpen} aria-controls="controls-menu" onClick={() => setMenuOpen(true)}>☰</button>
      </header>

      <aside className="objectives-panel" aria-label="Objetivos y pruebas de la cripta">
        <div className="objectives-heading">OBJETIVOS DE LA CRIPTA</div>
        <ul>{gameState.objectives.map((objective) => <li key={objective.id} className={`${objective.completed ? 'completed' : ''}${objective.blocked ? ' blocked' : ''}`}><b>{objective.completed ? '✓' : objective.blocked ? '·' : '○'}</b><span>{objective.label}</span></li>)}</ul>
        <div className="checks-heading">PRUEBAS</div>
        <ul className="checks-list">{gameState.checks.map((check) => <li key={check.id} className={`${check.completed ? 'completed' : ''}${check.blocked ? ' blocked' : ''}`}><b>{check.completed ? '✓' : check.blocked ? '·' : 'D20'}</b><span>{check.label}<small>DD {check.difficulty}</small></span></li>)}</ul>
      </aside>

      {visibleSelectedEntity === 'ash-sentinel' && mvp && <aside className="target-stats-panel" aria-label="Estadísticas del Centinela de ceniza">
        <div className="target-stats-header"><span>ENEMIGO</span><button type="button" aria-label="Cerrar estadísticas del enemigo" onClick={() => setSelectedEntity(null)}>×</button></div>
        <h2>{sentinelStats.name}</h2><p>HP {mvp.encounter.enemyHp}/{mvp.encounter.enemyMaxHp} · CA {sentinelStats.armorClass}</p>
        <div className="attribute-list">{attributeLabels.map(([key, label]) => <span key={key}><b>{label}</b>{sentinelStats[key]}</span>)}</div>
      </aside>}

      <aside className="left-rail" aria-label="Estado del personaje">
        {character ? <button type="button" className="portrait" aria-label="Mostrar estadísticas del personaje" aria-expanded={characterStatsOpen} onClick={() => setCharacterStatsOpen((open) => !open)}><span>✧</span></button> : <div className="portrait"><span>✧</span></div>}
        {character && mvp && <button type="button" className="character-identity" aria-expanded={characterStatsOpen} onClick={() => setCharacterStatsOpen((open) => !open)}><strong>{character.name}</strong><small>{character.archetypeId}</small><small>XP {mvp.experience} · MOCHILA {mvp.inventory.reduce((total, item) => total + item.quantity, 0)}</small></button>}
        {character && characterStatsOpen && <aside className="character-stats-popover" aria-label="Estadísticas del personaje"><div className="target-stats-header"><span>PERSONAJE</span><button type="button" aria-label="Cerrar estadísticas del personaje" onClick={() => setCharacterStatsOpen(false)}>×</button></div><h2>{character.name}</h2><p>Nivel {mvp?.level ?? character.level} · HP {gameState.player.hp}/{gameState.player.maxHp}</p><div className="attribute-list">{attributeLabels.map(([key, label]) => <span key={key}><b>{label}</b>{character.attributes[key]}</span>)}</div></aside>}
        <div className="rail-divider" />
        <div className="stat"><span>HP</span><strong>{String(gameState.player.hp).padStart(2, '0')}</strong><i className="bar hp" style={{ '--fill': `${hpPercent}%` } as CSSProperties} /></div>
        <div className="stat"><span>MP</span><strong>{String(gameState.player.mp).padStart(2, '0')}</strong><i className="bar mp" style={{ '--fill': `${mpPercent}%` } as CSSProperties} /></div>
        <div className="level">LVL<br /><b>{mvp?.level ?? 1}</b></div>
      </aside>

      <section key={activeZoneId} className="location-card title-reveal" aria-labelledby="location-title"><span className="eyebrow">REGIÓN {activeZoneId === 'ashen-courtyard' ? '02' : '01'} / {activeZoneId === 'ashen-courtyard' ? 'PATIO DE CENIZA' : 'RUINAS BAJAS'}</span><h1 id="location-title">{activeZoneId === 'ashen-courtyard' ? 'El Patio de Ceniza' : cryptOfLunargenta.title}</h1><p>{activeZoneId === 'ashen-courtyard' ? 'Donde las brasas guardan el siguiente umbral.' : 'Donde la piedra recuerda cada nombre.'}</p></section>

      <section className="narrative-panel" aria-labelledby="narrative-title">
        <div className="panel-label panel-header"><span id="narrative-title">✧ REGISTRO DE VIAJE</span><button className="history-toggle" type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)}>{historyOpen ? 'OCULTAR' : 'HISTORIAL'}</button></div>
         <div ref={storyLogRef} className="story-log">{visibleLog.slice(-10).map((entry, index) => { const recent = index >= Math.max(0, visibleLog.slice(-10).length - 3); return <p key={`${entry.timestamp}-${entry.text}-${index}`} className={`${entry.tone ?? ''}${recent ? ' recent' : ''}`}><span>{entry.speaker}<time>{new Date(entry.timestamp).toLocaleTimeString('es-ES')}</time></span>{entry.text}</p> })}</div>
         {mvp && <div className="campaign-in-log" aria-label="Registro de campaña">
            {mvp.encounter.status === 'active' && <div className="turn-status" aria-live="polite">{mvp.encounter.awaitingRoll ? 'LANZA EL D20' : mvp.encounter.turn === 'enemy' ? 'TURNO DEL ENEMIGO' : 'TU TURNO'}</div>}
            <div className="campaign-tabs"><button type="button" className={mvp.zoneId === 'crypt-of-lunargenta' ? 'active' : ''} onClick={() => performMvpAction({ type: 'travel', zoneId: 'crypt-of-lunargenta' })}>CRIPTA</button><button type="button" className={mvp.zoneId === 'ashen-courtyard' ? 'active' : ''} onClick={() => performMvpAction({ type: 'travel', zoneId: 'ashen-courtyard' })}>PATIO</button></div>
            {nearIria && <div className="campaign-actions"><button type="button" onClick={() => performMvpAction({ type: 'talk-npc' })}>Hablar con Iria</button></div>}
            {nearRelic && <div className="campaign-actions"><button type="button" onClick={() => performMvpAction({ type: 'inspect-relic' })}>Inspeccionar la reliquia</button></div>}
            {nearEnemy && <div className="campaign-actions"><button type="button" onClick={() => performMvpAction({ type: 'start-encounter' })} disabled={mvp.encounter.status === 'active'}>Enfrentar al centinela</button>{mvp.encounter.status === 'defeat' && <button type="button" onClick={() => performMvpAction({ type: 'reset-encounter' })}>Reintentar encuentro</button>}</div>}
            {mvp.encounter.status === 'active' && <div className="enemy-health"><span>CENTINELA {mvp.encounter.enemyHp}/{mvp.encounter.enemyMaxHp}</span><i style={{ '--fill': `${(mvp.encounter.enemyHp / mvp.encounter.enemyMaxHp) * 100}%` } as CSSProperties} /></div>}
         </div>}
        {interactionLabel && <div className={`interaction-prompt${contextualActions.length === 0 ? ' unavailable' : ''}`}><span>{interactionLabel}</span>{interactionMessage}</div>}
        <div className="action-suggestions">{contextualActions.map((item) => <button key={item.id} onClick={() => chooseAction(item.id)}>{item.label}<span>↗</span></button>)}</div>
        <form className="action-form" onSubmit={(event) => { event.preventDefault(); submitAction(action) }}>
          <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="¿Qué haces?" aria-label="Escribe una acción" />
          <button type="submit">ENVIAR <span>↵</span></button>
        </form>
       </section>

       <section className="inventory-bar" aria-label="Inventario">
         <span className="inventory-label">INVENTARIO</span>
         <div className="inventory-slots">{mvp?.inventory.length ? mvp.inventory.map((item) => <button key={item.id} type="button" className={`inventory-item${inventoryMenuId === item.id ? ' selected' : ''}`} onClick={() => setInventoryMenuId(inventoryMenuId === item.id ? null : item.id)}><b>{item.id === 'moon-potion' ? '✦' : '◇'}</b><span>{item.label}</span><strong>{item.quantity}</strong></button>) : <span className="inventory-empty">Tu mochila está vacía</span>}</div>
         {inventoryMenuId && mvp && <div className="inventory-menu" role="menu"><strong>{mvp.inventory.find((item) => item.id === inventoryMenuId)?.label}</strong>{inventoryMenuId === 'moon-potion' && <button type="button" onClick={() => performMvpAction({ type: 'use-potion' })} disabled={mvp.encounter.status === 'active'}>Usar</button>}<button type="button" onClick={() => performMvpAction({ type: 'drop-item', itemId: inventoryMenuId })}>Dejar</button></div>}
       </section>

      {historyOpen && <aside className="history-sidebar" aria-label="Historial completo del viaje">
        <div className="history-header"><span>HISTORIAL DEL VIAJE</span><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Cerrar historial">×</button></div>
        <div className="history-list">{visibleLog.length ? visibleLog.map((entry, index) => <p key={`${entry.timestamp}-${entry.text}-${index}`} className={entry.tone}><span>{entry.speaker}<time>{new Date(entry.timestamp).toLocaleTimeString('es-ES')}</time></span>{entry.text}</p>) : <p className="history-empty">El historial visible está vacío.</p>}</div>
      </aside>}

      {menuOpen && <aside id="controls-menu" className="controls-menu" role="dialog" aria-modal="true" aria-labelledby="controls-menu-title">
        <div className="controls-menu-header"><h2 id="controls-menu-title">CONTROLES</h2><button ref={menuCloseRef} type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú de controles">×</button></div>
        <p>Explora la cripta y observa sus señales.</p><small className="session-status">ESTADO: {session.status.toUpperCase()}</small>
        <ul>
          <li><b>WASD</b><span>Mover</span></li>
           <li><b>ARRASTRAR</b><span>Rotar cámara</span></li>
           <li><b>RUEDA</b><span>Acercar o alejar</span></li>
         </ul>
         <button className="reset-game-button" type="button" onClick={startNewCharacter}>Crear otro personaje</button>
         <button className="reset-game-button" type="button" onClick={resetGame}>Reiniciar partida</button>
       </aside>}

       {outcomeVisible && <div className={`outcome-banner ${outcomeType}`} role="status" onClick={() => setDismissedOutcomeKey(outcomeKey)}><button type="button" className="outcome-close" aria-label="Cerrar mensaje" onClick={(event) => { event.stopPropagation(); setDismissedOutcomeKey(outcomeKey) }}>×</button><span>{outcomeType === 'victory' ? 'VICTORIA' : outcomeType === 'failure' ? gameState.player.hp === 0 ? 'HAS MUERTO' : 'LA CRIPTA TE RECHAZA' : 'PRUEBA SUPERADA'}</span><p>{outcomeType === 'victory' ? 'Has completado todos los mapas de la campaña.' : outcomeType === 'failure' ? gameState.player.hp === 0 ? 'Tu vida llegó a cero. Puedes reintentar el encuentro desde el último punto seguro.' : 'La pista se ha perdido, pero esta historia todavía puede crecer.' : 'La tirada ha superado la dificultad. El altar revela un nuevo camino.'}</p></div>}

       <div className={`dice-widget${pendingCheck ? ' pending' : ''}`}><div className="dice-heading"><span>DADOS</span><b>{displayedRoll !== null ? `D20 · ${displayedRoll}` : 'D20 · LISTO'}</b></div><button className={`die${isRolling ? ' rolling' : ''}`} onClick={rollDice} disabled={isRolling} aria-label={pendingCheck ? 'Lanzar el dado para resolver la acción' : 'Lanzar dado de veinte caras'}><span>{isRolling ? '···' : lastRoll?.value ?? mvp?.lastDie ?? '—'}</span></button><p>{isRolling ? 'La fortuna gira...' : pendingCheck ? 'Lanza el D20 para resolver la acción' : 'Click para lanzar'}</p></div>
      <aside className="controls" aria-label="Controles rápidos"><span><b>WASD</b> MOVER</span><span><b>DRAG</b> ROTAR</span><span><b>SCROLL</b> ZOOM</span></aside>
      <div className="corner-note">VOL. I <span>•</span> EL UMBRAL</div>
    </main>
  )
}

export default App
