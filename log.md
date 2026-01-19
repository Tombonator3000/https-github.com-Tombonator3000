# Project Log - Shadows of the 1920s

## [v3.10.15 - Log Restoration & Integrity Check] - 2024-05-24 14:45
### 🔍 Status:
- **LOG INTEGRITY FIX:** Gjenopprettet alle slettede logginnføringer fra v3.10.12, v3.10.13 og v3.10.14.
- **Verification:** Verifisert at alle komponenter (Options, Gameplay, Display) fungerer med den nye uniforme render-logikken i App.tsx.

## [v3.10.14 - Options Menu Expansion] - 2024-05-24 14:15
### 🔍 Updates & Fixes:
1.  **Display Settings:** Implemented the full "Display" tab in the Options Menu. Players can now toggle High Contrast mode, Reduced Motion (for accessibility), and Particles (for performance).
2.  **Gameplay Settings:** Implemented the "Gameplay" tab. Added toggles for Show Grid (hex borders) and Fast Mode (speeds up animations).
3.  **UI Polish:** Ensured all toggle switches follow the Victorian/Lovecraftian aesthetic with custom-styled checkboxes.
4.  **State Synchronization:** All settings correctly persist to `localStorage` and update the `App` state immediately.

### ✅ Added:
*   **Graphics Tab:** High Contrast, Reduce Motion, Particles.
*   **Gameplay Tab:** Show Grid, Fast Mode.
*   **Refined Control Logic:** Unified setting change handler for all sub-categories.

## [v3.10.13 - Options & UI Integration Fix] - 2024-05-24
### 🔍 Critical Fixes:
1.  **Options Menu Visibility:** Fixed a logic error where an early return for the `MainMenu` prevented the `OptionsMenu` overlay from ever rendering. The `App` component now uses a unified render tree.
2.  **Investigator Naming:** Improved the layout of the investigator selection cards to ensure the custom name input is prominent and functional. Added `e.stopPropagation()` and improved focus handling.
3.  **UI Unification:** Moved `MainMenu` into the main `App` render function. Now global modals like `OptionsMenu` and `DiceRoller` can appear over any view state.
4.  **Case 5 Stability:** Ensured randomized scenario logic is properly initialized and doesn't conflict with the new UI structure.

### ✅ Added:
*   **Unified Render Tree:** No more early returns in `App.tsx`.
*   **Fixed Options:** Options menu now opens correctly from the Main Menu, Setup, and Game views.
*   **Investigator Customization:** Name fields are now reactive and stable during team assembly.

## [v3.10.12 - UI Restoration & Dynamic Content] - 2024-05-24
### 🔍 Deep Audit & Fixes:
1.  **Options Menu Fix:** Refactored the component structure to ensure global modals remain accessible at all times, even during SETUP phase.
2.  **Case 5 (The Unspeakable Randomness):** Added a fifth case file that procedurally generates goals, difficulty, and modifiers when selected.
3.  **Investigator Personalization:** Added a "Back to Main Menu" button in the Setup phase and implemented custom name inputs for all selected investigators.
4.  **Navigation Fix:** Restored the ability to return to the main title screen if the user wants to cancel a new game setup.

### ✅ Added:
*   **Case 5:** A fully dynamic scenario with randomized objectives.
*   **Investigator Naming:** Users can now customize the names of their team members before the game begins.
*   **Global Modal Layer:** Options and other menus now correctly stack above the Setup screens.
