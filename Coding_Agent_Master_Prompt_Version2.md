Build a standalone Tempest-style arcade game for Windows desktop browser (Edge), using HTML/CSS/JavaScript only.

## Non-negotiable requirements
- No backend, no Python, no frameworks.
- Must run from static files.
- Controls:
  - Mouse horizontal movement = lane rotation
  - Left click = shoot (cooldown limited)
  - Space = super blaster (limited charges)
- Include difficulty profiles:
  - Relaxed, Standard, Arcade, Custom
- Include game states:
  - BOOT, TITLE, LEVEL_START, PLAYING, PLAYER_DEATH, LEVEL_CLEAR, GAME_OVER (optional PAUSED)
- Include at least 3 enemy types:
  - crawler, jumper/spiker behavior, shooter
- Must include HUD: score, lives, level, blaster, selected difficulty profile.

## Use this exact file structure
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
    difficultyProfiles.js
  README.md

## Engineering rules
- Use ES modules.
- Keep constants centralized in config.js and difficultyProfiles.js.
- Use a fixed timestep update loop.
- Avoid uncaught runtime errors.
- Keep code readable and commented at subsystem boundaries.
- Do not add extra dependencies.

## Delivery protocol (critical)
Implement in phases. After each phase:
1) list changed files,
2) provide a short “what works now,”
3) provide exact manual test steps,
4) STOP and wait for "continue".

Do not skip phases.

## Phase order

### Phase 1: Scaffold + bootable loop
- Create all files.
- Render canvas + HUD placeholders + title overlay.
- State machine skeleton and boot/title transition.
- Main loop running with no gameplay yet.

Exit criteria:
- Opening index.html shows title screen and no console errors.

### Phase 2: Input + player lane movement
- Implement mouse delta horizontal lane movement with wrap.
- Implement input edge handling for click and space.
- Draw player on rim lane.

Exit criteria:
- Player moves left/right lanes reliably and wraps.

### Phase 3: Shooting + projectile system
- Implement click-to-shoot with cooldown.
- Render player projectiles traveling down lane.

Exit criteria:
- Projectiles spawn correctly and respect cooldown.

### Phase 4: Enemy spawning + 3 enemy behaviors
- Add crawler, jumper/spiker, shooter.
- Spawn waves from center with level config.
- Implement shooter projectiles.

Exit criteria:
- All enemy types visible and behaviorally distinct.

### Phase 5: Collision + scoring + lives
- Projectile/enemy collisions.
- Enemy/projectile/player collisions.
- Lives decrement, death flow, respawn invulnerability.
- Score updates by enemy type.

Exit criteria:
- Full lose-life loop works correctly.

### Phase 6: Super blaster
- Spacebar consumes charge and triggers clear effect.
- HUD updates charges.
- Block use at zero charges.

Exit criteria:
- Blaster works reliably.

### Phase 7: Difficulty profiles + progression
- Implement Relaxed/Standard/Arcade/Custom presets.
- Profile selection on title screen.
- Profile affects scaling/caps/unlock timing.
- Persist selected profile and custom settings to localStorage.

Exit criteria:
- Switching profile causes measurable gameplay differences.

### Phase 8: UI polish + game over + README
- Complete overlays (title, pause optional, game over).
- Restart flow.
- README with run instructions and controls.
- Final QA pass for console cleanliness.

Exit criteria:
- 10-minute play session without uncaught errors.

## Quality bar
- Prioritize correctness and playability over visual complexity.
- If a feature risks instability, implement a simpler stable version first.