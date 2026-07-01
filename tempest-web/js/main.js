// Main game loop and top-level orchestration. The selected difficulty
// profile (Relaxed/Standard/Arcade/Custom) drives player tuning, enemy
// speed/spawn scaling, enemy-type unlock gating, and aim assist; level
// progression is a kill-quota clear that ramps profile-scaled tuning further
// each level. See js/config.js and js/difficultyProfiles.js for tuning.

import {
  FIXED_TIMESTEP_MS,
  START_LIVES,
  START_BLASTER_CHARGES,
  PLAYER_DEATH_DURATION_MS,
  SCORE_BY_ENEMY_TYPE,
  BLASTER_FLASH_DURATION_MS,
  BLASTER_INVULN_MS,
  ENEMY_SPAWN_INTERVAL_MS,
  ENEMY_BASE_SPEED,
  LEVEL_CLEAR_DURATION_MS,
  LEVEL_KILL_QUOTA_BASE,
  LEVEL_KILL_QUOTA_PER_LEVEL,
  LEVEL_CLEAR_BONUS_PER_LEVEL,
  LANE_COUNT,
} from './config.js';
import { GameStates, setState, getState, getStateElapsedMs, onStateChange } from './gameState.js';
import { initRenderer, render } from './renderer.js';
import { setActiveArena } from './geometry.js';
import { compileArena } from './arena.js';
import { ARENA_SHAPES } from './arenaShapes.js';
import {
  initUI,
  updateHUD,
  syncOverlaysToState,
  setFinalScore,
  setLevelClearBonus,
  getSelectedProfileName,
  getSelectedShapeId,
  getSelectedShapeLabel,
  getPolesEnabled,
} from './ui.js';
import { getProfile } from './difficultyProfiles.js';
import { playShoot, playEnemyDeath, playPlayerDeath, playBlaster } from './audio.js';
import {
  attachInput,
  getDeltaX,
  consumeClickEdge,
  consumeSpaceEdge,
  consumePauseEdge,
  consumeResumeEdge,
  requestPointerLock,
  isFireHeld,
} from './input.js';
import {
  createPlayer,
  updatePlayerMovement,
  updatePlayerCooldown,
  updatePlayerInvulnerability,
  tryConsumePlayerShot,
  tryConsumeBlasterCharge,
  createProjectile,
  updateProjectile,
  updateEnemy,
  updatePole,
  respawnPlayer,
} from './entities.js';
import { createSpawnDirector, updateSpawner, createPoleDirector, updatePoleDirector } from './spawner.js';
import {
  resolvePlayerShotsVsEnemies,
  resolveEnemyShotsVsPlayer,
  resolveEnemyRimReachVsPlayer,
  resolvePlayerShotsVsPoles,
} from './collision.js';

let player = null;
let canvas = null;
let projectiles = [];
let enemies = [];
let poles = [];
let spawnDirector = null;
let poleDirector = null;
let score = 0;
let level = 1;
let blasterFlashMs = 0;
let activeProfile = null;
let levelTuning = null;
let killsThisLevel = 0;
let levelKillQuota = 0;
let polesEnabled = false;

function boot() {
  canvas = document.getElementById('gameCanvas');

  initRenderer(canvas);
  initUI();
  attachInput(canvas);

  // Circle so the title-screen tube has something to draw before the first
  // startGame() call installs whatever shape the player has selected.
  setActiveArena(compileArena(ARENA_SHAPES.circle, LANE_COUNT));

  setupArenaSelfTest();

  // Pointer Lock must be requested synchronously within (or very close to)
  // the click gesture to be reliably granted - the deferred, flag-based
  // request in update() below is not close enough on every browser.
  canvas.addEventListener('click', () => {
    if (getState() === GameStates.TITLE || getState() === GameStates.PLAYING) {
      requestPointerLock(canvas);
    }
  });

  onStateChange((nextState) => {
    syncOverlaysToState(nextState);
    if (nextState === GameStates.GAME_OVER) {
      setFinalScore(score);
    }
  });

  setState(GameStates.BOOT);
  setState(GameStates.TITLE);

  startLoop();
}

