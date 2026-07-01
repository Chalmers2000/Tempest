// Centralized tuning constants. Difficulty-profile overrides live in difficultyProfiles.js.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const FIXED_TIMESTEP_MS = 1000 / 60;

export const LANE_COUNT = 12;
export const RIM_RADIUS = 360;

export const START_LIVES = 3;
export const START_BLASTER_CHARGES = 3;

export const MOUSE_SENSITIVITY = 1.0;
export const LANE_STEP_THRESHOLD = 30;
export const MAX_LANE_STEPS_PER_FRAME = 3;

export const PLAYER_FIRE_COOLDOWN_MS = 220;
export const PLAYER_PROJECTILE_SPEED = 900;

export const ENEMY_PROJECTILE_SPEED = 420;
export const ENEMY_BASE_SPEED = 140;
export const ENEMY_SPAWN_INTERVAL_MS = 1400;
export const MAX_SIMULTANEOUS_ENEMIES = 8;
export const JUMPER_JUMP_INTERVAL_MS = 900;
export const SHOOTER_FIRE_INTERVAL_MS = 1600;

export const RESPAWN_INVULN_MS = 1500;

export const LEVEL_SPEED_SCALE = 1.08;
export const LEVEL_SPAWN_SCALE = 0.92;

export const SCORE_BY_ENEMY_TYPE = {
  crawler: 100,
  jumper: 200,
  shooter: 300,
};
