# Test Plan: Player-Selectable Arena Geometries

Browser + DevTools console only. **No Python, no framework, no installs.**
Run in Edge on Windows 11 (VS Code Live Server or open `index.html` directly).
Keep DevTools Console (F12) open throughout.

**Global rule:** any uncaught error / unhandled rejection = FAIL for that step.
Record outcomes; for each FAIL capture step #, console output, and a repro.

## 0. Setup
Serve/open `tempest-web/index.html`. **Pass:** title shows difficulty selector,
shape selector (Circle/Box/U/W/Line), "Click to Start"; **zero** console errors
on load; no 404s for any `js/*.js` (incl. `arenaShapes.js`, `arena.js`).

## 1. Selector behavior
- Cleared storage → **Circle** highlighted by default.
- Clicking shapes toggles a single `.active`; does **not** start the game.
- Shape + difficulty selections are independent; neither starts the game.
- Select Box, reload → Box preselected. `localStorage['tempest.arenaShape']`
  returns the chosen id (e.g. `"w"`).
- Picking a shape doesn't reset Custom sliders / Poles, and vice-versa.

## 2. Per-shape matrix — run once for EACH of Circle, Box, U, W, Line
Select shape, Standard difficulty, start.
- Rim outline matches the shape, centered, fully on-screen (no clipping).
- Depth rings are nested scaled copies of the rim (not forced circles).
- Spokes fan to evenly spaced rim points; uniform segments incl. corners.
- HUD `Shape:` shows the correct label.
- Mouse L/R glides the ship between adjacent lanes, seated on the rim.
- Hold fire → shots travel inward and vanish near center.
- Enemies spawn near center, crawl outward along spokes.
- Shooting an in-lane enemy kills it and scores (no pass-through).
- Enemy reaching rim in your lane costs a life, then respawn invuln.
- P then Esc: pause then resume; arena still correct.
- Space: flash clears enemies/enemy shots/poles.
- Clear the kill quota → LEVEL_CLEAR, next level uses the **same** shape.

**Pass:** every item passes for all five shapes, no console errors.

## 3. Topology (critical)
Closed must **wrap**:
- Circle: long one-direction swipe wraps past start, no stop.
- Box: wraps around all four sides continuously.

Open must **clamp** (a wrap here = automatic FAIL):
- Line: push left → stops at left end (no jump to right); push right → stops at
  right end.
- U: stops at both top tips; no wrap between them.
- W: stops at both outer ends.
- Parked at an end, keep pushing ~2s → stays put, no jitter/wrap/error.
- Jumper near an open end never jumps past it (ideally reverses).

## 4. Regression
- Circle feels/looks identical to the pre-change build (parity).
- Relaxed vs Arcade change speed/spawn as before; shape unaffected.
- Enemy Poles on an open shape (e.g. W) at level 2+: grow, shield, shrink on
  hits, clear on Space — as on circle.
- HUD Score/Lives/Level/Blaster/Profile/Shape all update.
- Game Over → overlay + final score; restart returns to selected shape.
- Resize window / change aspect on each shape → stays centered, un-clipped.

## 5. Persistence & edge cases
- `localStorage.clear()` + reload → defaults to Circle, no errors.
- Private/incognito (localStorage may throw) → selector works, defaults Circle,
  no uncaught errors (may not persist).
- Set `tempest.arenaShape` to a junk value + reload → falls back to Circle.
- Switching shapes between runs always applies on next start.
- 10 min continuous across shapes → no error, stable FPS.

## 6. Console self-test (opt-in, pure JS)
Add a dev-only hook to `main.js`, active only when the URL has `?selftest`:
expose `compileArena`, `totalLength`, `ARENA_SHAPES`, `ARENA_SHAPE_ORDER` on
`window.__arenaSelfTest` (dynamic imports, guarded — never affects normal play).

Open `index.html?selftest`, paste a Console loop over `ARENA_SHAPE_ORDER` that
compiles each shape and asserts:
1. `rimCenters.length === LANE_COUNT`.
2. `rimBoundaries.length === (closed ? N : N+1)`.
3. All center/boundary points finite and within `[0,1]`.
4. Consecutive lane-center chord gaps roughly uniform — flag only gross
   non-uniformity (e.g. maxDev > 0.6), since chords shorten at sharp corners;
   the visual check in §2 is authoritative for spacing.

Print a `PASS/FAIL` line per assertion and a final count. **Pass:** `0 failed`.

## 7. Sign-off (all required)
- [ ] Setup + load: no console errors (§0).
- [ ] Selector: five shapes, single-active, persists, default Circle (§1).
- [ ] All five shapes pass the matrix (§2).
- [ ] Circle/Box wrap; U/W/Line clamp; jumpers respect ends (§3).
- [ ] Parity + difficulty/poles/HUD/game-over/resize (§4).
- [ ] Persistence + edge cases safe (§5).
- [ ] `?selftest` reports `0 failed` (§6).
- [ ] 10-min multi-shape session: no errors, stable FPS.
Any unchecked item blocks release.