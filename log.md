
# Project Log - Shadows of the 1920s

Track all major milestones, feature additions, and bug fixes here.

## [Initial Phase]
*   **Core Setup:** Initialized project structure with React, Tailwind, and Lucide-icons.
*   **Engine:** Created a hexagonal grid board with pixel-to-hex conversion logic.
*   **Investigators:** Defined initial character roster: Detective, Professor, Journalist, Veteran, Occultist, and Doctor.

## [v1.1 - v3.9.8]
*   *(Previous logs collapsed for brevity - see history)*
*   **v3.9.6:** Asset Persistence Pipeline.
*   **v3.9.7:** Panel Docking System.
*   **v3.9.8:** Mobile & Tablet Responsiveness.

## [v3.9.9 Update - Modern Settings System]
*   **Advanced Options Menu:** Completely rebuilt the Options Menu with a tabbed interface (Audio, Display, Gameplay, Assets, Data).
*   **Audio Engine Upgrade:** Implemented granular volume controls (Master, Music, SFX) connected to Tone.js.
*   **Accessibility & Graphics:** Added toggles for "Reduce Motion" (disables screen shake), "High Contrast" (removes vignettes/overlays), and "Show Grid".
*   **Settings Persistence:** Game settings are now saved to and loaded from localStorage separately from game state.

## [v3.9.10 Fix - Setup Phase Restoration]
*   **Bug Fix:** Restored the Scenario Selection and Character Selection UI in the Setup Phase, which was temporarily replaced by a placeholder in v3.9.9. The game now correctly transitions from Main Menu to Setup.

## [v3.9.11 Interface & Immersion Update]
*   **Rich Text Log:** The game log now parses keywords using regex to apply dynamic colors (Red for damage/enemies, Purple for Sanity/Magic, Gold for Items). This makes scanning the log much faster.
*   **Keyboard Controls:** Implemented hotkeys: 1-5 for Action Bar slots, SPACE to End Turn, C for Character Panel, L for Log/Map toggle.
*   **New Content:** Added Scenario 4: "The Silent City" (Stealth focus).

## [v3.9.12 Touch Controls]
*   **Touch Interaction:** Implemented native touch event handling for the Game Board.
*   **Gestures:** Added Pinch-to-Zoom and One-Finger Pan support for mobile devices.
*   **Input Smoothing:** Added drag-threshold logic to differentiate between tapping a tile (movement/interaction) and panning the camera.

## [v3.9.13 Combat Polish]
*   **Combat Feedback:** Implemented floating damage numbers ("-2 HP") and hit reactions.
*   **Death Animations:** Enemies now dissolve visually when defeated instead of disappearing instantly.
*   **Screen Shake:** Added impact shake on critical hits and taking damage.
*   **Attack Logic:** Implemented full attack action handling with auto-targeting and dice rolls.

## [v3.9.14 Enemy Behavior Update]
*   **Advanced AI:** Enemies now utilize their 'Speed' stat to move multiple tiles per turn.
*   **Trait Logic:** 
    *   **Flying:** Nightgaunts and Mi-Go can move over obstacles (barricades, rubble).
    *   **Ambusher:** Hounds of Tindalos can teleport to adjacent tiles near players ("emerging from angles").
*   **Attack Types:** Enemies now correctly execute specific attacks:
    *   **Doom:** Dark Priests increase Doom instead of dealing damage.
    *   **Sanity:** Horrors deal Sanity damage directly.

## [v3.9.15 Smart Pathfinding]
*   **A* / BFS Pathfinding:** Enemies now use proper pathfinding to navigate around obstacles like walls and rubble instead of getting stuck.
*   **Tactical Movement:** Ranged enemies now stop at maximum attack range rather than rushing into melee.
*   **Dynamic Blocking:** The AI accounts for other enemies blocking the path when planning movement.

## [v3.9.16 Refactoring & Stability]
*   **Code Separation:** Extracted Hexagonal Math, Line-of-Sight calculations, and Pathfinding (BFS) logic from `App.tsx` into a dedicated `utils/hexUtils.ts` module.
*   **Maintainability:** Reduced main component bloat, making the game loop easier to read and debug.

