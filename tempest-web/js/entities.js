// Entity factories/models: player, enemies (crawler/jumper/shooter), and
// projectiles. Player/enemy factories bake in difficulty-profile-derived
// tuning at creation time so update functions don't need a profile threaded
// through every call.

import { stepLane, isActiveArenaClosed } from './geometry.js';
import {
  LANE_COUNT,
  RIM_RADIUS,
  START_LIVES,
  PLAYER_FIRE_COOLDOWN_MS,
  PLAYER_PROJECTILE_SPEED,
  ENEMY_PROJECTILE_SPEED,
  ENEMY_BASE_SPEED,
  JUMPER_JUMP_INTERVAL_MS,
  SHOOTER_FIRE_INTERVAL_MS,
  MOUSE_SENSITIVITY,
  LANE_STEP_THRESHOLD,
  MAX_LANE_STEPS_PER_FRAME,
  POLE_GROWTH_RATE,
} from './config.js';

export function createPlayer(profile) {
  return {
    laneIndex: 0,
    lives: START_LIVES,
    shootCooldownMs: PLAYER_FIRE_COOLDOWN_MS * profile.playerFireCooldownScale,
    shootTimerMs: 0,
    blasterCharges: profile.blasterChargeStart,
    isAlive: true,
    respawnTimerMs: 0,
    invulnerabilityMs: 0,
    turnAccumulator: 0,
    // Higher sensitivity scale = less mouse travel needed per lane step.
    laneStepThreshold: LANE_STEP_THRESHOLD / profile.laneStepSensitivityScale,
    respawnInvulnMs: profile.respawnInvulnerabilityMs,
  };
}

export function updatePlayerMovement(player, deltaX) {
  // Negated: increasing laneIndex sweeps clockwise on screen (getRimPosition's
  // canvas Y-axis is flipped vs. standard math angles), so without this the
  // ship moved opposite to the mouse.
  player.turnAccumulator -= deltaX * MOUSE_SENSITIVITY;

  let steps = 0;
  while (Math.abs(player.turnAccumulator) >= player.laneStepThreshold && steps < MAX_LANE_STEPS_PER_FRAME) {
    const direction = player.turnAccumulator > 0 ? 1 : -1;
    player.laneIndex = stepLane(player.laneIndex, direction, LANE_COUNT);
    player.turnAccumulator -= direction * player.laneStepThreshold;
    steps += 1;
  }

  const maxAccum = player.laneStepThreshold * MAX_LANE_STEPS_PER_FRAME;
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

// Returns true and decrements charges if the player had one to spend.
export function tryConsumeBlasterCharge(player) {
  if (player.blasterCharges <= 0) return false;
  player.blasterCharges -= 1;
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

const MIN_SHOOTER_FIRE_INTERVAL_MS = 400;

// speedMultiplier and fireRateMultiplier come from the active difficulty
// profile + current level (see main.js's computeLevelTuning).
export function createEnemy(type, laneIndex, speedMultiplier = 1, fireRateMultiplier = 1) {
  return {
    id: nextEnemyId++,
    type,
    laneIndex,
    depth: 0,
    speed: ENEMY_BASE_SPEED * (ENEMY_SPEED_SCALE_BY_TYPE[type] ?? 1) * speedMultiplier,
    hp: 1,
    jumpIntervalMs: JUMPER_JUMP_INTERVAL_MS,
    jumpTimerMs: type === 'jumper' ? JUMPER_JUMP_INTERVAL_MS : undefined,
    fireIntervalMs: Math.max(MIN_SHOOTER_FIRE_INTERVAL_MS, SHOOTER_FIRE_INTERVAL_MS / fireRateMultiplier),
    fireTimerMs: type === 'shooter' ? SHOOTER_FIRE_INTERVAL_MS / fireRateMultiplier : undefined,
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
      enemy.jumpTimerMs += enemy.jumpIntervalMs;
      let direction = Math.random() < 0.5 ? -1 : 1;
      // On an open arena, a jump that would clamp against an end wastes the
      // jump entirely - pick the in-bounds direction instead so jumpers at
      // the ends keep moving rather than stalling.
      if (!isActiveArenaClosed()) {
        if (enemy.laneIndex === 0) direction = 1;
        else if (enemy.laneIndex === LANE_COUNT - 1) direction = -1;
      }
      enemy.laneIndex = stepLane(enemy.laneIndex, direction, LANE_COUNT);
    }
  }

  if (enemy.type === 'shooter') {
    enemy.fireTimerMs -= dt;
    if (enemy.fireTimerMs <= 0) {
      enemy.fireTimerMs += enemy.fireIntervalMs;
      onFire?.(enemy);
    }
  }

  if (enemy.depth >= RIM_RADIUS) {
    enemy.depth = RIM_RADIUS;
    enemy.reachedRim = true; // collision.js turns this into player damage
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
  }
  // Enemy projectiles are deactivated by collision.js when they reach the
  // rim - that's also where the hit/miss decision against the player lives.
}

export function updatePlayerInvulnerability(player, dt) {
  player.invulnerabilityMs = Math.max(0, player.invulnerabilityMs - dt);
}

export function respawnPlayer(player) {
  player.isAlive = true;
  player.invulnerabilityMs = player.respawnInvulnMs;
}

// A pole grows from the center (length 0) toward the rim (length RIM_RADIUS).
export function createPole(laneIndex) {
  return {
    laneIndex,
    length: 0,
    active: true,
  };
}

export function updatePole(pole, dt) {
  pole.length = Math.min(RIM_RADIUS, pole.length + POLE_GROWTH_RATE * (dt / 1000));
}
