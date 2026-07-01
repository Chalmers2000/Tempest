Implement docs/Arena_Geometry_Spec.md in the tempest-web/ game.

Work milestone by milestone (§11). After each milestone, stop and run the
relevant sections of docs/Arena_Geometry_Test_Plan.md before continuing.

Hard constraints: no build step, no dependencies, no Python — shape data is
hand-authored JS. Milestone 1 must keep the Circle pixel-identical to the
current build (parity is the gate). Preserve the existing geometry.js function
signatures so renderer.js/collision.js call sites stay unchanged.

When done, all sign-off items in the test plan (§7) must pass, including the
?selftest console harness reporting "0 failed".