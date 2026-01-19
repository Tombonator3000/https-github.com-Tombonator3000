# Project Log - Shadows of the 1920s

## [v3.10.19 - Atmospheric Restoration & Lighting Audit] - 2024-05-24 19:15
### 🔍 Status Report:
- **AUDIT:** Deep dive into the rendering layers of `GameBoard.tsx`. Found that lighting effects were present but lacked "layer depth" and subtle animations that define the horror atmosphere.
- **RESTORED:** Dynamic "Dark Clouds" layer that drifts across the board, scaling with the Doom level.
- **ENHANCED:** The "Lantern Effect" for investigators is now more reactive and visually prominent, providing a small radius of warm light in the cold dark.
- **ENHANCED:** Doom-based lighting now includes a tightening vignette. As Doom drops, the "darkness" physically encroaches on the screen.
- **FIXED:** Screen shake logic integrated into combat resolution. Taking or dealing significant damage now triggers physical feedback.
- **FIXED:** Restored "Spooky Pulse" and "Doom Flicker" to the board background for low-doom scenarios.

### ✅ Added:
* **Cloud Drift System:** Multi-layered CSS animations for atmospheric fog and clouds.
* **Tightening Vignette:** Procedural shadow overlay that reacts to `state.doom`.
* **Combat Feedback:** `screenShake` triggers on combat events.
* **Madness Visuals:** Verified and polished the connection between `activeMadness` and global CSS filters.
