# Spec: Player-Selectable Arena Geometries (Circle, Box, U, W, Line)

## 1. Goal
Add four arena shapes — **Box** (square), **U**, **W**, **Line** (horizontal) —
to the current circle-only playfield, and let the **player pick the starting
geometry on the title screen** next to the difficulty selector. The choice
persists (localStorage) and applies to the whole run.

**Constraints:** no build step, no dependencies, **no Python** (shape data is
hand-authored JS, verified in-browser). Runs by opening `tempest-web/index.html`
in Edge on Windows 11 / VS Code Live Server.

**Non-goals:** no change to enemy AI, difficulty, scoring, blaster, loop, or
state machine.

## 2. Why this is mostly a projection change
The sim is already shape-agnostic: entities carry only `laneIndex` and `depth`
(`0`=center … `RIM_RADIUS`=rim), never x/y. The circle is assumed in **two files
only**:
- `js/geometry.js` — `getLaneAngle`/`getRimPosition`/`getLaneCenterAngle`/`getLaneCenterPosition` use `cos/sin`.
- `js/renderer.js` — `drawPlaceholderTube()` draws rings via `ctx.arc` and spokes center→rim.

Second assumption: **wrap-around**. Circle/Box are closed loops (lanes wrap);
U/W/Line are open paths (lanes **clamp** at both ends). This wrap-vs-clamp
difference is the only behavioral change to the sim (see §6).

## 3. Model
Each arena = a **rim path** (ordered `{x,y}` points in a normalized `[0,1]` box)
plus a `closed` flag. Lanes are distributed **evenly by arc length** along the
path. A lane at depth `t` (`t = depth/RIM_RADIUS`) is `lerp(vanishingPoint, rimPoint, t)`
— straight spokes, so rings are nested scaled copies of the rim (concentric
circles/squares/U's/W's/lines).

### 3.1 New file `js/arenaShapes.js`
- `ARENA_SHAPES`: map keyed by id. Each entry `{ id, label, closed, path }`.
  - `circle` (label "Circle", closed): `path` from `buildCirclePath()`.
  - `square` (label **"Box"**, closed): 4 corner points.
  - `u` (label "U", open): left-down, across bottom, right-up (~5 pts).
  - `w` (label "W", open): two V's (~5 pts).
  - `line` (label "Line", open): 2 points across the middle.