## [v3.9.17 Visual Restoration]
*   **Hex Visuals:** Restored tile borders by applying the correct `strokeColor` to the parent hex container.
*   **Textures:** Increased opacity and improved blending modes for internal CSS patterns to ensure tile types are visually distinct even without AI assets.
*   **UI Polish:** Restored the "tactical map" aesthetic.

## [v3.9.18 Tactical Obstacles & Procedural Gen]
*   **Obstacle Generation:** Procedural generation now includes logical placement of obstacles: Walls/Doors at room entrances, Rubble/Fire in corridors.
*   **Interaction Logic:** Updated interaction handling to support clearing hazards (fire, rubble) and unlocking doors with specific skill checks.
*   **Risk/Reward:** Failing to clear hazardous terrain (like Fire) now deals damage.

## [v3.9.19 Atmosphere Restoration]
*   **Deep Audit:** Fixed Z-index layering issues where weather effects were obscured by game entities or vice versa.
*   **Dynamic Weather:** Implemented a robust weather system that reacts to Scenario Modifiers (Thick Fog, Blood Moon).
*   **Lighting Engine:** Enhanced the dynamic lighting overlay to provide stronger visual cues for Doom progression.

## [v3.9.20 Content & Immersion Update]
*   **Bestiary Overhaul:** Updated `constants.ts` with detailed, atmospheric flavor text and lore for all 16 enemy types.
*   **AI Art Direction:** Refined `visualPrompt` strings for every enemy to ensure generated assets align with the "1920s Oil Painting" art style (High contrast, Chiaroscuro).

## [v3.9.21 Asset Pipeline Upgrade]
*   **Folder Structure:** Implemented standard asset paths:
    *   `/assets/audio/music/ambience.mp3`
    *   `/assets/audio/sfx/[event].mp3`
    *   `/assets/graphics/tiles/[name].png`
    *   `/assets/graphics/characters/[id].png`
    *   `/assets/graphics/monsters/[type].png`
*   **Priority Loading:** Game now prioritizes manual file placement in these folders.
*   **Fallback Logic:** If manual assets are missing:
    *   Visuals fall back to Gemini AI generation.
    *   Audio falls back to Tone.js synthesis.

## [v3.9.22 Asset Folder Setup - 2026-01-18]
*   **Physical Folder Creation:** Created `public/assets/` folder structure on GitHub:
    *   `public/assets/audio/music/` - For background music files
    *   `public/assets/audio/sfx/` - For sound effect files
    *   `public/assets/graphics/tiles/` - For location/tile images
    *   `public/assets/graphics/monsters/` - For enemy creature images
    *   `public/assets/graphics/characters/` - For investigator portrait images
*   **Documentation:** Added `assets/README.md` with complete guide on:
    *   File naming conventions
    *   Supported file formats
    *   List of all expected asset filenames
    *   Fallback behavior explanation
*   **Git Integration:** Added `.gitkeep` files to ensure empty folders are tracked by Git.
*   **Status:** Folder structure is ready for manual asset placement. AssetLibrary.ts is fully functional and will prioritize manual files over AI generation.

## [v3.9.23 Hotfix - GitHub Blue Screen Fix - 2026-01-18]
*   **Critical Bug Fix:** Fixed "blue screen" issue when launching game from GitHub Pages/deployed environments
*   **Root Cause:** GoogleGenAI was initialized at module top-level with `process.env.API_KEY`, causing initialization failure when API key was undefined
*   **Solution:** Implemented lazy AI initialization pattern in both `App.tsx` and `utils/AssetLibrary.ts`:
    *   Created `getAI()` function that only initializes GoogleGenAI when API key exists
    *   AI instance is now created on-demand rather than at module load time
    *   Game gracefully falls back to CSS visuals and Tone.js audio when AI is unavailable
*   **Impact:** Game now starts successfully on GitHub Pages without requiring API key configuration
*   **Files Modified:** `App.tsx`, `utils/AssetLibrary.ts`

---

## [v3.9.24 GAMEPLAY LOOP ANALYSIS - 2026-01-18]
*   **Design Review:** Comprehensive analysis of current gameplay loop and strategic depth
*   **Objective:** Identify opportunities to improve player engagement, replayability, and tactical decisions

