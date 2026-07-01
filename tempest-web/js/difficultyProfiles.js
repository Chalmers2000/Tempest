// Difficulty profile definitions. Consumed by the spawn director and player
// tuning once those systems come online (Phase 7).

export const DIFFICULTY_PROFILES = {
  Relaxed: {
    name: 'Relaxed',
    enemySpeedScale: 0.75,
    spawnRateScale: 0.7,
    enemyProjectileChanceScale: 0.5,
    maxSimultaneousEnemies: 6,
    blasterChargeStart: 4,
    playerFireCooldownScale: 0.85,
    respawnInvulnerabilityMs: 2200,
    laneStepSensitivityScale: 1.1,
    aimAssistWindowMs: 90,
    perLevelSpeedIncrement: 0.03,
    perLevelSpawnIncrement: 0.03,
    minSpawnIntervalMs: 700,
    maxEnemySpeed: 260,
    maxEnemyProjectiles: 4,
  },
  Standard: {
    name: 'Standard',
    enemySpeedScale: 1.0,
    spawnRateScale: 1.0,
    enemyProjectileChanceScale: 1.0,
    maxSimultaneousEnemies: 9,
    blasterChargeStart: 3,
    playerFireCooldownScale: 1.0,
    respawnInvulnerabilityMs: 1500,
    laneStepSensitivityScale: 1.0,
    aimAssistWindowMs: 0,
    perLevelSpeedIncrement: 0.06,
    perLevelSpawnIncrement: 0.06,
    minSpawnIntervalMs: 500,
    maxEnemySpeed: 340,
    maxEnemyProjectiles: 6,
  },
  Arcade: {
    name: 'Arcade',
    enemySpeedScale: 1.3,
    spawnRateScale: 1.35,
    enemyProjectileChanceScale: 1.4,
    maxSimultaneousEnemies: 14,
    blasterChargeStart: 2,
    playerFireCooldownScale: 1.1,
    respawnInvulnerabilityMs: 1000,
    laneStepSensitivityScale: 0.95,
    aimAssistWindowMs: 0,
    perLevelSpeedIncrement: 0.1,
    perLevelSpawnIncrement: 0.1,
    minSpawnIntervalMs: 320,
    maxEnemySpeed: 480,
    maxEnemyProjectiles: 10,
  },
  Custom: {
    name: 'Custom',
    enemySpeedScale: 1.0,
    spawnRateScale: 1.0,
    enemyProjectileChanceScale: 1.0,
    maxSimultaneousEnemies: 9,
    blasterChargeStart: 3,
    playerFireCooldownScale: 1.0,
    respawnInvulnerabilityMs: 1500,
    laneStepSensitivityScale: 1.0,
    aimAssistWindowMs: 0,
    perLevelSpeedIncrement: 0.06,
    perLevelSpawnIncrement: 0.06,
    minSpawnIntervalMs: 500,
    maxEnemySpeed: 340,
    maxEnemyProjectiles: 6,
  },
};

export const DEFAULT_PROFILE_NAME = 'Standard';

export function getProfile(name) {
  return DIFFICULTY_PROFILES[name] ?? DIFFICULTY_PROFILES[DEFAULT_PROFILE_NAME];
}
