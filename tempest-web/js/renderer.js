// Canvas renderer. Draws a pseudo-3D tube: entities sit in the middle of
// their lane's wedge (between two spokes), not on a spoke line, and the two
// spokes bounding the player's current lane are highlighted. The vanishing
// point has a slight upward bias, but the render radius is *derived* from the
// canvas dimensions (not a hardcoded value) so the tube can never clip off
// the visible canvas regardless of GAME_WIDTH/GAME_HEIGHT.

import { GAME_WIDTH, GAME_HEIGHT, LANE_COUNT, RIM_RADIUS, BLASTER_FLASH_DURATION_MS } from './config.js';
import { getRimPosition, getLaneCenterPosition } from './geometry.js';

const TUBE_CENTER_Y_RATIO = 0.47;
const RING_DEPTH_FRACTIONS = [0.15, 0.35, 0.6, 1.0];
const MIN_ENTITY_SCALE = 0.45;

let ctx = null;

export function initRenderer(canvas) {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  ctx = canvas.getContext('2d');
  return ctx;
}

// radius is the largest circle centered at (cx, cy) that still fits fully
// inside the canvas - tangent to whichever edge is closest, never clipped.
function getTubeGeometry() {
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT * TUBE_CENTER_Y_RATIO;
  const radius = Math.min(cx, cy, GAME_HEIGHT - cy);
  return { cx, cy, radius };
}

// Maps a logical gameplay depth (0..RIM_RADIUS) to an on-screen radius
// (0..the tube's render radius), so the visual tube can be scaled/positioned
// independently of collision/movement math.
function toScreenRadius(depth, renderRadius) {
  return (depth / RIM_RADIUS) * renderRadius;
}

// Things near the vanishing point read as small and far away; things near
// the rim read as large and close.
function toEntityScale(depth) {
  const t = depth / RIM_RADIUS;
  return MIN_ENTITY_SCALE + (1 - MIN_ENTITY_SCALE) * t;
}

export function render(_state, player, projectiles, enemies, blasterFlashMs, poles) {
  if (!ctx) return;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawPlaceholderTube(player);
  drawPoles(poles);
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

function drawPlaceholderTube(player) {
  const { cx, cy, radius } = getTubeGeometry();

  ctx.strokeStyle = 'rgba(51, 255, 240, 0.35)';
  ctx.lineWidth = 1.5;
  for (const fraction of RING_DEPTH_FRACTIONS) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * fraction, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The two spokes bounding the player's current lane light up fully, so the
  // active lane reads clearly - the rest stay dim.
  const litSpokes = player ? new Set([player.laneIndex, (player.laneIndex + 1) % LANE_COUNT]) : new Set();

  for (let i = 0; i < LANE_COUNT; i += 1) {
    const pos = getRimPosition(i, LANE_COUNT, cx, cy, radius);
    ctx.strokeStyle = litSpokes.has(i) ? '#8dfff5' : 'rgba(51, 255, 240, 0.35)';
    ctx.lineWidth = litSpokes.has(i) ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
}

function drawPoles(poles) {
  if (!poles || poles.length === 0) return;

  const { cx, cy, radius } = getTubeGeometry();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  for (const pole of poles) {
    const tip = getLaneCenterPosition(pole.laneIndex, LANE_COUNT, cx, cy, toScreenRadius(pole.length, radius));
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
  }
}

function drawProjectiles(projectiles) {
  if (!projectiles || projectiles.length === 0) return;

  const { cx, cy, radius } = getTubeGeometry();

  for (const projectile of projectiles) {
    const pos = getLaneCenterPosition(projectile.laneIndex, LANE_COUNT, cx, cy, toScreenRadius(projectile.depth, radius));
    const scale = toEntityScale(projectile.depth);
    ctx.fillStyle = projectile.owner === 'player' ? '#33fff0' : '#ff5566';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies(enemies) {
  if (!enemies || enemies.length === 0) return;

  const { cx, cy, radius } = getTubeGeometry();

  for (const enemy of enemies) {
    const pos = getLaneCenterPosition(enemy.laneIndex, LANE_COUNT, cx, cy, toScreenRadius(enemy.depth, radius));
    const scale = toEntityScale(enemy.depth);
    // Points the shape along its outward direction of travel (away from the
    // vanishing point), the same way the player ship is rotated to face in.
    const angleAway = Math.atan2(pos.y - cy, pos.x - cx);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angleAway);
    ctx.scale(scale, scale);
    ctx.lineWidth = 1.5;

    if (enemy.type === 'crawler') {
      // Chevron arrowhead, tip leading outward - reads as "crawling forward".
      ctx.fillStyle = '#33ff66';
      ctx.strokeStyle = '#baffcf';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-1, 0);
      ctx.lineTo(-6, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.type === 'jumper') {
      // Bowtie/hourglass - the pinched waist reads as "can snap sideways".
      ctx.fillStyle = '#ffaa33';
      ctx.strokeStyle = '#ffe0b3';
      ctx.beginPath();
      ctx.moveTo(-9, -9);
      ctx.lineTo(9, -9);
      ctx.lineTo(-9, 9);
      ctx.lineTo(9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.type === 'shooter') {
      // Hexagonal turret with a bright core - communicates "armed".
      ctx.fillStyle = '#ff3355';
      ctx.strokeStyle = '#ffb3c0';
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i;
        const x = Math.cos(angle) * 10;
        const y = Math.sin(angle) * 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffe6ea';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawPlayer(player) {
  if (!player || !player.isAlive) return;

  const { cx, cy, radius } = getTubeGeometry();
  const pos = getLaneCenterPosition(player.laneIndex, LANE_COUNT, cx, cy, radius);
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
