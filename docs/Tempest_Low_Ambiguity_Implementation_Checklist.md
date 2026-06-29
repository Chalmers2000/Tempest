# Tempest-Style Game (HTML/CSS/JS) — Low-Ambiguity Implementation Checklist

Use this checklist to implement the game in small, verifiable steps.  
**Rule:** Do not move to the next step until all acceptance checks for the current step pass.

---

## 0) Project Constraints (Read First)

- Platform: Windows 11 desktop
- Editor: VS Code
- Runtime: Browser (Edge)
- Languages: HTML, CSS, JavaScript only
- No backend
- No Python required
- Must run as static files (`index.html` + local assets)

### Required Controls
- Mouse left/right movement: rotate player between lanes
- Left mouse click: shoot
- Spacebar: super blaster

---

## 1) Create Exact File Structure

Create this folder structure exactly:

```text
tempest-web/
  index.html
  styles.css
  js/
    main.js
    config.js
    gameState.js
    input.js
    geometry.js
    entities.js
    collision.js
    spawner.js
    renderer.js
    ui.js
    audio.js
  assets/
    audio/
  README.md
```

### Acceptance Checks
- [ ] All files exist with exact names
- [ ] `index.html` loads without 404 errors in Edge devtools

---

## 2) Build Minimal HTML Shell

In `index.html`:

- Add `<canvas id="gameCanvas"></canvas>`
- Add HUD container:
  - score text
  - lives text
  - level text
  - blaster charges text
- Add overlay container for:
  - title screen
  - game over
  - pause/help text
- Include CSS and JS modules in correct order (or use ES modules via `type="module"` and import from `main.js`)

### Acceptance Checks
- [ ] Opening `index.html` shows a visible canvas
- [ ] HUD placeholders are visible
- [ ] No console errors

---

## 3) Add Baseline CSS Layout

In `styles.css`:

- Fullscreen dark background
- Center canvas with fixed aspect ratio behavior
- Neon/vector-like color palette
- HUD anchored top-left/top-right and readable
- Overlay centered and toggle-able via class

### Acceptance Checks
- [ ] Canvas remains visible when window resizes
- [ ] HUD stays readable and does not overlap badly
- [ ] Overlay can be shown/hidden by class

---

## 4) Add Configuration Constants

In `js/config.js`, define and export constants:

- `GAME_WIDTH`, `GAME_HEIGHT`
- `START_LIVES = 3`
- `START_BLASTER_CHARGES = 3`
- `MOUSE_SENSITIVITY`
- `LANE_STEP_THRESHOLD`
- `MAX_LANE_STEPS_PER_FRAME`
- `PLAYER_FIRE_COOLDOWN_MS`
- `PLAYER_PROJECTILE_SPEED`
- `ENEMY_PROJECTILE_SPEED`
- `ENEMY_BASE_SPEED`
- `ENEMY_SPAWN_INTERVAL_MS`
- `RESPAWN_INVULN_MS`
- `LEVEL_SPEED_SCALE`
- `LEVEL_SPAWN_SCALE`
- scoring constants for each enemy type

### Acceptance Checks
- [ ] `main.js` imports constants successfully
- [ ] Changing a constant (e.g., cooldown) changes gameplay later without code edits elsewhere

---

## 5) Implement Game State Machine

In `js/gameState.js`, implement exact states:

- `BOOT`
- `TITLE`
- `LEVEL_START`
- `PLAYING`
- `PLAYER_DEATH`
- `LEVEL_CLEAR`
- `GAME_OVER`
- optional `PAUSED`

Provide functions:

- `setState(nextState)`
- `getState()`
- state timers where needed

### Acceptance Checks
- [ ] On load: enters `TITLE`
- [ ] Clicking start transitions to `LEVEL_START` then `PLAYING`
- [ ] Forcing death transitions through `PLAYER_DEATH` or `GAME_OVER` correctly

---

## 6) Implement Input Manager

In `js/input.js`:

Track:
- `mouseX`, `prevMouseX`, `deltaX`
- `leftClickPressed` edge trigger
- `spacePressed` edge trigger
- optional `pausePressed`, `mutePressed`

Expose methods:
- `attachInput(canvasOrWindow)`
- `beginFrame()`
- `endFrame()`
- getters for deltas/edges

