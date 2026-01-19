# Project Log - Shadows of the 1920s

## [v3.10.18 - Room-Based Map Generation] - 2024-05-24 17:45
### 🔍 Status Report:
- **REFACTOR:** Transitioned from single-tile generation to "Room-Based" generation. Moving to an empty space now spawns a coherent cluster of tiles (a Room) or a Connector (Hallway/Alley).
- **LOGIC:** Rooms are generated using templates (Small, Medium, Large, Linear). Each room shares a name and visual identity, making locations feel like actual structures rather than random hexes.
- **EXPLORATION:** Improved "Fog of War" feel. When entering a room, the entire room is added to the board, but visibility rules (Line of Sight and Range) still dictate what is clearly seen.
- **CONNECTIONS:** The system now alternates between Rooms and Connectors to ensure a sprawling but navigable layout.

### ✅ Added:
* **Room Templates:** Defined `RoomShape` and `spawnRoom` logic in `App.tsx`.
* **Coherent Visuals:** Tiles belonging to the same room are themed together automatically.
* **Navigation Logic:** Improved tile placement to prevent excessive overlap while maintaining connectivity.
