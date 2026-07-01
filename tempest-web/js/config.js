// Centralized tuning constants. Difficulty-profile overrides live in difficultyProfiles.js.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const FIXED_TIMESTEP_MS = 1000 / 60;

export const LANE_COUNT = 19;
export const RIM_RADIUS = 360;

export const START_LIVES = 3;
export const START_BLASTER_CHARGES = 3;

export const MOUSE_SENSITIVITY = 0.75;
export const LANE_STEP_THRESHOLD = 45;
export const MAX_LANE_STEPS_PER_FRAME = 2;

export const PLAYER_FIRE_COOLDOWN_MS = 220;
export const PLAYER_PROJECTILE_SPEED = 900;

export const ENEMY_PROJECTILE_SPEED = 420;
export const ENEMY_BASE_SPEED = 140;
export const ENEMY_SPAWN_INTERVAL_MS = 1400;
export const JUMPER_JUMP_INTERVAL_MS = 900;
export const SHOOTER_FIRE_INTERVAL_MS = 1600;

export const PLAYER_DEATH_DURATION_MS = 1000;
export const HIT_DEPTH_TOLERANCE = 18;

export const BLASTER_FLASH_DURATION_MS = 300;
export const BLASTER_INVULN_MS = 300;

// Level clear is quota-based (kills), scaling up slightly each level. Actual
// speed/spawn-rate scaling per level comes from the selected difficulty
// profile's perLevelSpeedIncrement/perLevelSpawnIncrement (difficultyProfiles.js).
export const LEVEL_CLEAR_DURATION_MS = 1500;
export const LEVEL_KILL_QUOTA_BASE = 10;
export const LEVEL_KILL_QUOTA_PER_LEVEL = 4;
export const LEVEL_CLEAR_BONUS_PER_LEVEL = 500;

export const SCORE_BY_ENEMY_TYPE = {
  crawler: 100,
  jumper: 200,
  shooter: 300,
};

// Enemy Poles (experimental, toggle on the title screen): a growing white
// line up a lane that shields any enemy within its current length from
// player shots. Repeated shots into the lane (or a Super Blaster use) shrink
// or clear it; it caps at the rim and just sits there until destroyed.
export const POLE_MIN_LEVEL = 2;
export const MAX_SIMULTANEOUS_POLES = 2;
export const POLE_SPAWN_INTERVAL_MS = 6000;
export const POLE_GROWTH_RATE = 45;
export const POLE_SHRINK_PER_HIT = 90;
