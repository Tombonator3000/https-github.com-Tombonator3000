# Project Log - Shadows of the 1920s

## [v3.10.24 - World Expansion & Madness Realized] - 2024-05-25 16:20
### 🔍 Status Report:
- **FIXED: Exploration Logic:** `spawnRoom` nå oppdaterer `board`-staten umiddelbart med tile-metadata før bilde-generering. Dette fjerner "void"-staten som gjorde at utforskning stoppet opp.
- **RESTORED: Physical Obstacles:** Gjeninnført `Locked Doors`, `Rubble` og `Fire`. Disse blokkerer nå bevegelse og krever spesifikke handlinger for å fjernes.
- **NEW: Diverse Tile Visuals:** Lagt til distinkte teksturer og bakgrunnsikoner for `Harbor`, `Square`, `Market`, `Alley`, `Park`, og `Church`.
- **NEW: Madness System v2:** Full integrasjon av visuelle filtre. Når Sanity treffer 0, utløses en "Mental Break" som gir permanente visuelle og mekaniske forstyrrelser (Hallusinasjoner, Paranoia).
- **NEW: Dungeon Generation:** Forbedret rom-generering for å skape mer logiske innendørs-strukturer med vegger og dører mellom seksjoner.

### ✅ Added:
* **Immediate Tile Spawning:** Utforskning føles nå øyeblikkelig, med bilder som "fades inn" etter hvert som AI-en genererer dem.
* **Skill-Based Obstacle Clearance:** Bruk Strength eller Insight for å forsere hindringer.
* **Atmospheric Vignette:** Paranoia-tilstanden legger nå på et mørkt vignette-filter over hele spillet.
