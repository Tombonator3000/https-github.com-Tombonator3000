
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

## [v3.9 Update - The Swarm]
*   **Sequential AI:** Refactored the Mythos phase enemy logic. Enemies now move one by one, checking for occupied tiles to prevent stacking. They will try to surround players rather than occupying the same space.
*   **Escalation Protocol:** 
    *   **Doom 12-9:** Low spawn rate.
    *   **Doom 8-4:** Moderate spawn rate.
    *   **Doom 3-0:** 100% Spawn rate with high chance of double spawns.
*   **Movement Logic:** Confirmed separation of "Wander" (Random patrol) and "Hunt" (Direct pathing) behaviors based on Line of Sight.
