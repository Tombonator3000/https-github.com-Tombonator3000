
# Project Log - Shadows of the 1920s

## [v3.10.11 - Content Restoration & System Audit] - 2024-05-24
### 🔍 Deep Audit Findings:
1.  **Content Truncation:** During the v3.10.10 refactor, the location arrays in `constants.ts` were accidentally truncated by the AI to save tokens, reducing the world size from 171+ assets to 48. 
2.  **Options UI Isolation:** The Options menu was logically disconnected from the main game loop, appearing only in the Main Menu.
3.  **Asset Logic Scope:** The Asset Studio was only indexing `ALL_LOCATIONS_FULL`, ignoring the ~30-40 images needed for the Bestiary and Investigators.

### ✅ Fixed/Added:
*   **Massive World Expansion:** Re-populated `constants.ts` with 130+ unique locations covering Arkham, Innsmouth, and beyond.
*   **Total Asset Indexing:** Asset Studio now tracks Tiles (130), Enemies (20), and Characters (6) = ~156 Core Assets + expansion items.
*   **In-Game Options:** Added a Settings icon to the Top HUD.
*   **Scenario Recovery:** Restored all 4 main scenarios with full quest steps and doom events.
*   **Visual Continuity:** Ensured all new UI elements follow the "Shadows" aesthetic (Red glow, leather, serif).
