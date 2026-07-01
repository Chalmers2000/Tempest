// Lane/ring projection helpers for the pseudo-3D tube.
//
// A "lane" is the wedge between spoke N and spoke N+1, not the spoke line
// itself - entities sit in the middle of that wedge (getLaneCenterPosition),
// while getRimPosition (at the raw, unshifted spoke angle) is only for
// drawing the spoke lines that mark the wedge boundaries.

export function wrapLane(index, laneCount) {
  return ((index % laneCount) + laneCount) % laneCount;
}

export function getLaneAngle(laneIndex, laneCount) {
  return (laneIndex / laneCount) * Math.PI * 2;
}

export function getRimPosition(laneIndex, laneCount, centerX, centerY, radius) {
  const angle = getLaneAngle(laneIndex, laneCount);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

export function getLaneCenterAngle(laneIndex, laneCount) {
  return ((laneIndex + 0.5) / laneCount) * Math.PI * 2;
}

export function getLaneCenterPosition(laneIndex, laneCount, centerX, centerY, radius) {
  const angle = getLaneCenterAngle(laneIndex, laneCount);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}
