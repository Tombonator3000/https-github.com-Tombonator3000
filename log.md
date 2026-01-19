# Project Log - Shadows of the 1920s

## [v3.10.17 - Line of Sight Implementation] - 2024-05-24 16:15
### 🔍 Status Report:
- **NEW MECHANIC:** Line of Sight (LoS). Enemies now have a vision range (default 3) and cannot see through blocking objects (walls, rubble).
- **VISUALIZATION:** When an enemy is selected on the game board, their field of vision is highlighted with a red spectral overlay.
- **AI ENHANCEMENT:** The Mythos phase now includes a check for player visibility. Enemies will focus on players they can "see" through clear paths.
- **AUDIT:** Ensured `hasLineOfSight` utility is correctly integrated into both rendering and logic layers.

### ✅ Added:
* **Enemy Vision Highlight:** Added `selectedEnemyVisionTiles` memo to `GameBoard.tsx` for real-time LoS visualization.
* **Mythos Awareness:** Updated `App.tsx` logic to acknowledge enemy awareness of players within LoS.
* **UI Feedback:** Added log messages when investigators enter an enemy's line of sight.
