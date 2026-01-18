
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
