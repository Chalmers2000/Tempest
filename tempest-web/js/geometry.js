// Lane/ring projection helpers for the pseudo-3D tube.
//
// A "lane" is the wedge between spoke N and spoke N+1, not the spoke line
// itself - entities sit in the middle of that wedge (getLaneCenterPosition),
// while getRimPosition (at a boundary index) is only for drawing the spoke
// lines that mark the wedge boundaries.
//
// Positions are driven by the active CompiledArena (arena.js): its
// rimCenters/rimBoundaries are normalized [0,1] points on the arena's rim
// path. A depth/radius maps to a lerp fraction t between the vanishing point
// and a rim point - straight spokes, so rings are nested scaled copies of
// the rim (circles, squares, U's, W's, lines all share this one code path).

import { GAME_HEIGHT } from './config.js';

let activeArena = null;

export function setActiveArena(compiled) {
  activeArena = compiled;
}

// Boundary count/topology of the active arena, so renderer.js can draw the
// rim path generically instead of assuming LANE_COUNT circular spokes.
export function getActiveArenaBoundaryCount() {
  return activeArena.rimBoundaries.length;
}

export function isActiveArenaClosed() {
  return activeArena.closed;
}

// Same "largest safe extent" the renderer uses for its vanishing-point
// radius (renderer.js getTubeGeometry), recomputed here so normalized rim
// points can be mapped into pixel space without changing this module's
// call signatures to also thread the render radius through.
function getRenderRadius(centerX, centerY) {
  return Math.min(centerX, centerY, GAME_HEIGHT - centerY);
}

function toPixel(normalizedPoint, centerX, centerY, renderRadius) {
  const box = renderRadius * 2;
  const originX = centerX - renderRadius;
  const originY = centerY - renderRadius;
  return { x: originX + normalizedPoint.x * box, y: originY + normalizedPoint.y * box };
}

// Lerps from the vanishing point toward a rim point by t = radius/renderRadius,
// so callers passing a partial depth-derived radius land on the correctly
// scaled nested ring, and callers passing the full render radius land
// exactly on the rim point.
function projectRimPoint(normalizedPoint, centerX, centerY, radius) {
  const renderRadius = getRenderRadius(centerX, centerY);
  const rimPixel = toPixel(normalizedPoint, centerX, centerY, renderRadius);
  const t = renderRadius === 0 ? 0 : radius / renderRadius;
  return {
    x: centerX + (rimPixel.x - centerX) * t,
    y: centerY + (rimPixel.y - centerY) * t,
  };
}

// Advances a lane index by delta: closed arenas wrap around, open arenas
// clamp at both ends (index 0 and laneCount-1).
export function stepLane(index, delta, laneCount) {
  const next = index + delta;
  if (activeArena && !activeArena.closed) {
    return Math.max(0, Math.min(laneCount - 1, next));
  }
  return ((next % laneCount) + laneCount) % laneCount;
}

// Back-compat shim (pre-dates topology): normalizes an arbitrary index into
// range, wrapping for closed arenas and clamping for open ones.
export function wrapLane(index, laneCount) {
  if (activeArena && !activeArena.closed) {
    return Math.max(0, Math.min(laneCount - 1, index));
  }
  return ((index % laneCount) + laneCount) % laneCount;
}

export function getRimPosition(boundaryIndex, laneCount, centerX, centerY, radius) {
  const point = activeArena.rimBoundaries[boundaryIndex];
  return projectRimPoint(point, centerX, centerY, radius);
}

export function getLaneCenterPosition(laneIndex, laneCount, centerX, centerY, radius) {
  const point = activeArena.rimCenters[laneIndex];
  return projectRimPoint(point, centerX, centerY, radius);
}
