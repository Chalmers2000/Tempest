# Tempest-Style Arcade Game Specification (HTML/CSS/JavaScript)

## 1) Project Overview

Build a standalone desktop-playable, browser-based arcade game inspired by the classic 1981 vector shooter **Tempest**.  
The implementation must use only:

- `index.html`
- `styles.css`
- `game.js` (and optional modular JS files)

No backend required.

### Primary Platform
- Windows desktop (modern Chromium/Edge/Chrome/Firefox)
- Runs locally by opening `index.html` (or via lightweight static server)

### Design Goal
Recreate the feel of Tempest:
- Player moves around the rim of geometric “web” tunnels
- Shoots down lane toward enemies crawling outward
- Uses a limited-use **Super Blaster** panic mechanic
- Fast, arcade-like pacing and score-chasing gameplay

---

## 2) Legal / Creative Constraints

This project is **inspired by** Tempest gameplay conventions and should avoid copying proprietary art/audio directly.

- Do not use original Atari assets.
- Use custom vector-style graphics and original sound effects.
- Keep naming generic where appropriate (e.g., “Flipper-like enemy” can be “Crawler”).

---

## 3) Core Gameplay Requirements

### 3.1 Camera & Playfield
- Use a pseudo-3D “tube/web” playfield made of lanes arranged in a loop.
- Each level has:
  - `laneCount` (e.g., 8–16)
  - A depth from rim (player edge) toward center/vanishing point.
- Enemies spawn near center and travel outward lane-by-lane toward rim.

### 3.2 Player
- Player avatar sits on rim at one lane index.
- Movement wraps around ends (lane `0` left wraps to `laneCount - 1`, etc.).
- Shoots projectiles down current lane toward center.
- Can activate Super Blaster to clear immediate threats.

### 3.3 Controls (Desktop Mouse + Keyboard)
- **Mouse horizontal motion** → rotate player left/right across lanes.
- **Left mouse click** → fire shot.
- **Space bar** → Super Blaster (if charges remain).

#### Input Mapping Rules
- Use relative mouse X movement (`deltaX`) to accumulate turning intent.
- Convert movement threshold into lane step(s):
  - Small movement: 1 lane step
  - Faster movement: optional multi-lane step (clamped)
- Ignore vertical mouse movement for gameplay.
- Click rate should be capped by fire cooldown (no uncapped autofire).
- Spacebar triggers on keydown edge (not every frame while held).

---

## 4) Game States / Flow

Required state machine:

1. **BOOT**
2. **TITLE**
   - Game title
   - Controls hint
   - Difficulty profile selection (see Section 6)
   - “Click to Start”
3. **LEVEL_START**
   - Short transition effect
4. **PLAYING**
5. **PLAYER_DEATH**
   - Life decrement + respawn delay if lives remain
6. **LEVEL_CLEAR**
   - Bonus tally + next level setup
7. **GAME_OVER**
   - Final score
   - Restart prompt

Optional:
- **PAUSED** (Esc / P)

---

## 5) Rules, Scoring, and Progression

### 5.1 Lives & Game Over
- Start with 3 lives (configurable by difficulty profile).
- Collision with enemy at rim or enemy projectile hit causes death.
- Game ends at 0 lives.

### 5.2 Scoring (Suggested Baseline)
- Basic enemy destroyed: +100
- Advanced enemy destroyed: +200 to +500
- Level clear bonus: based on remaining lives and/or unused blaster charges

(Exact values can be tuned in constants.)

### 5.3 Level Progression
Each new level increases difficulty according to the selected difficulty profile:
- Enemy movement speed scaling
- Spawn rate scaling
- Enemy mix composition
- Enemy projectile frequency
- Lane count or web geometry variation (optional)

Progression must be smooth and profile-governed (see Section 6 caps and scaling).

---

## 6) Difficulty Profile System (Accessibility + Progression Control)

### 6.1 Goal
Provide explicit control over difficulty ramp, including a mode suitable for older adults and new players.

### 6.2 Required Profiles
Implement 4 selectable profiles on title screen:

1. **Relaxed**
2. **Standard**
3. **Arcade**
4. **Custom** (advanced sliders)

### 6.3 Profile Parameters
Each profile must define these values/scalars:

- `enemySpeedScale`
- `spawnRateScale`
- `enemyProjectileChanceScale`
- `maxSimultaneousEnemies`
- `blasterChargeStart`
- `playerFireCooldownScale`
- `respawnInvulnerabilityMs`
- `laneStepSensitivityScale`
- `aimAssistWindowMs` (optional forgiving overlap window)

### 6.4 Progression Rules
- Increase difficulty per level using profile-specific increments.
- Change challenge in layers (speed first, then spawn pressure, then behavior complexity), not sudden spikes.
- Enforce hard limits per profile:
  - max enemy speed cap
  - minimum spawn interval cap
  - max active enemy projectile cap
- Gate enemy type introduction by level:
  - Relaxed: dangerous types introduced later
  - Standard: baseline pacing
  - Arcade: earlier and faster introduction

