import { createInitialGameState } from './game-state'
import type { GameState } from './game-state'

export type SessionStatus = 'active' | 'victory' | 'failure' | 'reset'

export type Session = {
  status: SessionStatus
  gameState: GameState
  history: readonly GameState[]
}

function statusForGameState(gameState: GameState): Exclude<SessionStatus, 'reset'> {
  if (gameState.phase === 'victory') return 'victory'
  if (gameState.phase === 'failure') return 'failure'
  return 'active'
}

export function createInitialSession(): Session {
  return {
    status: 'active',
    gameState: createInitialGameState(),
    history: [],
  }
}

export function resetSession(_session?: Session): Session {
  return {
    status: 'reset',
    gameState: createInitialGameState(),
    history: [],
  }
}

export function transitionSession(session: Session, gameState: GameState): Session {
  return {
    status: statusForGameState(gameState),
    gameState,
    history: [...session.history, session.gameState],
  }
}

export function transitionToTerminal(
  session: Session,
  status: 'victory' | 'failure',
  gameState: GameState = { ...session.gameState, phase: status },
): Session {
  if (gameState.phase !== status) {
    throw new Error(`Terminal session status "${status}" requires a matching game phase`)
  }

  return {
    status,
    gameState,
    history: [...session.history, session.gameState],
  }
}

export function transitionToVictory(session: Session, gameState?: GameState): Session {
  return transitionToTerminal(session, 'victory', gameState)
}

export function transitionToFailure(session: Session, gameState?: GameState): Session {
  return transitionToTerminal(session, 'failure', gameState)
}