### 📊 Current Gameplay Loop Structure
**Turn Flow:**
1. **Setup Phase** → Scenario selection + Character selection (up to 4 investigators)
2. **Investigator Phase** → Each player takes 2 actions: Move, Investigate, Attack, Rest, Flee, Consume, Cast Spell
3. **Mythos Phase** → Enemy AI activates (pathfinding + attacks), Doom decrements, round ends
4. **Victory/Defeat Check** → Win: Find required clues, Lose: Doom reaches 0 or all players dead

**Current Strengths:**
- Solid hex-grid tactical foundation with smooth pathfinding
- Enemy AI is intelligent (BFS pathfinding, traits: flying, ambusher, regenerate)
- Madness system creates atmospheric pressure and unique debuffs
- Veteran/Trait progression system rewards long-term play
- Procedural tile generation with logical obstacle placement
- Strong thematic atmosphere (1920s Lovecraftian horror)

### ⚠️ Critical Improvement Areas

#### 1. **STRATEGIC DEPTH - Add Momentum System**
**Problem:** Player decisions are repetitive. Each turn = Move → Investigate → Attack → End Turn loop.
**Solution:**
- Introduce **Momentum** resource (0-10) that builds when taking risks
- Spend Momentum for: Extra actions, dice re-rolls, special abilities
- Example: "Press Your Luck" - Investigate with +1 die, but lose Sanity on fail
- Creates risk/reward decision-making every turn

#### 2. **LINEAR OBJECTIVES - Multi-Objective System**
**Problem:** All scenarios = "find X clues". No variety.
**Solution:**
- Add **Secondary Objectives** to each scenario
  - "Seal 2 Gates" (+2 Doom reward)
  - "Rescue Civilian" (Escort NPC to exit)
  - "Recover Artifact" (Hidden rare item with unique power)
- Introduce diverse **Victory Types**:
  - Investigation (current)
  - Survival (last X rounds)
  - Escape (reach exit alive)
  - Assassination (kill boss enemy)
  - Ritual (multi-step quest with defend phases)

#### 3. **PREDICTABLE ENCOUNTERS - Dynamic Threat System**
**Problem:** Enemy spawns are random but not dynamic. No escalation mechanics.
**Solution:**
- Add **Alert Level** (0-5) that increases with combat noise, failed stealth
- Alert thresholds trigger different spawn patterns:
  - Level 0-1: No patrols
  - Level 2-3: Regular enemies spawn
  - Level 4: Elite enemies appear
  - Level 5: BOSS RUSH mode (all gates activate)
- Stealth gameplay becomes viable strategy

#### 4. **LACK OF MEANINGFUL CHOICES - Risk/Reward Systems**
**Problem:** Most actions are "safe". No hard decisions or trade-offs.
**Solution:**
- **Cursed Items**: High-power gear with drawbacks ("Deal +3 damage, lose 1 Sanity per turn")
- **Blood Pacts**: Trade HP for Insight at Altars (1 HP = 2 Insight)
- **Desperation Moves**: When HP ≤ 2, unlock powerful risky actions
- **Corruption Mechanic**: Powerful spells that permanently lower Max Sanity

#### 5. **DOOM CLOCK INTERACTIVITY - Doom as Resource**
**Problem:** Doom is passive countdown with no player interaction.
**Solution:**
- Allow players to manipulate Doom:
  - Destroy Altars: +2 Doom, gain Powerful Relic
  - Perform Rituals: -1 Doom, requires sacrificing items/HP
- **Doom Stage Events**: Trigger special events at specific Doom thresholds
  - Doom 10: Normal
  - Doom 7: Blood Moon (Enemies +1 HP)
  - Doom 4: Reality Tears (Tile corruption)
  - Doom 2: Boss spawns
  - Doom 0: Game Over

#### 6. **UNDERDEVELOPED MERCHANT SYSTEM**
**Problem:** Merchant Phase exists but isn't integrated into core loop.
**Solution:**
- Replace dedicated phase with **Random Merchant Spawns** on tiles
- Add **Black Market** mechanic: High-risk areas with rare items + enemy patrols
- Merchant **Mood System**: Affects prices (Friendly/Suspicious/Hostile)
- Trade Insight for items dynamically during exploration

