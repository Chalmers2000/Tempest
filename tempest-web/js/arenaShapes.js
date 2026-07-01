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

// Full box width, but at y=0.8 rather than the very bottom edge (y=1). Lane
// width is really the *angle* each lane subtends at the vanishing point, and
// that angle grows as the rim gets closer to the vanishing point's height
// (0.5) - y=1 only subtends ~90°, cramping every lane, while y=0.8 subtends
// ~120°, much closer to how roomy Circle/Box's full 360° spread feels. Not
// closer still: near y=0.5 the two halves of the line collapse back toward
// the flat, edge-on look this shape started with. Point order (not just
// position) matters: increasing lane index walks the path in listed order,
// and entities.js's mouse-direction convention was tuned against the
// circle's cos/sin winding (increasing index = clockwise) - listing
// right-to-left keeps "mouse right -> ship right" consistent with the
// circle instead of inverted. Open (not closed): both endpoints are real,
// distinct boundaries that movement clamps at instead of wrapping.
const LINE_PATH = [
  { x: 1, y: 0.8 },
  { x: 0, y: 0.8 },
];

// Straight arms down to a rounded (not flat) bottom curve that dips deeper
// in the middle than at the arm sides - reads as an actual "U" instead of a
// three-sided box. Full box width (like Circle/Box's full extent, not a
// shrunken inset) so lanes get the same angular spread/screen real estate;
// arm tops stay just below y=0.5 (not past it) so the vanishing point stays
// clear. Same right-to-left winding as the other open shapes for consistent
// mouse feel.
function buildUPath() {
  const armTopY = 0.55;
  const curveTopY = 0.75;
  const curveBottomY = 1.0;
  const leftX = 0;
  const rightX = 1;
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

// Two V-notches (a "W"): outer peaks at the box's full width (matching U's
// full-width extent), two valleys, and a shorter middle peak - kept below
// y=0.5 like U so it never crosses the vanishing point.
const W_PATH = [
  { x: 1, y: 0.55 },
  { x: 0.7, y: 1.0 },
  { x: 0.5, y: 0.75 },
  { x: 0.3, y: 1.0 },
  { x: 0, y: 0.55 },
];

export const ARENA_SHAPES = {
  circle: { id: 'circle', label: 'Circle', closed: true, path: buildCirclePath() },
  square: { id: 'square', label: 'Box', closed: true, path: SQUARE_PATH },
  u: { id: 'u', label: 'U', closed: false, path: U_PATH },
  w: { id: 'w', label: 'W', closed: false, path: W_PATH },
  line: { id: 'line', label: 'Line', closed: false, path: LINE_PATH },
};

export const ARENA_SHAPE_ORDER = ['circle', 'square', 'u', 'w', 'line'];
