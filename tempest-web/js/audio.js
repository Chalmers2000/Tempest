// Audio hooks. Implemented in Phase 8; no-ops for now so callers never crash.

let muted = false;

export function playShoot() {}
export function playEnemyDeath() {}
export function playPlayerDeath() {}
export function playBlaster() {}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
