
# Project Log - Shadows of the 1920s

Track all major milestones, feature additions, and bug fixes here.

## [v1.1 - v3.9.21]
*   *(Previous logs collapsed - see history)*
*   **v3.9.21:** Asset Pipeline Upgrade (Local files -> AI Fallback).

## [v3.10.0 - The Roguelite Update]
*   **Scenario Objectives:** Refactored scenarios to use concrete steps (Hero Quest style).
*   **Victory Conditions:** Added `VictoryType` ('escape', 'assassination', 'collection', 'survival').
*   **Random Scenario Generator:** Added "The Unknown Horror" (Scenario 5) which procedurally generates objectives and doom events.
*   **Doom Events:** Implemented a threshold-based event system.
*   **Cursed Items:** Added 5 new items with risk/reward mechanics.
*   **UI Updates:** Added an "Objective Overlay" to track current scenario steps.

## [v3.10.1 - Critical Fix]
*   **Fixed Setup UI Regression:** The advanced character selection screen (Veterans, renaming, detailed stats) was accidentally overwritten during the v3.10.0 refactor. It has been fully restored.
*   **Fixed Start Game Logic:** The `startGame` function now correctly validates names again.
