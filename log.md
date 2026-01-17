
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

## [v2.1 Update - Tile Graphics]
*   **Procedural Visuals:** Implemented a system in `GameBoard` to assign specific visual themes (Wood, Cobblestone, Tiles, Swamp) to board tiles based on their name.
*   **CSS Patterns:** Used CSS gradients to create lightweight textures (planks, stones, dirt) without external assets.
*   **Watermarks:** Added thematic icons (Book, Tree, Cross, Anchor) as background watermarks for tiles to improve readability and atmosphere.

## [v2.2 Update - Searchable Objects]
*   **Container Objects:** Added Chests, Crates, Bookshelves, and Cabinets as spawnable objects.
*   **Targeted Investigation:** The 'Investigate' action now prioritizes searching these objects if present on the tile.
*   **Loot Logic:** Searching a container has a high chance of dropping Items or Clues compared to searching an empty room.
*   **Visual Indicators:** Searchable objects appear as gold/amber icons on the board and turn gray/dim when successfully searched.

## [v2.3 Update - Veteran System (Campaign Mode)]
*   **Investigator Persistence:** Implemented a secondary save system (`shadows_1920s_roster`) to store characters between games.
*   **Save Mechanics:** Players can now save surviving investigators on the Game Over screen. This preserves their HP, Sanity, Inventory, Insight, and Madness.
*   **Roster UI:** Added a tabbed interface in the Character Selection screen to switch between "New Recruits" (default stats) and "Veterans" (saved stats).
*   **Legacy Features:** Veterans appear with a gold border and a list of their carried equipment in the selection screen.

## [v2.4 Update - Madness Mechanics]
*   **Gameplay Impact:** Specific madness conditions now apply mechanical penalties:
    *   *Paranoia:* Disables the 'Rest' action.
    *   *Hysteria:* -1 Die on all skill checks.
    *   *Catatonia:* Limits actions to 1 per turn.
*   **Visual Overhaul:** Updated CSS shaders for madness effects (hallucinations, vignettes, color shifting).

## [v2.5 Update - Personalized Identity]
*   **Renaming:** Players can now click on the name of a selected character during the Setup phase to rename them.
*   **UI Integration:** Added inline input fields for selected character cards that blend with the card design.
*   **Veteran Renaming:** Saved veterans can also be renamed before starting a new case, allowing for character evolution or correction.

## [v2.6 Update - Visual Juice, Inventory & Advanced AI]
*   **Floating Text:** Added animated damage numbers and status effects (-HP, -SAN, +INSIGHT) that float up from entities.
*   **Screen Shake:** Added impact shake on heavy damage or madness triggers.
*   **Inventory Management:** Players can now `Trade` items with others on the same tile or `Drop` unwanted items.
*   **Advanced Enemy AI:** 
    *   Added `Ranged` enemies (Snipers) that shoot from 3 tiles away.
    *   Added `Doom` casters (Priests) that increase Doom instead of dealing damage.
    *   Enemies now check Line of Sight and Range before deciding to move or attack.

## [v2.7 Update - The Imaginarium (Nano Banana Integration)]
*   **Generative Art:** Integrated `gemini-2.5-flash-image` model to generate dynamic assets on the fly.
*   **Character Portraits:** Selecting a character now generates a unique, oil-painting style portrait based on their class (e.g., Detective, Occultist).
*   **Dynamic Environments:** Entering a new tile generates an atmospheric background image specific to that location (e.g., "Misty Docks", "Abandoned Manor"), replacing generic CSS patterns.
*   **Monster Visualization:** Targeting an enemy generates a terrifying illustration of the specific creature type.
*   **Asset Persistence:** Generated images are stored in the game state, ensuring continuity throughout the session.

## [Audit & Roadmap - State Analysis]
*Current status audit conducted to identify gaps in gameplay depth and polish.*

### 1. Dynamic Sound
*   **Missing:** Audio is a static loop.
*   **Improvement:** Adaptive music that increases tempo/dissonance as Doom decreases.
*   **Priority:** Low.

### 2. Endgame Screen
*   **Missing:** Detailed feedback on performance.
*   **Improvement:** Add a "Debriefing" screen with stats (Damage Dealt, Clues Found, Rounds Survived).
*   **Priority:** Medium.
