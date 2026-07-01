// Arena shape data: each shape is a rim path (ordered {x,y} points in a
// normalized [0,1] box, (0.5,0.5) = center) plus a closed flag. Closed paths
// (circle/square) are loops; open paths (u/w/line) are clamped at both ends.
// arena.js turns a shape into a CompiledArena (lane centers/boundaries).

import { CIRCLE_PATH_SEGMENTS } from './config.js';

// Polygon approximation of a centered unit circle. Keeping the circle on the
// same polygon-path code path as every other shape means arc-length sampling
// (arena.js) reproduces today's even angular lane spacing to sub-pixel
// accuracy, instead of needing a separate trig-based lane layout for circles.
export function buildCirclePath(segments = CIRCLE_PATH_SEGMENTS) {
  const path = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    path.push({
      x: 0.5 + Math.cos(angle) * 0.5,
      y: 0.5 + Math.sin(angle) * 0.5,
    });
  }
  return path;
}

// Corners of the normalized [0,1] box itself, so the square fills exactly
// the same "largest safe extent" as the circle - same footprint, no shape
// clips or reads smaller/larger than another at the same depth.
const SQUARE_PATH = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: 0, y: 0 },
];

// Straight across the *bottom* edge of the box, not through its center.
// The vanishing point sits at normalized (0.5, 0.5) for every shape (§4's
// pixel mapping), so a rim path has to stay clear of that point or spokes
// on either side of it collapse to near-zero length, reading as a flat
// line instead of a receding tube. Anchoring at the far edge (like the
// square's bottom edge) gives the same "vanishing point above, wide rim
// below" fan/perspective as the other shapes. Open (not closed): both
// endpoints are real, distinct boundaries that movement clamps at instead
// of wrapping.
// Point order (not just position) matters here: increasing lane index walks
// the path in listed order, and entities.js's mouse-direction convention was
// tuned against the circle's cos/sin winding (increasing index = clockwise).
// Listing right-to-left keeps "mouse right -> ship right" consistent with
// the circle instead of inverted.
const LINE_PATH = [
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

// Straight arms down to a rounded (not flat) bottom curve that dips deeper
// in the middle than at the arm sides - reads as an actual "U" instead of a
// three-sided box. Open at the top (arms don't reach past the vanishing
// point's y=0.5); same right-to-left winding as the other open shapes for
// consistent mouse feel.
function buildUPath() {
  const armTopY = 0.6;
  const curveTopY = 0.8;
  const curveBottomY = 1.0;
  const leftX = 0.2;
  const rightX = 0.8;
  const centerX = (leftX + rightX) / 2;
  const radiusX = (rightX - leftX) / 2;
  const radiusY = curveBottomY - curveTopY;
  const curveSegments = 6;

  const path = [{ x: rightX, y: armTopY }];
  for (let i = 0; i <= curveSegments; i += 1) {
    const theta = (i / curveSegments) * Math.PI;
    path.push({
      x: centerX + radiusX * Math.cos(theta),
      y: curveTopY + radiusY * Math.sin(theta),
    });
  }
  path.push({ x: leftX, y: armTopY });
  return path;
}

const U_PATH = buildUPath();

// Two V-notches (a "W"): outer peaks, two valleys, and a shorter middle
// peak - kept below y=0.5 like U so it never crosses the vanishing point.
const W_PATH = [
  { x: 0.85, y: 0.6 },
  { x: 0.65, y: 1.0 },
  { x: 0.5, y: 0.75 },
  { x: 0.35, y: 1.0 },
  { x: 0.15, y: 0.6 },
];

export const ARENA_SHAPES = {
  circle: { id: 'circle', label: 'Circle', closed: true, path: buildCirclePath() },
  square: { id: 'square', label: 'Box', closed: true, path: SQUARE_PATH },
  u: { id: 'u', label: 'U', closed: false, path: U_PATH },
  w: { id: 'w', label: 'W', closed: false, path: W_PATH },
  line: { id: 'line', label: 'Line', closed: false, path: LINE_PATH },
};

export const ARENA_SHAPE_ORDER = ['circle', 'square', 'u', 'w', 'line'];
