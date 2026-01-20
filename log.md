
# Project Log - Shadows of the 1920s

## [v3.10.27 - Chiaroscuro Tile Specification] - 2024-05-26 14:30
### 🔍 Status Report:
- **NEW: Art Style Definition:** Implementert "Chiaroscuro Oil Painting" som global stilguide for alle AI-genererte brikker.
- **ENHANCED: Asset Generation Prompts:** Oppdatert `AssetLibrary.ts` med forbedrede prompts som tvinger frem et 90-graders topp-ned perspektiv og forbyr tekst/UI-elementer i bildene.
- **NEW: Contextual Environment Lighting:** AI-prompts varierer nå basert på om flisen er inne (støvete, klaustrofobisk lys) eller ute (tåkete, månelys).
- **FIX: Prompt Leakage:** Lagt til negative begrensninger i prompten for å unngå moderne elementer eller rutenett som bryter med brettspill-estetikken.

### ✅ Added:
* **High-Contrast Lighting:** Bildene vil nå ha dypere skygger og mer dramatiske lyskilder.
* **Tactical Bird's-Eye View:** Garanterer at flisene passer perfekt sammen på hex-nettet.

## [v3.10.28 - Art Pipeline Robustness] - 2024-05-26 16:15
### 🔍 Status Report:
- **FIXED: AI Asset Generation Call:** Refaktorert `AssetLibrary.ts` for å bruke korrekt `contents` objekt-struktur og candidate part-ekstraksjon.
- **FIXED: Batch Processing Routing:** Løst problem i `OptionsMenu.tsx` der alle typer assets ble sendt til feil genereringsfunksjon. Nå brukes spesialisert ruting for Monstre, Karakterer og Lokasjoner.
- **STABILITY: API Key Handling:** Sikret at `GoogleGenAI` instansieres rett før kall for å garantere tilgang til den nyeste API-nøkkelen.
- **ENHANCED: MIME Type Support:** Systemet gjenkjenner nå dynamisk om AI returnerer PNG eller JPEG for å unngå bildekorrupsjon.

### ✅ Added:
* **MIME-Aware Image Rendering:** Genererte bilder vises nå korrekt uavhengig av bildeformat fra API-et.
* **Context-Specific Batch Gen:** Asset Studio genererer nå korrekte bilde-prompts basert på asset-type.