#### 7. **MISSING TEAM SYNERGIES**
**Problem:** In multiplayer, characters play independently. No combos or coordination.
**Solution:**
- **Adjacent Bonuses**:
  - Doctor + Any ally: Healing costs -1 action
  - Veteran + Detective: +1 Combat die when adjacent
- **Coordinated Actions**:
  - "Coordinated Strike": 2+ players attack same enemy for +1 damage each
  - "Covering Fire": Spend action to give ally +1 die
- **Chain Abilities**: Actions that trigger when another player performs specific action

#### 8. **STATIC TILES - Dynamic Tile Evolution**
**Problem:** Once explored/searched, tiles become irrelevant dead space.
**Solution:**
- **Tile Corruption**: As Doom decreases, tiles corrupt and spawn new hazards
- **Re-Spawning Threats**: Gate tiles periodically spawn new enemies
- **Environmental Propagation**: Fire spreads to adjacent tiles over rounds
- **Revisit Events**: "Returning to this location... something has changed"
- Track `tile.timesSearched` and `tile.corruption` for dynamic behavior

#### 9. **PASSIVE EVENTS - Choice-Driven Narrative**
**Problem:** EventCards just happen to player. No agency.
**Solution:**
- Replace single-effect events with **Branching Choices** (2-3 options per event)
- Example: "Ritual Chamber"
  - Option A: "Interrupt ritual" → Combat 3 Cultists, +2 Doom if win
  - Option B: "Sneak past" → Agility test (4+), success = clue, fail = spawn enemies
  - Option C: "Join the chant..." → +3 Insight but gain Madness (risky knowledge)
- Creates narrative tension and meaningful player decisions

#### 10. **NO WIN CONDITION VARIETY**
**Problem:** All scenarios feel the same. Only victory path = find clues.
**Solution:**
- Implement **Victory Type System**:
  - `investigation`: Find clues (current)
  - `survival`: Survive X rounds
  - `escape`: Reach exit tile alive
  - `assassination`: Kill Boss enemy
  - `ritual`: Multi-step quest (find components → reach location → defend 3 rounds)
- Each scenario uses different victory type for diverse gameplay

### 🎯 Priority Implementation Order

**Phase 1: Core Depth (v3.10.0)**
1. Momentum System
2. Choice-Driven Events
3. Risk/Reward Items (Cursed gear, Blood Pacts)

**Phase 2: Strategic Variety (v3.11.0)**
4. Multi-Objective System
5. Dynamic Threat/Alert Level
6. Doom Interactivity

**Phase 3: Multiplayer Depth (v3.12.0)**
7. Team Synergies
8. Coordinated Actions

**Phase 4: Content Expansion (v3.13.0)**
9. Victory Type Variety
10. Dynamic Tile Evolution

### 🔍 Additional Observations
- **Action Economy**: Current 2-action limit works well. Consider Madness effects that modify this.
- **Dice System**: Dice rolling is satisfying. Keep as-is but add more ways to manipulate/re-roll.
- **Inventory Management**: Currently unlimited. Consider weight/slot limit for tactical choices.
- **Character Asymmetry**: Could be stronger. Each class should have 1 unique action only they can perform.

**Recommended Next Steps:**
1. Implement Momentum System first (easiest, highest impact)
2. Convert existing EventCards to choice-driven format
3. Add 2-3 Cursed Items to test risk/reward appetite
4. Playtest and iterate

---

## [v3.10.0 IMPLEMENTATION - Step-Based Scenarios & Cursed Items - 2026-01-18]
*   **Major Gameplay Overhaul:** Implemented concrete, step-by-step objectives for single-player roguelite experience
*   **Type System Expansion:**
    *   Added `VictoryType` enum: 'escape', 'assassination', 'collection', 'survival', 'random'
    *   Added `ScenarioStep` interface with trigger-based completion tracking
    *   Added `DoomEvent` interface for threshold-based dynamic events
    *   Extended `Item` interface with cursed properties
    *   Extended `GameState` with `currentStep`, `collectedItems`, `triggeredDoomEvents`

