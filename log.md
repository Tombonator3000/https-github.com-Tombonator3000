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

## [v3.10.25 - Eldritch Infrastructure & Tactical Depth] - 2024-05-25 21:10
### 🔍 Status Report:
- **NEW: Dungeon Logic:** Bygninger genereres nå med distinkte inngangspunkter som ofte er blokkert av `Locked Doors` eller `Rubble`.
- **NEW: Hero Quest Mechanics:** Implementert kontekstuelle handlinger. Spilleren må velge mellom f.eks. "Brute Force" (Styrke) eller "Delicate Work" (Insight) for å fjerne hindringer.
- **NEW: Visual Madness Overhaul:** Utvidet `index.html` med avanserte CSS-filtre for Galskap. Paranoia gir nå et klaustrofobisk vignette, mens Hysteri gir fargemetning og risting.
- **FIX: Exploration Flow:** Sikret at nye fliser spawner i klynger ("Sectors") for å skape mer troverdige rom og nabolag fremfor tilfeldige enkelt brikker.
- **NEW: Harbor & Square Visuals:** Lagt til unike maritime og urbane detaljer for havn- og torg-fliser, inkludert vann-animasjoner (CSS).

### ✅ Added:
* **Contextual Action Bar:** Handlingsknapper endres basert på hva som er i nabofeltet.
* **Mental Break Persistence:** Galskapstilstander lagres nå korrekt i `localStorage` og vedvarer mellom økter.
* **Ghost Tiles Enhancement:** Uutforskede nabofelter ser nå ut som falmede skisser i tåken.

## [v3.10.26 - Generative Art Pipeline Fix] - 2024-05-26 10:45
### 🔍 Status Report:
- **FIXED: AI Asset Initialization:** Flyttet instansiering av `GoogleGenAI` fra globalt nivå til funksjonsnivå. Dette løser problemer hvor API-nøkkelen ikke var tilgjengelig ved oppstart, som førte til at bildegenerering feilet.
- **ENHANCED: Asset Studio UI:** Lagt til sanntidsvisning av progresjon og feilhåndtering i Options-menyen.
- **AUDIT: Image Prompts:** Verifisert at bilde-prompts for `gemini-2.5-flash-image` følger retningslinjene for Chiaroscuro og 1920-talls estetikk.
- **STABILITY: Narrative Generation:** Samme rettelse utført i `App.tsx` for å sikre at flavor-tekst generering alltid fungerer når nye rom oppdages.

### ✅ Added:
* **Function-Scoped AI Instances:** Sikrer at den mest oppdaterte API-nøkkelen alltid brukes.
* **Error Resilience:** Systemet hopper nå elegant over fliser som feiler under batch-generering i stedet for å stoppe hele prosessen.
