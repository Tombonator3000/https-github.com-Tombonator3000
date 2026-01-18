
# Project Log - Shadows of the 1920s

Track all major milestones, feature additions, and bug fixes here.

## [Initial Phase]
*   **Core Setup:** Initialized project structure with React, Tailwind, and Lucide-icons.
*   **Engine:** Created a hexagonal grid board with pixel-to-hex conversion logic.
*   **Investigators:** Defined initial character roster: Detective, Professor, Journalist, Veteran, Occultist, and Doctor.

## [v1.1 - v3.9.8]
*   *(Previous logs collapsed for brevity - see history)*
*   **v3.9.6:** Asset Persistence Pipeline.
*   **v3.9.7:** Panel Docking System.
*   **v3.9.8:** Mobile & Tablet Responsiveness.

## [v3.9.9 Update - Modern Settings System]
*   **Advanced Options Menu:** Completely rebuilt the Options Menu with a tabbed interface (Audio, Display, Gameplay, Assets, Data).
*   **Audio Engine Upgrade:** Implemented granular volume controls (Master, Music, SFX) connected to Tone.js.
*   **Accessibility & Graphics:** Added toggles for "Reduce Motion" (disables screen shake), "High Contrast" (removes vignettes/overlays), and "Show Grid".
*   **Settings Persistence:** Game settings are now saved to and loaded from localStorage separately from game state.

## [v3.9.10 Fix - Setup Phase Restoration]
*   **Bug Fix:** Restored the Scenario Selection and Character Selection UI in the Setup Phase, which was temporarily replaced by a placeholder in v3.9.9. The game now correctly transitions from Main Menu to Setup.

## [v3.9.11 Interface & Immersion Update]
*   **Rich Text Log:** The game log now parses keywords using regex to apply dynamic colors (Red for damage/enemies, Purple for Sanity/Magic, Gold for Items). This makes scanning the log much faster.
*   **Keyboard Controls:** Implemented hotkeys: 1-5 for Action Bar slots, SPACE to End Turn, C for Character Panel, L for Log/Map toggle.
*   **New Content:** Added Scenario 4: "The Silent City" (Stealth focus).

## [v3.9.12 Touch Controls]
*   **Touch Interaction:** Implemented native touch event handling for the Game Board.
*   **Gestures:** Added Pinch-to-Zoom and One-Finger Pan support for mobile devices.
*   **Input Smoothing:** Added drag-threshold logic to differentiate between tapping a tile (movement/interaction) and panning the camera.

## [v3.9.13 Combat Polish]
*   **Combat Feedback:** Implemented floating damage numbers ("-2 HP") and hit reactions.
*   **Death Animations:** Enemies now dissolve visually when defeated instead of disappearing instantly.
*   **Screen Shake:** Added impact shake on critical hits and taking damage.
*   **Attack Logic:** Implemented full attack action handling with auto-targeting and dice rolls.

## [v3.9.14 Enemy Behavior Update]
*   **Advanced AI:** Enemies now utilize their 'Speed' stat to move multiple tiles per turn.
*   **Trait Logic:** 
    *   **Flying:** Nightgaunts and Mi-Go can move over obstacles (barricades, rubble).
    *   **Ambusher:** Hounds of Tindalos can teleport to adjacent tiles near players ("emerging from angles").
*   **Attack Types:** Enemies now correctly execute specific attacks:
    *   **Doom:** Dark Priests increase Doom instead of dealing damage.
    *   **Sanity:** Horrors deal Sanity damage directly.

## [v3.9.15 Smart Pathfinding]
*   **A* / BFS Pathfinding:** Enemies now use proper pathfinding to navigate around obstacles like walls and rubble instead of getting stuck.
*   **Tactical Movement:** Ranged enemies now stop at maximum attack range rather than rushing into melee.
*   **Dynamic Blocking:** The AI accounts for other enemies blocking the path when planning movement.

## [v3.9.16 Refactoring & Stability]
*   **Code Separation:** Extracted Hexagonal Math, Line-of-Sight calculations, and Pathfinding (BFS) logic from `App.tsx` into a dedicated `utils/hexUtils.ts` module.
*   **Maintainability:** Reduced main component bloat, making the game loop easier to read and debug.
