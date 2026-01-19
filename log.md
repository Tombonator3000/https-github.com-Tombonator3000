
# Project Log - Shadows of the 1920s

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
