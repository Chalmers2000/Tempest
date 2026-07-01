// Canvas renderer. Phase 1: background clear + placeholder tube geometry so
// the boot/title screen isn't a blank rectangle. Entity/HUD rendering layers
// are added in their respective phases.

import { GAME_WIDTH, GAME_HEIGHT, LANE_COUNT, RIM_RADIUS, BLASTER_FLASH_DURATION_MS } from './config.js';
import { getRimPosition } from './geometry.js';

let ctx = null;

export function initRenderer(canvas) {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  ctx = canvas.getContext('2d');
  return ctx;
}

export function render(_state, player, projectiles, enemies, blasterFlashMs) {
  if (!ctx) return;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawPlaceholderTube();
  drawPlayer(player);
  drawEnemies(enemies);
  drawProjectiles(projectiles);
  drawBlasterFlash(blasterFlashMs);
}

function drawBlasterFlash(blasterFlashMs) {
  if (!blasterFlashMs || blasterFlashMs <= 0) return;

  const alpha = Math.min(1, blasterFlashMs / BLASTER_FLASH_DURATION_MS) * 0.6;
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawPlaceholderTube() {
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const rings = [60, 140, 240, RIM_RADIUS];

  ctx.strokeStyle = 'rgba(51, 255, 240, 0.35)';
  ctx.lineWidth = 1.5;

  for (const radius of rings) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < LANE_COUNT; i += 1) {
    const pos = getRimPosition(i, LANE_COUNT, cx, cy, RIM_RADIUS);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
}

function drawProjectiles(projectiles) {
  if (!projectiles || projectiles.length === 0) return;

  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;

  for (const projectile of projectiles) {
    const pos = getRimPosition(projectile.laneIndex, LANE_COUNT, cx, cy, projectile.depth);
    ctx.fillStyle = projectile.owner === 'player' ? '#33fff0' : '#ff5566';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies(enemies) {
  if (!enemies || enemies.length === 0) return;

  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;

  for (const enemy of enemies) {
    const pos = getRimPosition(enemy.laneIndex, LANE_COUNT, cx, cy, enemy.depth);
    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (enemy.type === 'crawler') {
      ctx.fillStyle = '#33ff66';
      ctx.fillRect(-7, -7, 14, 14);
    } else if (enemy.type === 'jumper') {
      ctx.fillStyle = '#ffaa33';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
    } else if (enemy.type === 'shooter') {
      ctx.fillStyle = '#ff3355';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawPlayer(player) {
  if (!player || !player.isAlive) return;

  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const pos = getRimPosition(player.laneIndex, LANE_COUNT, cx, cy, RIM_RADIUS);
  const angleToCenter = Math.atan2(cy - pos.y, cx - pos.x);

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angleToCenter);
  ctx.globalAlpha = player.invulnerabilityMs > 0 ? 0.5 : 1;
  ctx.fillStyle = '#ffee33';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, 8);
  ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
