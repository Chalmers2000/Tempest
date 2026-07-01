// Phase 4: enemy spawning + 3 enemy behaviors (crawler, jumper, shooter).
// Collision/scoring/lives are still no-ops until Phase 5 - enemies that
// reach the rim or get shot are just despawned for now.

import { FIXED_TIMESTEP_MS } from './config.js';
import { GameStates, setState, getState, onStateChange } from './gameState.js';
import { initRenderer, render } from './renderer.js';
import { initUI, syncOverlaysToState } from './ui.js';
import {
  attachInput,
  getDeltaX,
  consumeClickEdge,
  consumeSpaceEdge,
  requestPointerLock,
  isFireHeld,
} from './input.js';
import {
  createPlayer,
  updatePlayerMovement,
  updatePlayerCooldown,
  tryConsumePlayerShot,
  createProjectile,
  updateProjectile,
  updateEnemy,
} from './entities.js';
import { createSpawnDirector, updateSpawner } from './spawner.js';

let player = null;
let canvas = null;
let projectiles = [];
let enemies = [];
let spawnDirector = null;

function boot() {
  canvas = document.getElementById('gameCanvas');

  initRenderer(canvas);
  initUI();
  attachInput(canvas);

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

    render(getState(), player, projectiles, enemies);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function update(dt) {
  const deltaX = getDeltaX();
  const clicked = consumeClickEdge();
  consumeSpaceEdge(); // reserved for Phase 6 (super blaster)

  const state = getState();

  if (state === GameStates.TITLE) {
    if (clicked) {
      startGame();
    }
    return;
  }

  if (state === GameStates.PLAYING) {
    updatePlayerMovement(player, deltaX);
    updatePlayerCooldown(player, dt);

    if (isFireHeld() && tryConsumePlayerShot(player)) {
      projectiles.push(createProjectile('player', player.laneIndex));
    }

    for (const projectile of projectiles) {
      updateProjectile(projectile, dt);
    }
    projectiles = projectiles.filter((projectile) => projectile.active);

    updateSpawner(spawnDirector, dt, enemies);
    for (const enemy of enemies) {
      updateEnemy(enemy, dt, (firingEnemy) => {
        projectiles.push(createProjectile('enemy', firingEnemy.laneIndex, firingEnemy.depth));
      });
    }
    enemies = enemies.filter((enemy) => !enemy.reachedRim);
  }
}

function startGame() {
  player = createPlayer();
  projectiles = [];
  enemies = [];
  spawnDirector = createSpawnDirector();
  setState(GameStates.LEVEL_START);
  setState(GameStates.PLAYING);
}

boot();