### 6.5 Adaptive Assist (Optional but Recommended)
If player loses 2 lives within 60 seconds:
- Temporarily reduce spawn pressure by 10–20% for ~20 seconds.
- Slightly extend respawn invulnerability.
- Keep selected profile label unchanged (assist is subtle, temporary).

### 6.6 UI / Persistence Requirements
- Show selected profile on:
  - Title screen
  - Pause screen
  - Game over summary
- For **Custom**, expose sliders/toggles and save settings in `localStorage`.
- On restart, default to last selected profile unless reset.

### 6.7 Difficulty Acceptance Criteria
- Relaxed mode must allow new/older players to survive early levels without immediate overwhelm.
- Arcade mode must provide rapid, high-intensity escalation.
- Switching profiles must produce measurable gameplay differences without code changes.
- Difficulty progression must not spike abruptly between consecutive early levels.

---

## 7) Enemy System

Implement at least 3 enemy archetypes:

1. **Crawler (basic)**
   - Moves outward along a lane
   - Dies in one hit

2. **Jumper / Spiker variant**
   - May switch lanes occasionally OR place hazards on lanes
   - Encourages lateral movement

3. **Shooter**
   - Moves and periodically fires up-lane toward player

### Enemy Behaviors
- Spawn near center with lane assignment.
- Lane changes must wrap correctly.
- Maintain min spawn distance to prevent unfair instant deaths.
- Difficulty manager controls composition per level and per profile.

---

## 8) Super Blaster Mechanic

- Activated via **Space bar**.
- Limited charges per level/life (configurable by profile).
- On use:
  - Clears all enemies within danger range (or full board if desired mode enabled).
  - Optional radial flash effect.
  - Temporary invulnerability window (very short, e.g., 200–400ms) optional.
- HUD must show remaining charges.

---

## 9) Rendering Specification

### 9.1 Technology
- Use HTML5 `<canvas>` (2D context).
- Recommended native resolution: e.g., 1280×720 with responsive scale preserving aspect ratio.

### 9.2 Visual Style
- Vector/Neon aesthetic on dark background.
- Render:
  - Web lanes and depth rings
  - Player marker on rim
  - Enemy glyphs
  - Shots/projectiles
  - Explosions / flashes

### 9.3 Performance
- Fixed timestep update loop preferred (e.g., 60 FPS simulation).
- Render interpolation optional.
- Avoid per-frame allocations in hot paths.

---

## 10) HUD / UI Requirements

Display during gameplay:
- Score
- Lives
- Level
- Super Blaster charges
- Current difficulty profile
- Optional multiplier / high score

Title and game-over screens must include controls:
- “Move mouse left/right to rotate”
- “Click to shoot”
- “Space = Super Blaster”

Title screen must also include:
- Difficulty profile selector (Relaxed/Standard/Arcade/Custom)

---

## 11) Audio Requirements

- Web Audio API or HTMLAudioElement.
- Provide original SFX for:
  - Shot
  - Enemy death
  - Player death
  - Super Blaster
  - Level start/clear
- Optional looping background hum synced to intensity.

Include mute toggle (`M` key).

---

## 12) Technical Architecture

### 12.1 File Structure (Minimum)
- `index.html`
- `styles.css`
- `game.js`

Recommended modular structure:
- `config.js` (constants/tuning)
- `difficultyProfiles.js` (profile definitions/scaling/caps)
- `input.js`
- `stateMachine.js`
- `entities.js`
- `renderer.js`
- `audio.js`
- `ui.js`
- `main.js`

### 12.2 Core Systems
- Game loop (update/render)
- Input manager (mouse delta, click edge, keyboard edge)
- Entity manager (player, enemies, projectiles, FX)
- Collision system
- Difficulty/spawn director (profile-aware)
- State machine
- HUD/UI layer
- Persistence (localStorage high score + profile/custom tuning)

---

## 13) Data Models (Suggested)

```js
Player {
  laneIndex: number,
  lives: number,
  shootCooldownMs: number,
  shootTimerMs: number,
  blasterCharges: number,
  isAlive: boolean,
  respawnTimerMs: number,
  invulnerabilityMs: number
}

Enemy {
  id: number,
  type: 'crawler' | 'jumper' | 'shooter',
  laneIndex: number,
  depth: number,
  speed: number,
  hp: number,
  fireCooldownMs?: number
}

Projectile {
  owner: 'player' | 'enemy',
  laneIndex: number,
  depth: number,
  speed: number,
  active: boolean
}

DifficultyProfile {
  name: 'Relaxed' | 'Standard' | 'Arcade' | 'Custom',
  enemySpeedScale: number,
  spawnRateScale: number,
  enemyProjectileChanceScale: number,
  maxSimultaneousEnemies: number,
  blasterChargeStart: number,
  playerFireCooldownScale: number,
  respawnInvulnerabilityMs: number,
  laneStepSensitivityScale: number,
  aimAssistWindowMs?: number,
  perLevelSpeedIncrement: number,
  perLevelSpawnIncrement: number,
  minSpawnIntervalMs: number,
  maxEnemySpeed: number,
  maxEnemyProjectiles: number
}

Level {
  index: number,
  laneCount: number,
  spawnRate: number,
  enemySpeedScale: number,
  enemyMix: Record<string, number>,
  enemyTypeUnlocks: Record<string, number>
}
```

