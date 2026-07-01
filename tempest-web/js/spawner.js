// Enemy spawner + level data. Difficulty-profile scaling of these values
// arrives in Phase 7; this is a single flat level config for now.

import { createEnemy } from './entities.js';
import { LANE_COUNT, ENEMY_SPAWN_INTERVAL_MS, MAX_SIMULTANEOUS_ENEMIES } from './config.js';

const ENEMY_MIX = [
  ['crawler', 0.5],
  ['jumper', 0.3],
  ['shooter', 0.2],
];

export function createSpawnDirector() {
  return {
    timerMs: ENEMY_SPAWN_INTERVAL_MS,
  };
}

// Spawns are placed near center (handled by createEnemy), never at the rim,
// so the player always has travel time to react.
export function updateSpawner(director, dt, enemies) {
  director.timerMs -= dt;
  if (director.timerMs > 0) return;
  director.timerMs += ENEMY_SPAWN_INTERVAL_MS;

  if (enemies.length >= MAX_SIMULTANEOUS_ENEMIES) return;

  const laneIndex = Math.floor(Math.random() * LANE_COUNT);
  enemies.push(createEnemy(pickEnemyType(), laneIndex));
}

function pickEnemyType() {
  const roll = Math.random();
  let cumulative = 0;
  for (const [type, weight] of ENEMY_MIX) {
    cumulative += weight;
    if (roll <= cumulative) return type;
  }
  return ENEMY_MIX[ENEMY_MIX.length - 1][0];
}
