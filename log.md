
# Project Log - Shadows of the 1920s

Track all major milestones, feature additions, and bug fixes here.

## [Initial Phase]
*   **Core Setup:** Initialized project structure with React, Tailwind, and Lucide-icons.
*   **Engine:** Created a hexagonal grid board with pixel-to-hex conversion logic.
*   **Investigators:** Defined initial character roster: Detective, Professor, Journalist, Veteran, Occultist, and Doctor.

## [v1.1 - v3.8]
*   *(Previous logs collapsed for brevity - see history)*
*   **v3.7:** Dynamic Enemy AI (Wander/Hunt).
*   **v3.8:** Connector System, New Interactables, and expanded Asset Generation.
*   **v3.9:** Sequential Mythos AI & Swarm Logic.

## [v3.9.1 Update - Monsters Unleashed]
*   **Spawn Fixes:** Addressed issue where players encountered zero enemies.
    *   **Gate Rate:** Increased Gate spawn chance on Locations to 30%.
    *   **Room Guardians:** Added a 25% chance for a monster to spawn immediately when a new Location is revealed.
    *   **Event Deck:** Added explicit `spawn` events to the event pool.
*   **Visual Identification:** Implemented distinct icons for different enemy families (Fish for Deep Ones, Biohazard for Shoggoths, etc.) so they are distinguishable on the board without AI images.