---

## 14) Input Handling Details

### 14.1 Mouse Movement to Lane Steps
- Track current and previous mouse X each frame.
- `deltaX = currentX - prevX`.
- Accumulate: `turnAccumulator += deltaX * sensitivity * laneStepSensitivityScale`.
- While accumulator exceeds threshold:
  - step lane right/left
  - subtract threshold
- Clamp max steps per frame to avoid jumpy control on large deltas.

### 14.2 Shooting
- On left click edge:
  - if cooldown complete, spawn player projectile in current lane.

### 14.3 Super Blaster
- On Space edge:
  - if charges > 0 and state is PLAYING:
    - trigger effect
    - decrement charge
    - apply clear logic

---

## 15) Collision & Fairness Rules

- Player shot hits first enemy intersecting same lane/depth path.
- Enemy shot hits player if lane matches and reaches rim.
- Enemy reaching rim at player lane causes death.
- Add brief respawn invulnerability (profile-controlled).
- Ensure spawn grace period after respawn.
- Optional `aimAssistWindowMs` may slightly widen hit window in Relaxed/Custom modes.

---

## 16) Balancing Parameters (Configurable Constants)

Provide a central constants/profile object for quick tuning:

- `START_LIVES`
- `START_BLASTER_CHARGES` (overridden by profile where applicable)
- `MOUSE_SENSITIVITY`
- `LANE_STEP_THRESHOLD`
- `MAX_LANE_STEPS_PER_FRAME`
- `PLAYER_FIRE_COOLDOWN_MS` (+ profile scale)
- `PLAYER_PROJECTILE_SPEED`
- `ENEMY_BASE_SPEED` (+ profile scale)
- `ENEMY_SPAWN_INTERVAL_MS` (+ profile scale)
- `ENEMY_FIRE_CHANCE` (+ profile scale)
- `RESPAWN_INVULN_MS` (profile-controlled)
- `LEVEL_SPEED_SCALE`
- `LEVEL_SPAWN_SCALE`
- difficulty caps and unlock-level maps

---

## 17) Accessibility & UX

- Windowed and fullscreen-friendly.
- Clear contrast for enemies/projectiles.
- Optional toggles:
  - Reduced flash mode
  - Color palette variants
- Show pause/help overlay with controls.
- Cursor behavior:
  - Keep cursor visible in menu.
  - Optional pointer lock while playing for smoother relative movement.
- Provide a clearly labeled **Relaxed** mode intended for low-stress play.

---

## 18) QA / Acceptance Criteria

A build is acceptable when all are true:

1. Game launches from `index.html` with no backend.
2. Mouse left/right reliably rotates player around rim.
3. Left click fires with cooldown and hit detection.
4. Space activates limited Super Blaster and updates HUD.
5. Player can lose lives and reach game over.
6. Score increments correctly on enemy kills.
7. At least 3 enemy archetypes are implemented.
8. Difficulty increases across levels according to selected profile.
9. Difficulty profile selection measurably changes gameplay.
10. Relaxed mode provides gentler progression suitable for older/new players.
11. Average frame rate remains smooth on typical Windows desktop browser.
12. No uncaught runtime errors during a 10-minute play session.

---

## 19) Optional Enhancements

- High score name entry
- Enemy type unique VFX
- Screen shake on blaster
- Adaptive music intensity
- Challenge modes (hardcore / time attack)
- Gamepad support fallback
- Detailed per-level tuning table appendix (optional separate markdown)

---

## 20) Implementation Plan (Suggested Milestones)

### Milestone 1: Skeleton
- Canvas setup, loop, state machine, HUD placeholders.

### Milestone 2: Core Movement/Rendering
- Web geometry, lane math, player movement via mouse delta.

### Milestone 3: Combat
- Shooting, projectile travel, collisions, score.

### Milestone 4: Enemies & Difficulty
- Spawn system, 3 enemy types, level progression, profile system integration.

### Milestone 5: Super Blaster + Polish
- Blaster logic, VFX/SFX, balancing, game-over/title screens, profile UI persistence.

### Milestone 6: QA
- Bug fixes, accessibility tuning, performance cleanup, packaging.

---

## 21) Packaging / Delivery

Deliverables:
- Source files in one folder
- `README.md` with:
  - How to run
  - Controls
  - Difficulty profile explanations
  - Known limitations
  - Tuning constants location

Optional:
- Zip package for distribution
- Simple Windows `.bat` to launch local static server (if desired)

---

## 22) README Control Snippet (for final game)

- **Move:** Mouse left/right  
- **Shoot:** Left mouse click  
- **Super Blaster:** Space bar  
- **Pause:** P (optional)  
- **Mute:** M (optional)  
- **Difficulty Profile:** Relaxed / Standard / Arcade / Custom