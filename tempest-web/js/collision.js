// Collision system: player shots vs enemies, enemy shots vs player, and
// enemy bodies reaching the rim in the player's lane. Uses same-lane +
// depth-overlap-within-tolerance, which is simple and stable rather than a
// true swept test - adequate at these speeds/timestep.

import { RIM_RADIUS, HIT_DEPTH_TOLERANCE } from './config.js';

// extraTolerance widens the depth-overlap window (Relaxed/Custom profiles'
// aimAssistWindowMs, pre-converted to a distance by the caller).
export function resolvePlayerShotsVsEnemies(projectiles, enemies, onEnemyKilled, extraTolerance = 0) {
  for (const projectile of projectiles) {
    if (!projectile.active || projectile.owner !== 'player') continue;

    for (const enemy of enemies) {
      if (enemy.reachedRim || enemy.hp <= 0) continue;
      if (enemy.laneIndex !== projectile.laneIndex) continue;
      if (Math.abs(enemy.depth - projectile.depth) > HIT_DEPTH_TOLERANCE + extraTolerance) continue;

      projectile.active = false;
      enemy.hp -= 1;
      if (enemy.hp <= 0) {
        onEnemyKilled(enemy);
      }
      break; // this projectile is spent, stop checking other enemies
    }
  }
}

// Enemy shots are resolved at the rim: if they reach the player's lane, it's
// a hit; otherwise they simply expire there as a miss. This is also where
// enemy projectiles get deactivated at the rim (movement alone doesn't).
export function resolveEnemyShotsVsPlayer(player, projectiles, onPlayerHit) {
  for (const projectile of projectiles) {
    if (!projectile.active || projectile.owner !== 'enemy') continue;
    if (projectile.depth < RIM_RADIUS - HIT_DEPTH_TOLERANCE) continue;

    projectile.active = false;
    if (projectile.laneIndex === player.laneIndex && player.isAlive && player.invulnerabilityMs <= 0) {
      onPlayerHit();
    }
  }
}

export function resolveEnemyRimReachVsPlayer(player, enemies, onPlayerHit) {
  if (!player.isAlive || player.invulnerabilityMs > 0) return;

  for (const enemy of enemies) {
    if (enemy.reachedRim && enemy.laneIndex === player.laneIndex) {
      onPlayerHit();
      return;
    }
  }
}
