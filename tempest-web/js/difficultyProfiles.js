// Difficulty profile definitions, consumed by player tuning, the spawn
// director, and level progression. Custom overrides + the last-selected
// profile persist to localStorage.

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
    jumperUnlockLevel: 2,
    shooterUnlockLevel: 4,
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
    jumperUnlockLevel: 1,
    shooterUnlockLevel: 2,
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
    jumperUnlockLevel: 1,
    shooterUnlockLevel: 1,
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
    jumperUnlockLevel: 1,
    shooterUnlockLevel: 2,
  },
};

export const DEFAULT_PROFILE_NAME = 'Standard';

const PROFILE_STORAGE_KEY = 'tempest.difficultyProfile';
const CUSTOM_STORAGE_KEY = 'tempest.customProfileOverrides';

export function getProfile(name) {
  const base = DIFFICULTY_PROFILES[name] ?? DIFFICULTY_PROFILES[DEFAULT_PROFILE_NAME];
  if (base.name !== 'Custom') return base;
  return { ...base, ...loadCustomOverrides() };
}

export function loadSavedProfileName() {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return saved && DIFFICULTY_PROFILES[saved] ? saved : DEFAULT_PROFILE_NAME;
  } catch {
    return DEFAULT_PROFILE_NAME;
  }
}

export function saveProfileName(name) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, name);
  } catch {
    // localStorage unavailable (private mode, etc.) - selection just won't persist.
  }
}

export function loadCustomOverrides() {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomOverrides(overrides) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage unavailable - custom sliders just won't persist.
  }
}
