import type { D20Roller } from '../dice/d20'
import { createGameSnapshot, restoreGameSnapshot, transitionGameState, type GameAction, type GameSnapshot, type GameState } from './game-state'

export type GameCommand = GameAction

export type RuntimePhase = 'loading' | 'playing' | 'paused' | 'victory' | 'defeat' | 'error'

export function applyGameCommand(state: GameState, command: GameCommand, roller: D20Roller): GameState {
  return transitionGameState(state, command, roller)
}

export function snapshotGame(state: GameState): GameSnapshot {
  return createGameSnapshot(state)
}

export function restoreGame(snapshot: GameSnapshot): GameState {
  return restoreGameSnapshot(snapshot)
}
