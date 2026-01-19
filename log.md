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
