// Compiles a raw arena shape (arenaShapes.js) into evenly-arc-length-spaced
// lane centers/boundaries. Lanes are distributed by arc length (not point
// index) so uneven point spacing in hand-authored paths (e.g. U/W corners)
// doesn't bunch or stretch lanes.

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function totalLength(path, closed) {
  let length = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    length += distance(path[i], path[i + 1]);
  }
  if (closed) {
    length += distance(path[path.length - 1], path[0]);
  }
  return length;
}

// Walks the path's segments (wrapping the last->first segment when closed)
// summing lengths until the target arc length s falls within one, then
// lerps within that segment. s is clamped to the path's own length, so a
// caller landing exactly on (or just past, via float error) the final
// endpoint still resolves to that endpoint instead of falling through.
export function pointAtArcLength(path, closed, s) {
  const segmentCount = closed ? path.length : path.length - 1;
  let remaining = s;

  for (let i = 0; i < segmentCount; i += 1) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    const segmentLength = distance(a, b);
    const isLastSegment = i === segmentCount - 1;

    if (remaining <= segmentLength || isLastSegment) {
      const t = segmentLength === 0 ? 0 : Math.max(0, Math.min(1, remaining / segmentLength));
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }

    remaining -= segmentLength;
  }

  return { x: path[0].x, y: path[0].y };
}

// rimCenters: where entities sit (lane midpoints). rimBoundaries: spoke/wedge
// edges. Closed shapes have N boundaries (boundary N wraps to boundary 0);
// open shapes have N+1 (both path endpoints are real, distinct boundaries).
export function compileArena(shape, laneCount) {
  const { id, closed, path } = shape;
  const length = totalLength(path, closed);

  const rimCenters = [];
  for (let i = 0; i < laneCount; i += 1) {
    rimCenters.push(pointAtArcLength(path, closed, ((i + 0.5) / laneCount) * length));
  }

  const boundaryCount = closed ? laneCount : laneCount + 1;
  const rimBoundaries = [];
  for (let i = 0; i < boundaryCount; i += 1) {
    rimBoundaries.push(pointAtArcLength(path, closed, (i / laneCount) * length));
  }

  return { id, closed, laneCount, rimCenters, rimBoundaries };
}