Important:
- Use **edge-triggered** click/space events (single action per press)
- Ignore vertical mouse movement

### Acceptance Checks
- [ ] `deltaX` updates when moving mouse horizontally
- [ ] Single click fires one trigger (not infinite)
- [ ] Space trigger fires once per key press

---

## 7) Implement Geometry (Web/Lanes)

In `js/geometry.js`:

- Create lane/ring projection helpers for pseudo-3D tube
- Represent positions by:
  - `laneIndex`
  - `depth` (rim ↔ center convention, choose one and keep consistent)
- Provide lane wrapping helper:
  - `wrapLane(index, laneCount)`

### Acceptance Checks
- [ ] Lane wrap works: left of 0 wraps to last lane
- [ ] Geometry functions return stable coordinates each frame

---

## 8) Define Entity Models

In `js/entities.js`, create factories/classes for:

- Player
  - laneIndex, lives, cooldown timer, blaster charges, invuln timer
- Enemies
  - id, type (`crawler`, `jumper`, `shooter`), laneIndex, depth, speed, hp, fire timer
- Projectiles
  - owner (`player`/`enemy`), laneIndex, depth, speed, active
- Effects (optional)
  - explosions, blaster flash

Also include update functions per entity type.

### Acceptance Checks
- [ ] Player object initializes with correct defaults
- [ ] Enemies/projectiles can be created and updated without errors

---

## 9) Implement Main Loop (Fixed Timestep)

In `js/main.js`:

- Initialize canvas/context
- Initialize state, input, entities
- Use `requestAnimationFrame`
- Use fixed update step (e.g., 16.666ms)
- Separate:
  - `update(dt)`
  - `render()`

### Acceptance Checks
- [ ] Loop runs smoothly
- [ ] Frame time spikes do not break simulation
- [ ] No per-frame console spam/errors

---

## 10) Implement Player Movement from Mouse Delta

In `main.js` or `entities.js`:

- `turnAccumulator += deltaX * MOUSE_SENSITIVITY`
- While accumulator exceeds `LANE_STEP_THRESHOLD`:
  - move lane +1/-1
  - subtract threshold
- Clamp to `MAX_LANE_STEPS_PER_FRAME`

### Acceptance Checks
- [ ] Small mouse movement causes one-lane movement
- [ ] Fast swipe can move multiple lanes (clamped)
- [ ] Movement wraps correctly across first/last lane

---

## 11) Implement Shooting (Left Click)

- On click edge in `PLAYING`:
  - if cooldown <= 0:
    - spawn player projectile in player lane
    - reset cooldown
- Cooldown ticks down each update

### Acceptance Checks
- [ ] Clicking spawns projectile from player lane only
- [ ] Cooldown prevents unrealistic fire rate
- [ ] Repeated clicks fire at expected cadence

---

## 12) Implement Enemy Spawner + Level Data

In `js/spawner.js`:

- Create level config with:
  - laneCount
  - spawn interval
  - speed multiplier
  - enemy mix probabilities
- Spawn near center at intervals
- Ensure no unfair instant spawn at player rim

### Acceptance Checks
- [ ] Enemies begin spawning during `PLAYING`
- [ ] Level 2+ is visibly harder than level 1
- [ ] Spawn interval/speed scales by constants

---

## 13) Implement Enemy Behaviors (3 Types Minimum)

Required:
1. `crawler`: straight outward movement
2. `jumper`: occasional lane switch or hazard behavior
3. `shooter`: periodically fires enemy projectiles toward rim

### Acceptance Checks
- [ ] All 3 types appear by configured level progression
- [ ] Jumper behavior is visibly distinct from crawler
- [ ] Shooter fires projectiles at intervals

---

## 14) Implement Collision System

In `js/collision.js`:

Handle:
- player projectile vs enemy (same lane + depth overlap)
- enemy projectile vs player at rim lane
- enemy reaching rim at player lane

On hit:
- enemy dies + score
- player death flow if player hit

### Acceptance Checks
- [ ] Shots destroy enemies reliably
- [ ] Enemy projectile can kill player
- [ ] Enemy reaching rim on player lane kills player
- [ ] No duplicate scoring from one enemy death

---

## 15) Implement Lives, Respawn, and Game Over

- On player death:
  - decrement life
  - if lives > 0: state `PLAYER_DEATH` then respawn
  - else: `GAME_OVER`
