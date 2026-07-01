# Tempest-Style Web Shooter

Standalone HTML/CSS/JavaScript arcade game inspired by Tempest (1981). No backend, no build step, no dependencies. Player sits on the rim of a tube, shoots inward at enemies crawling out from the center, and has a limited-use Super Blaster panic button.

## How to Run

Open `index.html` directly in Microsoft Edge, or serve the folder with any static file server (recommended for consistent ES module loading in some setups), e.g. the VS Code "Live Server" / Live Preview extension pointed at `index.html`.

No install step, no Python, no build tooling required.

## Controls

- **Move:** Mouse left/right (rotates around the tube's rim, wraps at the ends)
- **Shoot:** Hold left mouse button (fires repeatedly, capped by cooldown)
- **Super Blaster:** Space bar (clears the board; limited charges, refills each level)
- **Click** on the title/game-over screen starts/restarts a run

The game requests Pointer Lock on click so mouse rotation is unbounded (not clamped at your monitor's edge). Press Escape to release it; clicking the canvas again re-acquires it.

## Difficulty Profiles

Choose on the title screen:
- **Relaxed** — slower/sparser enemies, more lives-saving forgiveness, jumper/shooter enemies unlock later
- **Standard** — baseline pacing
- **Arcade** — fast, dense, unforgiving, all enemy types from level 1
- **Custom** — Standard baseline with sliders for enemy speed and spawn rate

Your last-selected profile and Custom slider values persist across reloads via `localStorage`.

## Progression

Levels clear by hitting a kill quota (grows each level). Clearing a level awards a score bonus, refills Super Blaster charges, and ramps enemy speed/spawn rate further (governed by the active profile's per-level increments and hard caps).

## Config

- `js/config.js` — core tuning constants (speeds, cooldowns, timings, scoring)
- `js/difficultyProfiles.js` — the four difficulty profiles and their per-profile scaling/caps/unlock levels

## Known Limitations

- Pause (P/Escape) and mute (M) are stubbed but not wired to input — the game currently always runs unpaused, and `js/audio.js`'s sound hooks are silent no-ops (called at the right moments, ready for real sound assets).
- Single tube shape (circle); the original game varies tube geometry per level.
- No gamepad support.

## Browser Tested

Microsoft Edge (Chromium) on Windows 11.
