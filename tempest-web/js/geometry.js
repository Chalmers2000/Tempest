// Lane/ring projection helpers for the pseudo-3D tube. Full projection math
// arrives alongside rendering/movement in later phases.

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