- Apply temporary invulnerability after respawn (`RESPAWN_INVULN_MS`)

### Acceptance Checks
- [ ] Lives decrease exactly once per death
- [ ] Respawn works and invulnerability timer prevents instant chain death
- [ ] Game enters `GAME_OVER` at 0 lives

---

## 16) Implement Super Blaster (Spacebar)

Behavior:
- Trigger only in `PLAYING`
- Require `blasterCharges > 0`
- On use:
  - decrement charge
  - clear enemies in defined range (or full board if chosen mode)
  - play flash effect
  - optional short invulnerability window

### Acceptance Checks
- [ ] Space consumes exactly one charge
- [ ] Blaster effect visibly clears threats
- [ ] Cannot use at 0 charges
- [ ] HUD updates immediately after use

---

## 17) Implement Scoring + Level Clear Logic

Scoring:
- Add points per enemy type from config

Level clear:
- Define clear condition (e.g., enemy quota destroyed or wave exhausted)
- Transition to `LEVEL_CLEAR`
- Apply bonus (optional)
- Start next level with updated difficulty

### Acceptance Checks
- [ ] Score increments correctly by enemy type
- [ ] Level transitions occur reliably
- [ ] Difficulty increases each level

---

## 18) Implement Renderer

In `js/renderer.js`, render in order:

1. background clear
2. web/tube lines
3. player
4. enemies
5. projectiles
6. effects
7. HUD/overlays (or UI module handles text overlays)

Use neon palette and clear silhouettes.

### Acceptance Checks
- [ ] All entities render in correct depth/lane positions
- [ ] Visual layering is consistent
- [ ] No flicker/artifacts under normal play

---

## 19) Implement UI & HUD Binding

In `js/ui.js`:

- Update score/lives/level/blaster DOM each frame or on change
- Title overlay text includes controls:
  - mouse left/right move
  - click shoot
  - space blaster
- Game over overlay shows final score + restart hint

### Acceptance Checks
- [ ] HUD values always match game data
- [ ] Title and game over overlays appear in correct states
- [ ] Restart from game over works (full reset)

---

## 20) Add Audio Hooks (Optional but Recommended)

In `js/audio.js`:

- Create simple SFX methods:
  - `playShoot()`
  - `playEnemyDeath()`
  - `playPlayerDeath()`
  - `playBlaster()`
- Add mute toggle with `M`

### Acceptance Checks
- [ ] SFX plays on matching events
- [ ] Mute toggle affects all sounds
- [ ] No crashes if audio init fails

---

## 21) Add Pause + Focus Handling

- Pause key: `P` or `Escape`
- Pause when tab loses focus (optional)
- Freeze simulation updates while paused

### Acceptance Checks
- [ ] Paused state stops movement/spawning/projectiles
- [ ] Unpause resumes cleanly
- [ ] No timer explosions after unpause

---

## 22) Final QA Pass (Must Pass All)

Run a 10-minute play test and verify:

- [ ] No uncaught exceptions in console
- [ ] Controls remain responsive over long play
- [ ] Mouse movement remains stable at different framerates
- [ ] Difficulty progression feels incremental, not unfair spikes
- [ ] Super blaster never goes negative charges
- [ ] Score never decreases unexpectedly
- [ ] Lives/game-over flow always consistent

---

## 23) README Completion

In `README.md`, include:

- Project description
- How to run (`open index.html` or Live Server)
- Controls
- Config constants location
- Known limitations
- Browser tested (Edge on Windows 11)

### Acceptance Checks
- [ ] New developer can run game in under 2 minutes using README only

---

## 24) “Definition of Done”

Project is done only when all are true:

- [ ] Required controls implemented exactly
- [ ] 3+ enemy archetypes implemented and distinct
- [ ] Level progression and scoring functional
- [ ] Lives/respawn/game-over complete
- [ ] Super blaster complete with charges + HUD
- [ ] Runs standalone on Windows 11 in Edge
- [ ] README included and accurate

---

## 25) Optional Stretch Goals (After Done)

- [ ] High score persistence via `localStorage`
- [ ] Fullscreen toggle
- [ ] Pointer lock option for smoother mouse input
- [ ] Alternate color themes / reduced flash accessibility
- [ ] Simple attract/demo mode on title screen