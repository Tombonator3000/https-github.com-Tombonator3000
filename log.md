# Project Log - Shadows of the 1920s

## [v3.10.21 - AI & Narrative Foundation] - 2024-05-24 21:45
### 🔍 Status Report:
- **NEW: Monster AI Movement:** Fiender beveger seg nå fysisk på brettet i Mythos-fasen. De bruker `findPath` (BFS) for å jakte på den nærmeste etterforskeren.
- **NEW: Tactical Combat (Enemy Turn):** Fiender som starter sin tur i kontakt med en spiller vil nå angripe automatisk, noe som reduserer etterforskerens HP og Sanity (Horror).
- **NEW: Gemini Narrative Foundation:** Lagt til `generateNarrative`-funksjonalitet som bruker `gemini-3-flash-preview` for å generere atmosfærisk "flavor text" når nye rom oppdages eller monstre dukker opp.
- **AUDIT: Enemy Panel:** Verifisert at `EnemyPanel` korrekt viser alle vitale stats (HP, Damage, Horror, Lore) og er fullt integrert i UI.
- **FIX: Phase Transition:** Sikret at "End Round" trigger `MYTHOS`-fasen korrekt og at AI-prosesserings-logikken kjører ferdig før turen går tilbake til spillerne.

### ✅ Added:
* **AI Pathfinding:** Fiender navigerer rundt hindringer for å nå spillere.
* **Combat Feedback:** Loggføring av fiendtlige angrep og visuelle effekter (floating text) for skade på spillere.
* **Narrative Integration:** Automatiske kall til Gemini ved rom-oppdagelse for å forbedre innlevelsen.

## [v3.10.22 - Tactical Audit & UI Polish] - 2024-05-25 10:15
### 🔍 Status Report:
- **AUDIT:** Full gjennomgang av AI og kampsystem. Alt er bekreftet operativt.
- **ENHANCEMENT:** `EnemyPanel` viser nå "Special Abilities" (Traits) for å gi spilleren bedre oversikt over fiendtlige fordeler (f.eks. Ranged, Massive, Fast).
- **FIX:** Forbedret døds-logikk for spillere i Mythos-fasen. Sjekker nå HP mer nøyaktig under fiendtlige angrep.
- **NARRATIVE:** Verifisert at Gemini Narrative kalles ved `spawnRoom` og `spawnEnemy`. Lagt til "Atmospheric" tag i loggen for disse for bedre synlighet.
- **STABILITY:** Sikret at `log.md` bevares og kun oppdateres med nye hendelser.

### ✅ Added:
* **Special Abilities Display:** Viser fiendens traits direkte i kamp-panelet.
* **Refined Combat AI:** Fiender prioriterer angrep fremfor bevegelse hvis de allerede er i nærkamp-rekkevidde.

## [v3.10.23 - Madness & Obstacles Expansion] - 2024-05-25 14:30
### 🔍 Status Report:
- **NEW: Madness System:** Når Sanity treffer 0, "knekker" etterforskeren. De får en permanent `Madness Condition` (Hallusinasjoner, Paranoia, Hysteri) og visuelle filtre legges på hele skjermen.
- **NEW: Physical Obstacles:** Tiles kan nå inneholde `Locked Doors`, `Rubble`, `Fire` og `Ritual Sigils`. Disse blokkerer bevegelse (`blocking: true`).
- **NEW: Contextual Skill Checks:** Lagt til interaksjonslogikk. Spilleren kan klikke på en blokkert dør for å utføre en `Strength`-test eller en `Insight`-test for å bryte seg gjennom.
- **ENHANCED: Tile Visuals:** Fullstendig overhaling av teksturer. Tregulv for herregårder, brostein for gater, og rituelle symboler for kirker.
- **ENHANCED: Room Generation:** 40% sjanse for at dør-brikker eller hindringer spawner mellom rom-seksjoner, noe som tvinger spillerne til å bruke handlinger på å åpne veien.

### ✅ Added:
* **Visual Madness Filters:** CSS-filtre i `index.html` som aktiveres basert på `activeMadness`.
* **Obstacle Interaction:** Handlingslinjen oppdateres dynamisk når man står ved siden av en hindring.
* **Complex Tile Metadata:** Hver tile-type har nå unike visuelle kjennetegn og bakgrunnsikoner.
