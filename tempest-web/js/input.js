// Input manager. Tracks horizontal mouse delta, edge-triggered click/space,
// and mouse-held state (for cooldown-capped autofire while the button is
// down). Vertical mouse movement is intentionally ignored.

let attachedTarget = null;
let deltaXAccum = 0;
let clickEdge = false;
let spaceEdge = false;
let pauseEdge = false;
let resumeEdge = false;
let mouseHeld = false;

function handleMouseMove(e) {
  deltaXAccum += e.movementX || 0;
}

function handleMouseDown(e) {
  if (e.button === 0) {
    clickEdge = true;
    mouseHeld = true;
  }
}

function handleMouseUp(e) {
  if (e.button === 0) {
    mouseHeld = false;
  }
}

function handleKeyDown(e) {
  if (e.code === 'Space' && !e.repeat) {
    spaceEdge = true;
    e.preventDefault();
  } else if (e.code === 'KeyP' && !e.repeat) {
    pauseEdge = true;
  } else if (e.code === 'Escape' && !e.repeat) {
    resumeEdge = true;
  }
}

function handleBlur() {
  // Losing focus (alt-tab, pointer-lock exit) never delivers mouseup -
  // without this, autofire could get stuck on.
  mouseHeld = false;
}

export function attachInput(target) {
  if (attachedTarget) return;
  attachedTarget = target;
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('blur', handleBlur);
}

export function beginFrame() {
  // Reserved for future per-frame input snapshotting.
}

export function endFrame() {
  // Reserved for future per-frame input snapshotting.
}

export function getDeltaX() {
  const value = deltaXAccum;
  deltaXAccum = 0;
  return value;
}

export function consumeClickEdge() {
  const value = clickEdge;
  clickEdge = false;
  return value;
}

export function consumeSpaceEdge() {
  const value = spaceEdge;
  spaceEdge = false;
  return value;
}

export function consumePauseEdge() {
  const value = pauseEdge;
  pauseEdge = false;
  return value;
}

export function consumeResumeEdge() {
  const value = resumeEdge;
  resumeEdge = false;
  return value;
}

export function isFireHeld() {
  return mouseHeld;
}

export function isAttached() {
  return attachedTarget !== null;
}

// Regular (non-locked) mousemove clamps at the screen edge, capping how far
// a single swipe can rotate. Pointer Lock removes that ceiling by making
// movementX unbounded relative motion, which is required for a full
// revolution around the rim to be reachable at all.
export function requestPointerLock(element) {
  if (document.pointerLockElement !== element) {
    element.requestPointerLock();
  }
}

export function isPointerLocked(element) {
  return document.pointerLockElement === element;
}
