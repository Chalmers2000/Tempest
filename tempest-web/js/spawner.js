// Enemy spawner + level data. Spawn interval, enemy cap, speed, fire rate,
// and which enemy types are unlocked all come from the active difficulty
// profile + current level (see main.js's computeLevelTuning).

import { createEnemy } from './entities.js';
import { LANE_COUNT, ENEMY_SPAWN_INTERVAL_MS } from './config.js';

const ENEMY_MIX = [
  ['crawler', 0.5],
  ['jumper', 0.3],
  ['shooter', 0.2],
];

export function createSpawnDirector(tuning) {
  return {
    timerMs: tuning.spawnIntervalMs,
  };
}

// Spawns are placed near center (handled by createEnemy), never at the rim,
// so the player always has travel time to react.
export function updateSpawner(director, dt, enemies, tuning, level) {
  director.timerMs -= dt;
  if (director.timerMs > 0) return;
  director.timerMs += tuning.spawnIntervalMs;

  if (enemies.length >= tuning.maxSimultaneousEnemies) return;

  const laneIndex = Math.floor(Math.random() * LANE_COUNT);
  const type = pickEnemyType(tuning.profile, level);
  enemies.push(createEnemy(type, laneIndex, tuning.enemySpeedMultiplier, tuning.enemyFireRateMultiplier));
}

// Types not yet unlocked at the current level have their weight redistributed
// to crawler, so early levels on stricter profiles (e.g. Relaxed) genuinely
// only see the basic enemy.
function pickEnemyType(profile, level) {
  const available = ENEMY_MIX.filter(
    ([type]) =>
      type === 'crawler' ||
      (type === 'jumper' && level >= profile.jumperUnlockLevel) ||
      (type === 'shooter' && level >= profile.shooterUnlockLevel),
  );

  const totalWeight = available.reduce((sum, [, weight]) => sum + weight, 0);
  const roll = Math.random() * totalWeight;

  let cumulative = 0;
  for (const [type, weight] of available) {
    cumulative += weight;
    if (roll <= cumulative) return type;
  }
  return 'crawler';
}
