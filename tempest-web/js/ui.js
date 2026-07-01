// DOM/HUD binding. Phase 1: overlay show/hide driven by game state, HUD
// placeholders wired to static config defaults. Live values arrive as their
// owning systems come online.

import { GameStates } from './gameState.js';
import { START_LIVES, START_BLASTER_CHARGES } from './config.js';
import { DEFAULT_PROFILE_NAME } from './difficultyProfiles.js';

let elements = null;

export function initUI() {
  elements = {
    score: document.getElementById('hudScore'),
    lives: document.getElementById('hudLives'),
    level: document.getElementById('hudLevel'),
    blaster: document.getElementById('hudBlaster'),
    profile: document.getElementById('hudProfile'),
    titleOverlay: document.getElementById('titleOverlay'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    finalScore: document.getElementById('finalScore'),
  };

  updateHUD({
    score: 0,
    lives: START_LIVES,
    level: 1,
    blasterCharges: START_BLASTER_CHARGES,
    profileName: DEFAULT_PROFILE_NAME,
  });
}

export function updateHUD(data) {
  if (!elements) return;
  elements.score.textContent = `Score: ${data.score}`;
  elements.lives.textContent = `Lives: ${data.lives}`;
  elements.level.textContent = `Level: ${data.level}`;
  elements.blaster.textContent = `Blaster: ${data.blasterCharges}`;
  elements.profile.textContent = `Profile: ${data.profileName}`;
}

export function syncOverlaysToState(state) {
  if (!elements) return;
  setHidden(elements.titleOverlay, state !== GameStates.TITLE);
  setHidden(elements.gameOverOverlay, state !== GameStates.GAME_OVER);
  setHidden(elements.pauseOverlay, state !== GameStates.PAUSED);
}

function setHidden(element, hidden) {
  element.classList.toggle('hidden', hidden);
}
