
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

## [v3.10.2 - Hotfix]
*   **Fixed Start Loop:** `startGame` now correctly closes the Main Menu.
*   **Fixed Visual Effects:** Restored CSS classes for Madness and High Contrast mode that were lost in previous refactor.

## [v3.10.3 - Critical Fix]
*   **Action Point Reset Bug:** Fixed a major bug where players' Action Points were not resetting after the Mythos phase, causing the "End Turn" button to appear broken (players were stuck at 0 AP).

## [v3.10.4 - Hotfix]
*   **Menu Bypass Regression:** Fixed an issue where the game would skip the Main Menu on initial load and jump straight to Case Files. The `isMainMenuOpen` check was moved to priority #1 in the render pipeline.

## [v3.10.5 - UI Restoration]
*   **Restored Side Panels:** The collapsible Left Sidebar (Character Sheet) and Right Sidebar (Info/Log/Enemy) have been restored.
*   **Restored Inventory Actions:** Implemented logic for `Use`, `Drop`, and `Trade` item actions within the Character Panel.
*   **Integrated Objective Display:** The "Current Objective" overlay is now integrated into the Right Panel header, allowing the entire HUD to be cleaner and collapsible.

## [v3.10.6 - Layout Overhaul & Fixes]
*   **Restored Top HUD:** The Doom, Round Counter, and Current Objective information has been moved back to the top center of the screen for permanent visibility.
*   **Restored Phase Overlay:** The big "Investigator Turn" / "Mythos Phase" notification (TurnNotification) was missing from the render loop and has been restored.
*   **UI Consolidation:** Sidebars are no longer toggled by side-arrows but by new "Char" and "Log" buttons integrated directly into the bottom `ActionBar`. This creates a more cohesive "Control Panel" feel at the bottom of the screen.