function startLoop() {
  let accumulator = 0;
  let lastTime = performance.now();

  function frame(now) {
    const frameTime = Math.min(now - lastTime, 250);
    lastTime = now;
    accumulator += frameTime;

    while (accumulator >= FIXED_TIMESTEP_MS) {
      update(FIXED_TIMESTEP_MS);
      accumulator -= FIXED_TIMESTEP_MS;
    }

    updateHUD({
      score,
      lives: player ? player.lives : START_LIVES,
      level,
      blasterCharges: player ? player.blasterCharges : START_BLASTER_CHARGES,
      profileName: activeProfile ? activeProfile.name : getSelectedProfileName(),
      shapeLabel: getSelectedShapeLabel(),
    });
    render(getState(), player, projectiles, enemies, blasterFlashMs, poles);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// Speed/spawn-rate ramp with level on top of the profile's own baseline,
// capped by the profile's stated hard limits (maxEnemySpeed/minSpawnIntervalMs).
function computeLevelTuning(profile, currentLevel) {
  const levelIndex = currentLevel - 1;
  const speedScale = profile.enemySpeedScale + profile.perLevelSpeedIncrement * levelIndex;
  const spawnScale = profile.spawnRateScale + profile.perLevelSpawnIncrement * levelIndex;

  return {
    profile,
    enemySpeedMultiplier: Math.min(speedScale, profile.maxEnemySpeed / ENEMY_BASE_SPEED),
    enemyFireRateMultiplier: profile.enemyProjectileChanceScale,
    spawnIntervalMs: Math.max(profile.minSpawnIntervalMs, ENEMY_SPAWN_INTERVAL_MS / spawnScale),
    maxSimultaneousEnemies: profile.maxSimultaneousEnemies,
    maxEnemyProjectiles: profile.maxEnemyProjectiles,
    // aimAssistWindowMs is a forgiveness *time*; converting it via enemy speed
    // gives "how far the enemy could have drifted and still count as a hit".
    aimAssistTolerance: ENEMY_BASE_SPEED * (profile.aimAssistWindowMs / 1000),
  };
}

function computeKillQuota(currentLevel) {
  return LEVEL_KILL_QUOTA_BASE + LEVEL_KILL_QUOTA_PER_LEVEL * (currentLevel - 1);
}

function update(dt) {
  const deltaX = getDeltaX();
  const clicked = consumeClickEdge();
  const spacePressed = consumeSpaceEdge();
  const pausePressed = consumePauseEdge();
  const resumePressed = consumeResumeEdge();

  const state = getState();

  if (state === GameStates.TITLE) {
    if (clicked) {
      startGame();
    }
    return;
  }

  if (state === GameStates.GAME_OVER) {
    if (clicked) {
      startGame();
    }
    return;
  }

  if (state === GameStates.PAUSED) {
    if (resumePressed) {
      setState(GameStates.PLAYING);
    }
    return;
  }

  if (state === GameStates.PLAYER_DEATH) {
    if (getStateElapsedMs() >= PLAYER_DEATH_DURATION_MS) {
      respawnPlayer(player);
      setState(GameStates.PLAYING);
    }
    return;
  }

  if (state === GameStates.LEVEL_CLEAR) {
    if (getStateElapsedMs() >= LEVEL_CLEAR_DURATION_MS) {
      advanceLevel();
      setState(GameStates.PLAYING);
    }
    return;
  }

  if (state === GameStates.PLAYING) {
    if (pausePressed) {
      setState(GameStates.PAUSED);
      return;
    }

    updatePlayerMovement(player, deltaX);
    updatePlayerCooldown(player, dt);
    updatePlayerInvulnerability(player, dt);
    blasterFlashMs = Math.max(0, blasterFlashMs - dt);

    if (isFireHeld() && tryConsumePlayerShot(player)) {
      projectiles.push(createProjectile('player', player.laneIndex));
      playShoot();
    }

    if (spacePressed && tryConsumeBlasterCharge(player)) {
      activateBlaster();
    }

    for (const projectile of projectiles) {
      updateProjectile(projectile, dt);
    }

    updateSpawner(spawnDirector, dt, enemies, levelTuning, level);
    for (const enemy of enemies) {
      updateEnemy(enemy, dt, (firingEnemy) => {
        const activeEnemyShots = projectiles.filter((p) => p.owner === 'enemy' && p.active).length;
        if (activeEnemyShots < levelTuning.maxEnemyProjectiles) {
          projectiles.push(createProjectile('enemy', firingEnemy.laneIndex, firingEnemy.depth));
        }
      });
    }

    if (polesEnabled) {
      updatePoleDirector(poleDirector, dt, poles, level);
      for (const pole of poles) {
        updatePole(pole, dt);
      }
      resolvePlayerShotsVsPoles(projectiles, poles);
    }

    resolvePlayerShotsVsEnemies(projectiles, enemies, onEnemyKilled, levelTuning.aimAssistTolerance, poles);
    resolveEnemyShotsVsPlayer(player, projectiles, onPlayerHit);
    resolveEnemyRimReachVsPlayer(player, enemies, onPlayerHit);

    projectiles = projectiles.filter((projectile) => projectile.active);
    enemies = enemies.filter((enemy) => enemy.hp > 0 && !enemy.reachedRim);
    poles = poles.filter((pole) => pole.active && pole.length > 0);

    if (killsThisLevel >= levelKillQuota) {
      const bonus = LEVEL_CLEAR_BONUS_PER_LEVEL * level;
      score += bonus;
      setLevelClearBonus(bonus);
      setState(GameStates.LEVEL_CLEAR);
    }
  }
}

function onEnemyKilled(enemy) {
  score += SCORE_BY_ENEMY_TYPE[enemy.type] ?? 0;
  killsThisLevel += 1;
  playEnemyDeath();
}

// Clears all enemies, enemy projectiles, and poles (player shots are left
// alone - they aren't a threat). No score for blaster kills; it's a panic
// button, not a scoring strategy.
function activateBlaster() {
  enemies = [];
  poles = [];
  projectiles = projectiles.filter((projectile) => projectile.owner !== 'enemy');
  blasterFlashMs = BLASTER_FLASH_DURATION_MS;
  player.invulnerabilityMs = Math.max(player.invulnerabilityMs, BLASTER_INVULN_MS);
  playBlaster();
}

function onPlayerHit() {
  player.isAlive = false;
  player.lives -= 1;
  playPlayerDeath();
  setState(player.lives > 0 ? GameStates.PLAYER_DEATH : GameStates.GAME_OVER);
}

function advanceLevel() {
  level += 1;
  levelTuning = computeLevelTuning(activeProfile, level);
  spawnDirector = createSpawnDirector(levelTuning);
  enemies = [];
  projectiles = [];
  poles = [];
  poleDirector = createPoleDirector();
  killsThisLevel = 0;
  levelKillQuota = computeKillQuota(level);
  player.blasterCharges = activeProfile.blasterChargeStart;
}

function startGame() {
  activeProfile = getProfile(getSelectedProfileName());
  // ui.js already validates the selection against known shape ids, but this
  // stays as a defensive fallback so a corrupted id can never crash startGame().
  const shape = ARENA_SHAPES[getSelectedShapeId()] ?? ARENA_SHAPES.circle;
  setActiveArena(compileArena(shape, LANE_COUNT));
  player = createPlayer(activeProfile);
  projectiles = [];
  enemies = [];
  poles = [];
  polesEnabled = getPolesEnabled();
  poleDirector = createPoleDirector();
  score = 0;
  level = 1;
  levelTuning = computeLevelTuning(activeProfile, level);
  spawnDirector = createSpawnDirector(levelTuning);
  killsThisLevel = 0;
  levelKillQuota = computeKillQuota(level);
  blasterFlashMs = 0;
  setState(GameStates.LEVEL_START);
  setState(GameStates.PLAYING);
}

// Dev-only console harness for verifying arena compilation (Arena_Geometry_Test_Plan.md
// §6), active only behind ?selftest so it never touches normal play. Dynamic
// imports keep this path isolated from the module graph startGame() already uses.
function setupArenaSelfTest() {
  if (!new URLSearchParams(window.location.search).has('selftest')) return;

  Promise.all([import('./arena.js'), import('./arenaShapes.js')]).then(
    ([{ compileArena: compile, totalLength }, { ARENA_SHAPES: shapes, ARENA_SHAPE_ORDER: order }]) => {
      window.__arenaSelfTest = {
        compileArena: compile,
        totalLength,
        ARENA_SHAPES: shapes,
        ARENA_SHAPE_ORDER: order,
        LANE_COUNT,
      };
    }
  );
}

boot();
