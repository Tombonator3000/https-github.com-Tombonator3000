
# Project Log - Shadows of the 1920s

## [v3.12.1 - Mobile UI & Touch Optimization] - 2026-01-19
### 🔍 Status Report:
- **NEW: Touch Gesture System:** Implementert fullstendig touch-støtte med pan og pinch-to-zoom for GameBoard.
- **NEW: Mobile Detection Hook:** `useIsMobile()` og `useTouchGestures()` hooks i ny `utils/useMobile.ts`.
- **ENHANCED: Responsive Side Panels:** CharacterPanel og LogPanel er nå fullskjerm på mobil med backdrop og lukkeknapper.
- **ENHANCED: Footer & ActionBar:** Optimalisert for touch med større trykk-områder og responsiv layout.
- **ENHANCED: CSS Touch Optimization:** Lagt til safe-area insets, momentum scrolling, og touch-feedback styling.

### ✅ Added:
* **`utils/useMobile.ts`:** Ny utility-fil med mobil-relaterte hooks:
  - `useIsMobile()` - Detekterer touch-enheter og små skjermer
  - `useTouchGestures()` - Håndterer pan/drag og pinch-to-zoom
  - `useHapticFeedback()` - Vibrasjons-feedback på støttede enheter
* **GameBoard Mobile Controls:**
  - Zoom inn/ut knapper på høyre side
  - Sentrer-på-spiller knapp (Crosshair)
  - Zoom-indikator (prosent)
  - Responsiv hex-størrelse (90px mobil, 110px desktop)
* **Panel Improvements:**
  - Fullskjerm paneler på mobil
  - Mørk backdrop når panel er åpen
  - Touch-vennlig lukkeknapp
* **CSS Enhancements:**
  - `safe-area-bottom/top` for notched devices
  - `momentum-scroll` for iOS smooth scrolling
  - `no-select` for å forhindre tekst-markering
  - `hide-scrollbar` for renere mobil-UI
  - Minimum touch target størrelse (44px)
  - Landscape-tilpasninger

### 📁 Endrede filer:
- `utils/useMobile.ts` (ny)
- `components/GameBoard.tsx`
- `components/ActionBar.tsx`
- `components/CharacterPanel.tsx`
- `components/LogPanel.tsx`
- `App.tsx`
- `index.html`

---

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
