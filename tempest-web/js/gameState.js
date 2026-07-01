// Game state machine skeleton (Phase 1).

export const GameStates = Object.freeze({
  BOOT: 'BOOT',
  TITLE: 'TITLE',
  LEVEL_START: 'LEVEL_START',
  PLAYING: 'PLAYING',
  PLAYER_DEATH: 'PLAYER_DEATH',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER',
  PAUSED: 'PAUSED',
});

const VALID_STATES = new Set(Object.values(GameStates));

let currentState = GameStates.BOOT;
let stateEnteredAt = performance.now();
const listeners = [];

export function setState(nextState) {
  if (!VALID_STATES.has(nextState)) {
    throw new Error(`Unknown game state: ${nextState}`);
  }
  const previousState = currentState;
  currentState = nextState;
  stateEnteredAt = performance.now();
  for (const listener of listeners) {
    listener(nextState, previousState);
  }
}

export function getState() {
  return currentState;
}

export function getStateElapsedMs() {
  return performance.now() - stateEnteredAt;
}

export function onStateChange(listener) {
  listeners.push(listener);
}