- `ARENA_SHAPE_ORDER`: `['circle','square','u','w','line']` (selector order).
- `buildCirclePath(segments=64)`: pure-JS polygon of a centered unit circle
  mapped into the `[0,1]` box. (Polygon keeps all shapes on one code path;
  arc-length sampling reproduces today's even angular spacing to sub-pixel.)

### 3.2 New file `js/arena.js`
- `CompiledArena { id, closed, laneCount, rimCenters[], rimBoundaries[] }`
  (normalized points). Centers = where entities sit; boundaries = spoke lines.
- `compileArena(shape, laneCount) -> CompiledArena`.
- Helpers `totalLength(path, closed)` and `pointAtArcLength(path, closed, s)`.

## 4. Lane distribution (the harder geometry)
`N = LANE_COUNT`, `L = totalLength(path, closed)`.
- **Closed** (circle/box): boundary `i` at `i/N*L` (`i∈0..N-1`); center `i` at
  `(i+0.5)/N*L`; movement **wraps**. Identical topology to today.
- **Open** (u/w/line): boundary `i` at `i/N*L` (`i∈0..N`, so **N+1** boundaries
  incl. both endpoints); center `i` at `(i+0.5)/N*L`; movement **clamps**.

**Normalized→pixel:** reuse the existing "largest safe extent" from
`getTubeGeometry()` so no shape clips off-canvas:
`box = min(cx, cy, GAME_HEIGHT-cy)*2`; `pixel(pt) = origin + pt*box`. Vanishing
point stays at `(cx, cy)` with the current `TUBE_CENTER_Y_RATIO`.

## 5. `js/geometry.js` API (keep signatures stable)
Delegate to the active compiled arena instead of `cos/sin`. Callers in
`renderer.js`/`entities.js` should not need signature changes.
- `setActiveArena(compiled)` — install per run.
- `stepLane(index, delta, laneCount)` — closed wraps, open clamps.
- `wrapLane(index, laneCount)` — becomes topology-aware (back-compat shim).
- `getLaneCenterPosition(laneIndex, laneCount, cx, cy, radius)` — internally
  convert incoming `radius` to `t` so `renderer.js` call sites are unchanged.
- `getRimPosition(boundaryIndex, laneCount, cx, cy, radius)` — boundary points.

## 6. Wrap→clamp changes (only sim change)
- `entities.js updatePlayerMovement`: `wrapLane(i+dir)` → `stepLane(i, dir, N)`.
- `entities.js updateEnemy` (jumper): same swap; at an open end, prefer the
  in-bounds direction so jumpers keep moving.
- `renderer.js drawPlaceholderTube`: lit-spoke set must use **boundaries** (open
  arenas have `N+1`; last lane's right boundary is `N`, not `0`).
- Unchanged: `collision.js`, spawner's random lane pick, pole growth.

## 7. `js/renderer.js` changes
- Generalize `getTubeGeometry()` to also return the normalized→pixel mapping (§4).
- Rewrite `drawPlaceholderTube()`: stroke the rim path (`moveTo/lineTo` across
  boundaries, close only when `closed`); draw rings as scaled copies at each
  `RING_DEPTH_FRACTIONS`; spokes = vanishing point→each boundary.
- `drawEnemies/drawPlayer/drawProjectiles/drawPoles`: unchanged (preserved API +
  `atan2` facing generalize to all shapes).

## 8. Title-screen selector (player-selectable)
Mirror the existing profile selector exactly.
- **index.html:** inside `#difficultyPanel`, add `#shapeSelector` with five
  `.profile-button.shape-button` (`data-shape` = id; text = Circle/Box/U/W/Line).
  Add `#hudShape` (`Shape: …`) to `#hud`.
- **styles.css:** none required (reuses `.profile-button`/`.active`); optional
  `#shapeSelector { margin-top: 4px; }`.
- **ui.js:** cache shape buttons + `#hudShape`; `selectedShapeId` with
  load/save to `localStorage['tempest.arenaShape']` (guarded; default `circle`,
  fall back to `circle` on unknown value); `selectShape()`/`refreshShapeUI()`
  toggling `.active`; export `getSelectedShapeId()`; `updateHUD` sets
  `Shape: <label>`. The existing `#difficultyPanel` mousedown stopPropagation
  already prevents click-to-start on new children.
- **main.js:** in `startGame()`, `compileArena(ARENA_SHAPES[getSelectedShapeId()], LANE_COUNT)`
  then `setActiveArena(...)`; pass `shapeId` into HUD payloads. Arena persists
  across levels, so `advanceLevel()` needs no recompile.

## 9. Config additions
- `arenaShapes.js`: `ARENA_SHAPES`, `ARENA_SHAPE_ORDER`, `buildCirclePath`.
- `config.js`: `CIRCLE_PATH_SEGMENTS` (e.g. 64).
- localStorage key `tempest.arenaShape` (default `circle`).
Unchanged: `RIM_RADIUS`, `LANE_COUNT`, `RING_DEPTH_FRACTIONS`,
`TUBE_CENTER_Y_RATIO`, `MIN_ENTITY_SCALE`.

## 10. Files touched
| File | Change |
|---|---|
| `js/arenaShapes.js` | **New.** Shape data, labels, order, `buildCirclePath`. |
| `js/arena.js` | **New.** `compileArena` + arc-length sampling (§3.2, §4). |
| `js/geometry.js` | Rewrite internals; add `setActiveArena`/`stepLane`; topology-aware `wrapLane` (§5). |
| `js/renderer.js` | Rewrite `getTubeGeometry` + `drawPlaceholderTube`; fix lit boundaries (§6–7). |
| `js/entities.js` | `wrapLane(i+dir)` → `stepLane(i,dir)` in player + jumper (§6). |
| `js/ui.js` | Shape selector, persistence, `#hudShape`, `getSelectedShapeId` (§8). |
| `js/main.js` | Compile + install selected arena in `startGame`; HUD `shapeId` (§8). |
| `index.html` | `#shapeSelector` + `#hudShape` (§8). |
| `styles.css` | Optional `#shapeSelector` margin (§8). |
| `README.md` | Drop single-shape limitation; document selector. |

## 11. Milestones
1. Plumbing, circle-only: add `arena.js`/`arenaShapes.js`, route `geometry.js`
   through compiled circle; verify pixel-parity with today.
2. Selector UI + persistence (Circle functional only).
3. Box (closed) — nested squares + wrap.
4. Open topology: `stepLane` clamp + `N+1` boundaries; switch call sites.
5. Line → U → W (tune points by eye).
6. `#hudShape`, README, run the test plan.

## 12. Acceptance
No Python/build; selector shows Circle/Box/U/W/Line (single-active, persists,
default Circle); Circle matches today exactly; all five render centered and
un-clipped at 1280×720 with even spacing; Circle/Box wrap, U/W/Line clamp;
jumpers respect ends; HUD shows shape; 10 min across shapes with no console
errors and stable FPS. Full procedure in `docs/Arena_Geometry_Test_Plan.md`.