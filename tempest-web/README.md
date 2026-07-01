# Tempest-Style Web Shooter

Standalone HTML/CSS/JavaScript arcade game inspired by Tempest (1981). No backend, no build step, no dependencies.

## Status

Phase 1 of 8 complete: scaffold, state machine skeleton, fixed-timestep main loop, and title screen. Gameplay systems (movement, shooting, enemies, collisions, difficulty profiles, super blaster) are implemented in subsequent phases.

## How to Run

Open `index.html` directly in Microsoft Edge, or serve the folder with any static file server (recommended for consistent module loading), e.g. in VS Code use the "Live Server" extension and open `index.html`.

## Controls (planned)

- **Move:** Mouse left/right
- **Shoot:** Left mouse click
- **Super Blaster:** Space bar
- **Pause:** P (optional)
- **Mute:** M (optional)

## Config

Tuning constants live in `js/config.js`. Difficulty profile definitions (Relaxed/Standard/Arcade/Custom) live in `js/difficultyProfiles.js`.
