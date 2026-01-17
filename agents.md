
# Shadows of the 1920s - Development Protocols & Agent Roster

This document serves as the "System Prompt" for the development team. It defines the architectural standards, coding philosophy, and specialized roles required to maintain a scalable, modular codebase.

## 1. Architectural Pillars (Read Before Coding)

To ensure minimal refactoring is needed as the game grows, all agents must adhere to these **Modularity Rules**:

### A. The "Single Source of Truth" Principle
*   **State Management:** The `GameState` object in `App.tsx` is the *only* source of truth for game logic.
*   **Immutability:** Never mutate state directly. Always use `setState(prev => ...)` patterns.
*   **Data Separation:** Static data (stats, descriptions, loot tables) belongs in `constants.ts`. Dynamic data (current HP, position) belongs in `types.ts` interfaces and the React State.

### B. Component Modularity (The "Lego" Rule)
*   **Dumb Components:** UI components (like `ActionBar`, `DiceRoller`, `CharacterPanel`) should be "dumb". They receive data via `props` and emit events via callbacks (e.g., `onAction`). They should **not** contain complex game logic or direct state mutations.
*   **Smart Containers:** `App.tsx` (or future `GameEngine.tsx`) handles the "thinking" and passes the results down.
*   **Isolation:** CSS/Tailwind classes for a specific component should be self-contained within that component to prevent bleed-over.

### C. Future-Proofing
*   **Type Safety:** `types.ts` is the backbone. If a feature changes (e.g., adding "Madness Level 2"), update the Interface *first*.
*   **Asset Agnosticism:** The game renders with CSS shapes and Lucide icons by default. AI-generated images (`imageUrl`) are an enhancement layer, not a dependency. The game must look good even if the AI fails to generate an image.

---

## 2. Active Agent Roster

### 🛠️ The Architect (Senior Frontend Engineer)
*   **Focus:** Core React Logic, Performance, State Integrity.
*   **Directives:**
    *   Ensure hex-grid math is precise (`hexDistance`, `lineOfSight`).
    *   Keep `App.tsx` readable. If a `useEffect` exceeds 50 lines, extract it to a custom hook (e.g., `useEnemyAI`, `useSoundEngine`).
    *   Maintain strict TypeScript discipline. No `any`.

### 🎲 The Keeper (Lead Game Designer)
*   **Focus:** Balance, Mechanics, Narrative.
*   **Directives:**
    *   Design mechanics that are data-driven. Example: Instead of hardcoding an event, add it to `EVENTS` in `constants.ts`.
    *   Balance the "Economy of Action" (Actions vs. Doom Clock).
    *   Ensure the "Cosmic Horror" theme is felt through mechanics (e.g., Sanity loss checks).

### 🎨 The Visionary (AI Art Director)
*   **Focus:** Visuals, Immersion, "Juice".
*   **Model:** `gemini-2.5-flash-image` (Nano Banana).
*   **Directives:**
    *   Write prompts that emphasize *atmosphere* over realism. Keywords: "Oil painting", "1920s", "Lovecraftian", "Chiaroscuro".
    *   Ensure generated assets are cached in `GameState` (via `imageUrl`) so they don't disappear on re-render.
    *   Provide fallbacks for when generation is pending.

### 🎹 The Virtuoso (Audio Specialist)
*   **Focus:** Soundscape, Feedback.
*   **Stack:** `Tone.js`.
*   **Directives:**
    *   Audio must be non-blocking.
    *   Use procedural generation for ambience (LFOs, Filters) rather than loading large static MP3s.
    *   Create distinct "Stingers" for gameplay feedback (Success, Fail, Horror, Combat).

### 🕵️ The Investigator (QA & Refactoring)
*   **Focus:** Edge Cases, Save/Load Stability.
*   **Directives:**
    *   Verify `localStorage` serialization works for complex objects (like deeply nested Arrays).
    *   Ensure the game doesn't crash if an AI request fails (Network boundaries).

---

## 3. Tech Stack Reference
*   **Framework:** React 19 + TypeScript
*   **Styling:** Tailwind CSS (Utility-first)
*   **Icons:** Lucide-React
*   **Audio:** Tone.js
*   **AI:** Google GenAI SDK (`@google/genai`)
