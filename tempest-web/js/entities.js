// Entity factories/models: player, enemies (crawler/jumper/shooter), and
// projectiles.

import { wrapLane } from './geometry.js';
import {
  LANE_COUNT,
  RIM_RADIUS,
  START_LIVES,
  START_BLASTER_CHARGES,
  PLAYER_FIRE_COOLDOWN_MS,
  PLAYER_PROJECTILE_SPEED,
  ENEMY_PROJECTILE_SPEED,
  ENEMY_BASE_SPEED,
  JUMPER_JUMP_INTERVAL_MS,
  SHOOTER_FIRE_INTERVAL_MS,
  MOUSE_SENSITIVITY,
  LANE_STEP_THRESHOLD,
  MAX_LANE_STEPS_PER_FRAME,
} from './config.js';

export function createPlayer() {
  return {
    laneIndex: 0,
    lives: START_LIVES,
    shootCooldownMs: PLAYER_FIRE_COOLDOWN_MS,
    shootTimerMs: 0,
    blasterCharges: START_BLASTER_CHARGES,
    isAlive: true,
    respawnTimerMs: 0,
    invulnerabilityMs: 0,
    turnAccumulator: 0,
  };
}

export function updatePlayerMovement(player, deltaX) {
  // Negated: increasing laneIndex sweeps clockwise on screen (getRimPosition's
  // canvas Y-axis is flipped vs. standard math angles), so without this the
  // ship moved opposite to the mouse.
  player.turnAccumulator -= deltaX * MOUSE_SENSITIVITY;

  let steps = 0;
  while (Math.abs(player.turnAccumulator) >= LANE_STEP_THRESHOLD && steps < MAX_LANE_STEPS_PER_FRAME) {
    const direction = player.turnAccumulator > 0 ? 1 : -1;
    player.laneIndex = wrapLane(player.laneIndex + direction, LANE_COUNT);
    player.turnAccumulator -= direction * LANE_STEP_THRESHOLD;
    steps += 1;
  }

  const maxAccum = LANE_STEP_THRESHOLD * MAX_LANE_STEPS_PER_FRAME;
  player.turnAccumulator = Math.max(-maxAccum, Math.min(maxAccum, player.turnAccumulator));
}

export function updatePlayerCooldown(player, dt) {
  player.shootTimerMs = Math.max(0, player.shootTimerMs - dt);
}

// Returns true and resets the cooldown if the player was allowed to fire.
export function tryConsumePlayerShot(player) {
  if (player.shootTimerMs > 0) return false;
  player.shootTimerMs = player.shootCooldownMs;
  return true;
}

let nextEnemyId = 1;

// Enemies spawn near center (depth 0) and crawl outward toward the rim.
// jumper/shooter speeds are eased down slightly so their extra behavior
// (lane jumps / firing) reads clearly instead of blurring past.
const ENEMY_SPEED_SCALE_BY_TYPE = {
  crawler: 1.0,
  jumper: 0.9,
  shooter: 0.75,
};

export function createEnemy(type, laneIndex) {
  return {
    id: nextEnemyId++,
    type,
    laneIndex,
    depth: 0,
    speed: ENEMY_BASE_SPEED * (ENEMY_SPEED_SCALE_BY_TYPE[type] ?? 1),
    hp: 1,
    jumpTimerMs: type === 'jumper' ? JUMPER_JUMP_INTERVAL_MS : undefined,
    fireTimerMs: type === 'shooter' ? SHOOTER_FIRE_INTERVAL_MS : undefined,
    reachedRim: false,
  };
}

// onFire is invoked with the enemy when a shooter's cooldown elapses, so the
// caller (main.js) can spawn the actual projectile into its own array.
export function updateEnemy(enemy, dt, onFire) {
  enemy.depth += enemy.speed * (dt / 1000);

  if (enemy.type === 'jumper') {
    enemy.jumpTimerMs -= dt;
    if (enemy.jumpTimerMs <= 0) {
      enemy.jumpTimerMs += JUMPER_JUMP_INTERVAL_MS;
      const direction = Math.random() < 0.5 ? -1 : 1;
      enemy.laneIndex = wrapLane(enemy.laneIndex + direction, LANE_COUNT);
    }
  }

  if (enemy.type === 'shooter') {
    enemy.fireTimerMs -= dt;
    if (enemy.fireTimerMs <= 0) {
      enemy.fireTimerMs += SHOOTER_FIRE_INTERVAL_MS;
      onFire?.(enemy);
    }
  }

  if (enemy.depth >= RIM_RADIUS) {
    enemy.depth = RIM_RADIUS;
    enemy.reachedRim = true; // Phase 5 collision will turn this into player damage
  }
}

// depth follows a rim-to-center convention: RIM_RADIUS at the rim, 0 at the
// center. Player shots travel inward (decreasing depth); enemy shots travel
// outward (increasing depth) starting from the firing enemy's own depth.
export function createProjectile(owner, laneIndex, depth) {
  return {
    owner,
    laneIndex,
    depth: depth ?? (owner === 'player' ? RIM_RADIUS : 0),
    speed: owner === 'player' ? PLAYER_PROJECTILE_SPEED : ENEMY_PROJECTILE_SPEED,
    active: true,
  };
}

export function updateProjectile(projectile, dt) {
  const direction = projectile.owner === 'player' ? -1 : 1;
  projectile.depth += direction * projectile.speed * (dt / 1000);

  if (projectile.owner === 'player' && projectile.depth <= 0) {
    projectile.active = false;
  } else if (projectile.owner === 'enemy' && projectile.depth >= RIM_RADIUS) {
    projectile.active = false; // Phase 5 collision will turn this into a hit
  }
}