### 🎯 Redesigned Scenarios (Hero Quest Style)
1. **Escape from Blackwood Manor** (Escape)
   - Step 1: Find Exit Key through investigation
   - Step 2: Locate Exit Door (spawns after key found)
   - Step 3: Use key and escape alive
   - Doom events: Cultists (8), Ghouls (5), Shoggoth Boss (2)

2. **Assassination of the High Priest** (Assassination)
   - Step 1: Hunt and kill the Dark Priest
   - Doom events: Deep Ones (7), Enemy buff (4), Shoggoth (2)

3. **The Ritual of Binding** (Collection)
   - Steps: Find White Candle, Red Candle, Black Candle
   - Final step: Place all candles on Altars
   - Doom events: Hounds (7), Nightgaunts (4)

4. **The Siege of Arkham** (Survival)
   - Step 1: Survive 10 rounds
   - Doom events: Wave 1 Cultists (10), Wave 2 Ghouls (7), Wave 3 Horror (4)

5. **The Unknown Horror** (Randomized)
   - Victory type generated at game start
   - Steps and doom events created dynamically
   - High replayability

### 💀 Cursed Items (Risk/Reward)
1. **Bloodthirsty Dagger** - +3 Combat dice, lose 1 HP after each kill
2. **Cursed Bone Amulet** - +2 Max HP, cannot heal above 4 HP
3. **Mad Prophet's Tome** - +3 Insight, causes Hallucinations
4. **Lens of the Void** - +2 Investigation dice, lose 1 Sanity when finding clues
5. **Living Armor** - -2 Physical damage taken, cannot Rest

### 🎮 Core Systems Implemented
*   **Step Progression System:**
    *   `checkStepProgression()` validates trigger conditions
    *   Quest items spawn with 30% chance on investigate
    *   Special tiles spawn dynamically (Exit Door, Altars)
    *   Victory triggered on final step completion
    *   Clear UI feedback with emojis (✅, 🔑, 🚪, 🕯️)

*   **Doom Events System:**
    *   Events trigger at specific Doom thresholds
    *   No duplicate triggers (tracked in `triggeredDoomEvents`)
    *   Effects: spawn_enemies, spawn_boss, buff_enemies
    *   Logged with ⚠️ warnings for visibility

*   **Cursed Item Effects:**
    *   Bloodthirsty Dagger: HP penalty in attack action
    *   Living Armor: Blocks Rest action entirely
    *   Cursed Bone Amulet: Caps healing at 4 HP
    *   Lens of the Void: Sanity loss in investigate action

*   **Randomized Scenario Generator:**
    *   `generateRandomScenario()` creates unique objectives
    *   Supports all victory types
    *   Generates appropriate steps and doom events
    *   Ensures no two runs are identical

### 📋 Player Experience Improvements
*   Clear objective display at game start
*   Step-by-step progress tracking
*   Visual feedback for quest items (🔑, 🕯️)
*   Emoji-based log entries for quick scanning
*   Curse effects clearly marked with 💀
*   Victory conditions are concrete and understandable

### 🔄 Technical Changes
*   **Files Modified:**
    *   `types.ts`: Added VictoryType, ScenarioStep, DoomEvent interfaces
    *   `constants.ts`: Redesigned SCENARIOS array, added 5 cursed ITEMS
    *   `App.tsx`: Implemented step checking, doom events, cursed effects

*   **Game Loop Integration:**
    *   Step progression checked in: investigate, attack, move, interact actions
    *   Doom events triggered in MYTHOS phase
    *   Cursed effects applied during relevant actions
    *   Survival victory checked on round increment

### 🎉 Impact
*   ✅ Concrete, understandable objectives (Hero Quest style)
*   ✅ 5 distinct victory types for gameplay variety
*   ✅ Roguelite risk/reward with cursed items
*   ✅ Dynamic pressure through doom events
*   ✅ High replayability with random scenario
*   ✅ Clear progression tracking

**Next Priorities:**
1. Playtest all 5 scenarios
2. Balance cursed item risks
3. Add more doom event variety
4. Consider UI improvements for step display

---
