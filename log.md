# Project Log - Shadows of the 1920s

Track all major milestones, feature additions, and bug fixes here.

## [Initial Phase]
*   **Core Setup:** Initialized project structure with React, Tailwind, and Lucide-icons.
*   **Engine:** Created a hexagonal grid board with pixel-to-hex conversion logic.
*   **Investigators:** Defined initial character roster: Detective, Professor, Journalist, Veteran, Occultist, and Doctor.

## [v1.1 Update]
*   **Multiplayer Support:** Refactored state to support 1-4 investigators with turn cycling.
*   **Audio Engine:** Integrated Tone.js for procedural atmospheric music and sound effects.
*   **Persistence:** Added `localStorage` synchronization to save game state across sessions.

## [v1.5 Update - Infinite Board & HUD UI]
*   **Pan & Zoom:** Added ability to drag the board and zoom with the mouse wheel.
*   **HUD Layout:** Redesigned the UI to be non-intrusive floating widgets.
*   **Minimizable Panels:** Character and Log panels can now be collapsed to clear the screen.

## [v1.6 Update - Enemy Intelligence HUD]
*   **Enemy Targeting:** Implemented ability to click on enemies to target them.
*   **Enemy Info Panel:** Created a new UI component showing enemy HP, Damage, and Horror ratings.
*   **Hover States:** Added hover detection on the board to preview enemy stats dynamically.
*   **Visual Effects:** Added a purple pulse ring for targeted enemies.
*   **Combat Logic:** Enemies now attack automatically during the Mythos phase if sharing a tile with a player.
*   **Death System:** Investigators can now die, becoming grayed out and losing actions.

## [v1.7 Update - Case Files (Scenarios)]
*   **Scenario System:** Implemented data structure for distinct game modes (Case Files).
*   **Selection UI:** Created a new "Case File" selection screen before character selection.
*   **Variable Difficulty:** Scenarios now control starting Doom, Goal descriptions, and Clue requirements.
*   **Content:** Added two scenarios: "The Gathering Dark" (Normal) and "Rise of the Deep Ones" (Hard).

## [v1.8 Update - Line of Sight & Environments]
*   **Hex Raycasting:** Implemented Line of Sight (LOS) logic. Enemies now only track players if they have a clear visual path.
*   **Visual FOV:** Added red "danger zone" highlighting for enemy fields of view on the board.
*   **Environmental Logic:** Scenarios now dictate the type of tiles generated (Indoor, Outdoor, or Mixed).
*   **New Content:** Added "The Whispering Manor" scenario (Indoor Only) and split location names into thematic lists.

## [v1.9 Update - Enemy Vision Visualization]
*   **Vision Cone UI:** Enhanced the visualization of enemy sight lines. Hovering over an enemy now clearly highlights all tiles within their vision range and line of sight with a distinct red overlay and eye icon.

## [v2.0 Update - Dungeon Crawl Mechanics]
*   **Physical Obstacles:** Introduced 'blocking' objects (Locked Doors, Rubble, Fire) that prevent movement into a tile until cleared.
*   **Contextual Actions:** The Action Bar now adapts dynamically. Clicking a blocked tile offers specific interactions (e.g., "Break Down Door") instead of generic actions.
*   **Skill Checks:** Implemented specific attribute tests (Strength, Insight, Agility) for clearing obstacles.
*   **Dungeon Generation:** Indoor exploration now has a high chance of spawning obstacles, simulating the feeling of exploring a restricted, dangerous building room-by-room.
