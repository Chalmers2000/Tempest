// DOM/HUD binding: overlay show/hide driven by game state, HUD text driven
// by live score/lives/level/blaster/profile data from main.js, plus the
// title screen's difficulty profile selector (persisted to localStorage).

import { GameStates } from './gameState.js';
import { START_LIVES, START_BLASTER_CHARGES } from './config.js';
import {
  DIFFICULTY_PROFILES,
  loadSavedProfileName,
  saveProfileName,
  loadCustomOverrides,
  saveCustomOverrides,
} from './difficultyProfiles.js';

const POLES_STORAGE_KEY = 'tempest.polesEnabled';

let elements = null;
let selectedProfileName = 'Standard';
let polesEnabled = false;

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
    levelClearOverlay: document.getElementById('levelClearOverlay'),
    finalScore: document.getElementById('finalScore'),
    levelClearBonus: document.getElementById('levelClearBonus'),
    difficultyPanel: document.getElementById('difficultyPanel'),
    profileButtons: Array.from(document.querySelectorAll('.profile-button')),
    customPanel: document.getElementById('customPanel'),
    customEnemySpeed: document.getElementById('customEnemySpeed'),
    customSpawnRate: document.getElementById('customSpawnRate'),
    polesToggle: document.getElementById('polesToggle'),
  };

  // The difficulty panel sits inside the title overlay, and any click on the
  // overlay is otherwise treated as "click to start" (input.js listens on
  // window) - stop it here so picking a profile/dragging a slider doesn't
  // also launch the game.
  elements.difficultyPanel.addEventListener('mousedown', (e) => e.stopPropagation());

  initDifficultyPanel();

  updateHUD({
    score: 0,
    lives: START_LIVES,
    level: 1,
    blasterCharges: START_BLASTER_CHARGES,
    profileName: selectedProfileName,
  });
}

function initDifficultyPanel() {
  selectedProfileName = loadSavedProfileName();

  const customOverrides = loadCustomOverrides();
  elements.customEnemySpeed.value = customOverrides.enemySpeedScale ?? DIFFICULTY_PROFILES.Custom.enemySpeedScale;
  elements.customSpawnRate.value = customOverrides.spawnRateScale ?? DIFFICULTY_PROFILES.Custom.spawnRateScale;

  for (const button of elements.profileButtons) {
    button.addEventListener('click', () => selectProfile(button.dataset.profile));
  }

  elements.customEnemySpeed.addEventListener('input', saveCustomSliderValues);
  elements.customSpawnRate.addEventListener('input', saveCustomSliderValues);

  polesEnabled = loadPolesEnabled();
  elements.polesToggle.checked = polesEnabled;
  elements.polesToggle.addEventListener('change', () => {
    polesEnabled = elements.polesToggle.checked;
    savePolesEnabled(polesEnabled);
  });

  refreshDifficultyPanelUI();
}

function loadPolesEnabled() {
  try {
    return localStorage.getItem(POLES_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function savePolesEnabled(value) {
  try {
    localStorage.setItem(POLES_STORAGE_KEY, String(value));
  } catch {
    // localStorage unavailable - toggle just won't persist.
  }
}

export function getPolesEnabled() {
  return polesEnabled;
}

function selectProfile(name) {
  selectedProfileName = name;
  saveProfileName(name);

  // Sync the Custom sliders to whichever preset was just picked, so if the
  // user switches to Custom next, it starts from that preset's values
  // instead of wherever the sliders were last left.
  if (name !== 'Custom') {
    const preset = DIFFICULTY_PROFILES[name];
    elements.customEnemySpeed.value = preset.enemySpeedScale;
    elements.customSpawnRate.value = preset.spawnRateScale;
    saveCustomSliderValues();
  }

  refreshDifficultyPanelUI();
}

function refreshDifficultyPanelUI() {
  for (const button of elements.profileButtons) {
    button.classList.toggle('active', button.dataset.profile === selectedProfileName);
  }
  setHidden(elements.customPanel, selectedProfileName !== 'Custom');
}

function saveCustomSliderValues() {
  saveCustomOverrides({
    enemySpeedScale: Number(elements.customEnemySpeed.value),
    spawnRateScale: Number(elements.customSpawnRate.value),
  });
}

export function getSelectedProfileName() {
  return selectedProfileName;
}

export function updateHUD(data) {
  if (!elements) return;
  elements.score.textContent = `Score: ${data.score}`;
  elements.lives.textContent = `Lives: ${data.lives}`;
  elements.level.textContent = `Level: ${data.level}`;
  elements.blaster.textContent = `Blaster: ${data.blasterCharges}`;
  elements.profile.textContent = `Profile: ${data.profileName}`;
}

export function setFinalScore(score) {
  if (!elements) return;
  elements.finalScore.textContent = `Final Score: ${score}`;
}

export function setLevelClearBonus(bonus) {
  if (!elements) return;
  elements.levelClearBonus.textContent = `Bonus: +${bonus}`;
}

export function syncOverlaysToState(state) {
  if (!elements) return;
  setHidden(elements.titleOverlay, state !== GameStates.TITLE);
  setHidden(elements.gameOverOverlay, state !== GameStates.GAME_OVER);
  setHidden(elements.pauseOverlay, state !== GameStates.PAUSED);
  setHidden(elements.levelClearOverlay, state !== GameStates.LEVEL_CLEAR);
}

function setHidden(element, hidden) {
  element.classList.toggle('hidden', hidden);
}
